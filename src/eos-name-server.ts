const fs = require('fs')
const http = require('http')
const cors = require('cors')
const https = require('https')
const btcpay = require('btcpay')
const express = require('express')
const bodyParser = require('body-parser')
const nano = require('nano')
const eosjs = require('eosjs')
const { bns } = require('biggystring')
const rp = require('request-promise')
const fetch = require("isomorphic-fetch")
import { GetTokens } from '@eoscafe/hyperion'
const { JsonRpc } = require("@eoscafe/hyperion")
import request from 'request-promise'
const secp256k1 = require('secp256k1')
const keypair = btcpay.crypto.load_keypair(new Buffer.from('1f3ad04df972593d8de26a33faf852361bc097ecc5471b0e057868fa04fb3595', 'hex'))
const btcPayClient = new btcpay.BTCPayClient('https://btcpay.teloscrew.com', keypair, {merchant: '8iDFCwi2XUCTXBmFsKcCvKNXfTm5R2ozhDaYgRefZFpP'})
console.log('btcPayClient: ', btcPayClient)
const CURRENCY_CODE = 'tlos'
const CONFIG = require(`../config/${CURRENCY_CODE.toLowerCase()}/${CURRENCY_CODE.toLowerCase()}ServerConfig`)
const hyperionRpc = new JsonRpc(CONFIG.hyperionEndpoint, { fetch })

import {
  currentEosSystemRates,
  currentCryptoListings
} from './common'
import {
  updateExchangeRates,
  getLatestEosActivationPriceInSelectedCryptoCurrency
} from './exchangeRates'


const ENV = {
  clientPrivateKey: null,
  merchantData: null,
  port: process.env.PORT || 80
}

const eos = eosjs(CONFIG.eosjs)

const { ecc, format } = eosjs.modules

const publicKey = ecc.privateToPublic(CONFIG.eosCreatorAccountPrivateKey)

let creatorAccountName
let app
let credentials = {}

/***
 *      _________________________ _________________________ _____________
 *     /   _____/\__    ___/  _  \\______   \__    ___/    |   \______   \
 *     \_____  \   |    | /  /_\  \|       _/ |    |  |    |   /|     ___/
 *     /        \  |    |/    |    \    |   \ |    |  |    |  / |    |
 *    /_______  /  |____|\____|__  /____|_  / |____|  |______/  |____|
 *            \/                 \/       \/
 *
 */

console.log('about to try')
let invoiceTxDb

async function init () {
  try {
    fs.readFile(CONFIG.clientPrivateKeyFullPath, 'hex', (err, data) => {
      // 634("Client private key: ", new Uint8Array(Buffer.from(data)).join('') )
      console.log('Client private key: ', data)
      if (err) {
        getErrorObject('FailureReadingAPIClientPrivateKey', 'Error reading API private key for identifying to BTCPay Server. Please generate with a call to generateAndSavePrivateKey path.', err)
      }

      ENV.clientPrivateKey = data
      if (ENV.clientPrivateKey === null || ENV.clientPrivateKey === undefined) {
        console.log('WARNING: CLIENT PRIVATE KEY NOT DETECTED. REQUIRED FOR COMMUNICATION WITH BTCPAY SERVER')
      }
    })
    // console.log('READING Client private key...')

    fs.readFile(CONFIG.merchantPairingDataFullPath, 'utf8', (err, data) => {
      if (err) {
        getErrorObject('FailureReadingAPIClientMerchantCode', 'Error reading API merchant code for identifying to BTCPay Server. Please get this On BTCPay Server > Stores > Settings > Access Tokens > Create a new token, (leave PublicKey blank) > Request pairing, and enter code into API CONFIG.oneTimePairingCode.', err)
      }

      if (data === null || data === undefined) {
        console.log('WARNING: MERCHANT CODE NOT DETECTED. REQUIRED FOR COMMUNICATION WITH BTCPAY SERVER.')
      } else {
        ENV.merchantData = JSON.parse(data)
        console.log('MERCHANT DATA: ', ENV.merchantData)
      }
    })
    // console.log('READING Client merchant code...')
  } catch (e) {
    ENV.clientPrivateKey = null
  }

  try {
    // Promise
    // eos.getBlock(1)
    //   .then(result => {
    //     console.log('Get EOS Block Response: ', result)
    //   })
    //   .catch(error => {
    //     console.error('Error in Get EOS Block Response: ', error)
    //   })

    queryAccountName()
      .then(async (accountNameResults) => {
        console.log('EOS Account Name Query accountNameResults: ', accountNameResults)
        const accountName = accountNameResults.account_names[0]

        // rpc.get_currency_balance('eosio.token', result.account_names[0], 'EOS').then((balance) => console.log(balance))

        // Promise
        const accountTokens: GetTokens = await hyperionRpc.get_tokens(accountName)
        // console.log('accountTokens: ', accountTokens)
        const primaryToken = accountTokens.tokens.find(token => {
          // kylan hard-code, remove to config later
          return token.symbol === CURRENCY_CODE
        })
      })
      .catch(error => {
        console.log('Error in EOS Account Name Query Result: ', error)
      })
  } catch (e) {
    throw new Error('Error in EOS startup checks: ', e)
  }

  // PRICING
  try {
    // testing pricing
    getLatestEosActivationPriceInSelectedCryptoCurrency('BTC')
      .then(result => {
        console.log('getLatestEosActivationPriceInSelectedCryptoCurrency.result : ', result)
      })
      .catch(error => {
        console.log(error)
        throw new Error('ERROR in getLatestEosActivationPriceInSelectedCryptoCurrency() : ', error)
      })
  } catch (e) {
    throw ('Error in PRICING startup calls: ', e)
  }

  /***
   *                                    _____
   *      ____ _____    ____   ____   _/ ____\___________
   *     /    \\__  \  /    \ /  _ \  \   __\/  _ \_  __ \
   *    |   |  \/ __ \|   |  (  <_> )  |  | (  <_> )  | \/
   *    |___|  (____  /___|  /\____/   |__|  \____/|__|
   *         \/     \/     \/
   *                               .__         .______.
   *      ____  ____  __ __   ____ |  |__    __| _/\_ |__
   *    _/ ___\/  _ \|  |  \_/ ___\|  |  \  / __ |  | __ \
   *    \  \__(  <_> )  |  /\  \___|   Y  \/ /_/ |  | \_\ \
   *     \___  >____/|____/  \___  >___|  /\____ |  |___  /
   *         \/                  \/     \/      \/      \/
   */

  const nanoDb = nano(CONFIG.dbFullpath)
  console.log('CONFIG.dbFullpath: ', CONFIG.dbFullpath)
  invoiceTxDb = nanoDb.db.use('invoice_tx')

  try {
    console.log('DB check & init')

    // nanoDb.db.destroy('invoice_tx',(err, body) => {
    //   if (err) {
    //     console.log( '***ERROR destroying db: invoice_tx', err)
    //   } else{
    //     console.log('database invoice_tx destroyed!', body)
    //   }
    // })

    nanoDb.db.get('invoice_tx', (err, dbResponse) => {
      console.log('err: ', err)

      switch (true) {
        case err && err.error === 'not_found':
          throw (new Error('invoice_tx database does not exist.'))
        case err && err.error === 'nodedown':
          throw (new Error('Database appears to be down.'))
        default:
          console.log('dbResponse: ', dbResponse)
          break
      }
    })
  } catch (e) {
    console.log('ERROR in DB check & init', e)
  }
  // =============================================================================

  app = express()

  try {
    credentials = {
      key: fs.readFileSync(CONFIG.serverSSLKeyFilePath, 'utf8'),
      cert: fs.readFileSync(CONFIG.serverSSLCertFilePath, 'utf8'),
      ca: fs.readFileSync(CONFIG.serverSSLCaCertFilePath, 'utf8')
    }
  } catch (e) {
    console.log('Error reading server SSL data:', e)
  }
}

init()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Starting both http & https servers
const httpServer = http.createServer(app)
const httpsServer = https.createServer(credentials, app)

/***
 *    __________ ________   ____ _________________________ _________
 *    \______   \\_____  \ |    |   \__    ___/\_   _____//   _____/
 *     |       _/ /   |   \|    |   / |    |    |    __)_ \_____  \
 *     |    |   \/    |    \    |  /  |    |    |        \/        \
 *     |____|_  /\_______  /______/   |____|   /_______  /_______  /
 *            \/         \/                            \/        \/
 *
 */

// const routes = require("./routes/routes.js");

app.get(CONFIG.apiVersionPrefix + '/', function (req, res) {
  console.log('get /  part 1')
  res.status(200).send({ message: `Welcome to ${CONFIG.apiPublicDisplayName}` })
})

app.get(CONFIG.apiVersionPrefix + '/invoiceTxs', cors(), async function (req, res) {
  console.log('get /invoicesTxs')

  const params = {
    dateStart: '2020-01-01',
    dateEnd: '2020-03-24',
    limit: 50,
    offset: 0
  }
  btcPayClient.get_invoices({
    params,
    token: '8iDFCwi2XUCTXBmFsKcCvKNXfTm5R2ozhDaYgRefZFpP'
  })
  .then(rates => {
    console.log(rates)
  })
  .catch(err => {
    console.log(err)
  })

  // let request = require('request');

  // let resource_url = 'https://btcpay.teloscrew.com/invoices'

  // const message = resource_url
  // const messageBuff = Buffer.alloc(32)
  // messageBuff.write(message, 'utf-8')
  // console.log('messageBuff: ', messageBuff)
  // const privKey = Buffer.from('1f3ad04df972593d8de26a33faf852361bc097ecc5471b0e057868fa04fb3595', 'hex')
  // const privKeyBuff = Buffer.alloc(32)
  // privKeyBuff.write(privKey.toString(), 'utf-8')
  // const sigObj = secp256k1.sign(messageBuff, privKeyBuff)
  // const sigHex = sigObj.signature.toString('hex')
  // console.log('sigHex is: ', sigObj.signature.toString('hex'))
  // let token = '8iDFCwi2XUCTXBmFsKcCvKNXfTm5R2ozhDaYgRefZFpP'
  // let dateStart = '2020-1-24'
  // let dateEnd = '2020-3-23'
  // let limit = '50'
  // let offset = '0'
  // let headers = {
  //    "x-accept-version": "2.0.0",
  //    "Content-Type": "application/json",
  //    "x-identity": "02b4affa3d4b3f8af32117576ebc80ffa0a17bb0aec40f6668dc9a884d562e399b",
  //    "x-signature": sigHex
  // };
  // let options = {
  //    url: resource_url +
  //     '?token=' + token +
  //       '&dateStart=' + dateStart +
  //       '&dateEnd=' + dateEnd +
  //       '&limit=' + limit +
  //       '&offset=' + offset,
  //    method: 'GET',
  //    headers: headers,
  //    json: true
  // };

  // request(options, function (error, response, body) {
  //     console.log('response: ', response)
  //     console.log('body: ', body)
  // })
})

app.get(CONFIG.apiVersionPrefix + '/invoiceTxs1', cors(), async function (req, res) {
  console.log('get /invoicesTxs1')

  try {
    let post_data = {
       "id": "Tf7enNrg1xniCef9HU55GAzS71x8vwaccES",
       "facade": "merchant"
    };
    const headers = {
      "x-accept-version": "2.0.0",
      "Content-type": "application/json",
      "x-identity": "02b4affa3d4b3f8af32117576ebc80ffa0a17bb0aec40f6668dc9a884d562e399b",

    }
    const body = {
      id: 'CNNgnhTLiZx1Dug6VudVPRR3aNeamtwgNWrerVwsuPxB'
    }
    const url = 'https://btcpay.teloscrew.com/tokens'
    const options = {
      url,
      method: 'POST',
      json: post_data,
      headers: headers
    }
    const message = url + JSON.stringify(body)
    const messageBuff = Buffer.alloc(32)
    messageBuff.write(message, 'utf-8')
    console.log('messageBuff: ', messageBuff)
    const privKey = Buffer.from('1f3ad04df972593d8de26a33faf852361bc097ecc5471b0e057868fa04fb3595', 'hex')
    const privKeyBuff = Buffer.alloc(32)
    privKeyBuff.write(privKey.toString(), 'utf-8')
    const sigObj = secp256k1.sign(messageBuff, privKeyBuff)
    console.log('sigObj is: ', sigObj)
    headers['x-signature'] = sigObj

    const response = await request()
    const data = await response.json()
    // const results = []
    // body.rows.forEach((doc) => {
    //   // console.log(doc)
    //   const data = invoiceTxDb.get(doc.id)
    //   results.push(data)
    // })
    // const invoiceTxData = await Promise.all(results)
    // invoiceTxData.sort((a, b) => b.invoiceTime - a.invoiceTime)
    console.log('response: ', response)
    console.log('data: ', data)
    res.status(200).send(response)
  } catch (e) {
    console.log('get /invoicesTxs error: ', e)
  }
})

app.get(CONFIG.apiVersionPrefix + '/ ', function (req, res) {
  console.log('get / part 2')
  // https://github.com/btcpayserver/node-btcpay
  try {
    const keypair = btcpay.crypto.generate_keypair()
    const writeCallback = (err, data) => {
      if (err) {
        console.log('Error in generating and saving private key.', err)
        if (err.code && err.code === 'EEXIST') {
          res.status(500).send({
            message: 'Error in generating and saving private key.',
            err: err,
            pk: ENV.clientPrivateKey
          })
        }
      } else {
        console.log('PRIVATE KEY:' + keypair.priv)
        ENV.clientPrivateKey = keypair.priv
        res.status(200).send({message: 'Private key saved to server.', PK: keypair.priv})
      }
    }
    fs.writeFile(CONFIG.clientPrivateKeyFullPath, keypair.priv, {encoding: 'hex', flag: 'wx'}, writeCallback)
  } catch (e) {
    console.log('Error in generating and saving private key.', e)
    res.status(500).send({message: 'Error in generating and saving private key.'})
  }
})

app.get(CONFIG.apiVersionPrefix + '/pairClientWithServer', function (req, res) {
  // BASED on https://support.bitpay.com/hc/en-us/articles/115003001183-How-do-I-pair-my-client-and-create-a-token-
  // the received code needs to be plugged in to the btcpay server admin console to complete the pairing operation
  // to manually approve a pairing code (only needed once per client) for btcpay server visit: https://<your.btcpay.server.instance>/api-access-request?pairingCode=<your pairing code>
  // also see : https://github.com/btcpayserver/node-btcpay#Pairing

  let client
  console.log('pairClientWithServer()')
  const writeCallback = (err, data) => {
    if (err) {
      console.log('Error in pairing and saving merchant code.', err)
      if (err.code && err.code === 'EEXIST') {
        res.status(500).send({
          message: 'Error in pairing and saving merchant code.',
          err: err,
          merchant: ENV.merchantData
        })
      }
    } else {
      console.log('Merchant code saved to server.')
    }
  }


  try {
    client = getBtcPayClient()
    console.log('kylan in pairWithClientServer')
    client
    .pair_client(CONFIG.oneTimePairingCode) // get this On BTCPay Server > Stores > Settings > Access Tokens > Create a new token, (leave PublicKey blank) > Request pairing
    .then((pairResponse) => {
      console.log('pairResponse: ' ,pairResponse)
      if (pairResponse.merchant) {
        const pairResponseBuffer = Buffer.from(JSON.stringify(pairResponse))

        fs.writeFile(CONFIG.merchantPairingDataFullPath, pairResponseBuffer, {encoding: 'hex', flag: 'wx'}, writeCallback)
        console.log('MERCHANT CODE:' + pairResponse.merchant)
        ENV.merchantData = pairResponse.merchant
        res.status(200).send({
          message: 'Merchant code saved to server.',
          merchantCode: pairResponse.merchant
        })
      } else {
        res.status(500).send({message: `Error while pairing client to BTCPay server at "${CONFIG.btcpayServerHostName}". Check BTCPay server configs, and make sure BTCPay server is up and running.`})
      }
    })
    .catch((e)=>{
      res.status(500).send({message: `Error while pairing client to BTCPay server at "${CONFIG.btcpayServerHostName}". Check BTCPay server configs, and make sure BTCPay server is up and running.`, e})
    })
  } catch (e) {
    res.status(500).send({message:`Error while pairing client to BTCPay server at "${CONFIG.btcpayServerHostName}". Check BTCPay server configs, and make sure BTCPay server is up and running.`, e})
  }
})

app.get(CONFIG.apiVersionPrefix + '/rates/:baseCurrency?/:currency?', function (req, res) {
  console.log('get /rates/:baseCurrency?/:currency?')
  const baseCurrency = req.params.baseCurrency || 'BTC'
  const currency = req.params.currency || 'USD'
  const client = getBtcPayClient()
  console.log('in /rates/:baseCurrency')
  client.get_rates(`${baseCurrency}_${currency}`, CONFIG.btcpayStoreId)
    .then((rates) => {
      // console.log(rates)
      res.status(200).send({message: 'Rates response', rates: rates})
    })
    .catch((err) => {
      console.log(err)
      res.status(500).send({message: 'Error in rates response', err: err})
    })
})

app.get(CONFIG.apiVersionPrefix + '/getSupportedCurrencies', function (req, res) {
  console.log('/getSupportedCurrencies called: ', CONFIG.supportedCurrencies)
  res.status(200).send(CONFIG.supportedCurrencies)
})

app.post(CONFIG.apiVersionPrefix + '/activateAccount', function (req, res) {
  // validate body
  console.log('in POST /activatAccount and req: ', req)
  const body = req.body
  const errors = []
  // expectedParams
  const bodyParams = ['currencyCode', 'requestedAccountName', 'ownerPublicKey', 'activePublicKey']

  let requestedPaymentCurrency = ''
  let requestedAccountName = ''
  let invoiceTx = {}

  const validations = [
    () => {
      // body has necessary parameters
      if (typeof (body) !== 'undefined' && typeof (body) === 'object' && body) {
        bodyParams.forEach((param) => {
          // console.log(`Validating: ${param}...`)
          if (body.hasOwnProperty(param) && typeof body[param] !== 'undefined' && body[param] && body[param].length > 0 && typeof (body[param]) === 'string') {
            switch (param) {
              case 'currencyCode':
                console.log(`currency code requested : ${body[param]}`)
                if (isSupportedCurrency(body[param]) === false) {
                  errors.push(
                    getErrorObject(
                      `CurrencyNotSupported`,
                      `This currency '${body[param]}' by this API is not supported at this time.`,
                      {supportedCurrencies: CONFIG.supportedCurrencies}
                    )
                  )
                } else {
                  requestedPaymentCurrency = body[param]
                }
                break
              case 'requestedAccountName':
                if( body[param].length != 12 ) {
                  errors.push(
                    getErrorObject(
                      `InvalidAccountNameFormat`,
                      `The requested account name "'${body[param]}'" is not 12 characters long. This server is not prepared to handle bidding on acccount names shorter than 12 characters for the EOS network.`
                    )
                  )
                }

                try {
                  format.encodeName(body[param]) // throws error on failed validation
                  requestedAccountName = body[param]
                } catch (e) {
                  errors.push(
                    getErrorObject(
                      `InvalidAccountNameFormat`,
                      `The requested account name "'${body[param]}'" appears to be invalid.`,
                      e
                    )
                  )
                }
                break
              case 'ownerPublicKey':
              case 'activePublicKey':
                if (ecc.isValidPublic(body[param]) !== true) {
                  errors.push(
                    getErrorObject(
                      `InvalidEosKeyFormat`,
                      `The key provided "'${body[param]}'" appears to be invalid.`
                    )
                  )
                }
                break
            }
          } else {
            errors.push(
              getErrorObject(
                `Invalid_${param}`,
                `${param} is NOT defined as a string in the incoming body.`
              )
            )
          }
        })
      } else {
        errors.push(
          getErrorObject(
            `Invalid_POST_Body`,
            `No parameters were detected in the incoming body.`
          )
        )
      }
    }
  ]

  validations.forEach((valFn, i) => {
    // console.log(`validation ${i}`)
    valFn()
  })

  if (errors.length > 0) {
    res.status(500).send(errors)
  } else {
    // get latest pricing for invoice
    getLatestEosActivationPriceInSelectedCryptoCurrency(requestedPaymentCurrency).then(eosActivationFeeInSelectedCryptoUSD => {
      // createInvoice for payment & setup watcher
      const client = getBtcPayClient()
      console.log('if not /activateAccount?, client is: ', client)
      client.create_invoice({
        price: eosActivationFeeInSelectedCryptoUSD,
        currency: 'USD',
        notificationEmail: CONFIG.invoiceNotificationEmailAddress || null,
        notificationURL: CONFIG.invoiceNotificationURL || null,
        extendedNotifications: true,
        physical: false
      }) // should have token?
        .then((invoice) => {
          console.log('kylan invoice1: ', invoice)

          invoiceTx = formatCleanupInvoiceData(invoice)

          invoiceTx._id = invoice.id
          invoiceTx.requestedAccountName = requestedAccountName
          invoiceTx.ownerPublicKey = body.ownerPublicKey
          invoiceTx.activePublicKey = body.activePublicKey
          invoiceTx.eventStatusHistory = [{
            time: invoiceTx.currentTime,
            status: invoiceTx.status,
            event: null
          }]
          invoiceTx.quotedEosRates = {
            eosFees: currentEosSystemRates.data,
            eosActivationFeeInUSD: eosActivationFeeInSelectedCryptoUSD
          }

          // invoiceTx._rev = _rev
          invoiceTxDb.insert(invoiceTx, (err, insertResult) => {
            if (err) {
              console.log('kylan2 invoiceTxDB error')
              res.status(500).send({message: 'Error saving transaction', error: err})
            } else {
              console.log('kylan3 invoiceTx.cryptoInfo: ', invoiceTx.cryptoInfo)

              let { totalDue, rate } = invoiceTx.cryptoInfo.filter(cryptoData => {
                return cryptoData.cryptoCode === requestedPaymentCurrency
              })[0]

              res.status(200).send(
                {
                  currencyCode: requestedPaymentCurrency,
                  paymentAddress: invoiceTx.addresses && invoiceTx.addresses[requestedPaymentCurrency],
                  expireTime: invoiceTx.expirationTime,
                  amount: totalDue,
                  rate: rate
                })
            }
          })
        })
        .catch((err) => {
          console.log('kylan00Error creating invoice:', err)
          res.status(500).send({message: 'error creating invoice', error: err})
        })
    })

    // once invoice is paid (on notification? Will btcpay notify URL)- send EOS payment command

    // eos.createAccountPackage('ownerPubKey', 'activePubKey', 'accountName', bytes, stake_net_quantity, stake_cpu_quantity, transfer)
  }
})

app.post(CONFIG.apiVersionPrefix + '/invoiceNotificationEvent', function (req, res) {
  console.log('/invoiceNotificationEvent:body', req.body)

  const invoiceId = typeof (req.body) === 'object' && req.body.data && req.body.data.id
  const btcpayInvoiceEventCode = typeof (req.body) === 'object' && req.body.event && req.body.event.code
  const btcpayInvoiceEventName = typeof (req.body) === 'object' && req.body.event && req.body.event.name
  const invoiceEventData = formatCleanupInvoiceData(typeof (req.body) === 'object' && (req.body.data || req.body))
  let invoiceTx = {}
  let _doUpdate = false
  const responseObject = {
    errors: [],
    warnings: [],
    messages: []
  }
  const btcPayNotificationResponse = {
    ok: () => {
      if (_doUpdate === false) {
        res.status(200).send({message: 'ok'})
      } else {
        responseObject.messages.push({message: 'ok'})
      }
    },
    error: (errorObj = getErrorObject('NotificationEventError', 'An error while processing BTCPay notification event')) => {
      console.log(errorObj.message, errorObj)
      if (_doUpdate === false) {
        res.status(500).send(errorObj)
      } else {
        responseObject.errors.push(errorObj)
      }
    },
    warning: (warningObject = getErrorObject('NotificationEventWarning', 'Something unhappy occurred while processing BTCPay notification event')) => {
      console.log(warningObject.message, warningObject)

      if (_doUpdate === false) {
        res.status(200).send(warningObject)
      } else {
        responseObject.warnings.push(warningObject)
      }
    }
  }
  const updateInvoiceData = (invoiceTx) => {
    invoiceTxDb.insert(invoiceTx, (err, insertResult) => {
      if (err) {
        console.log(getErrorObject('ErrorSavingInvoice', 'An error occurred while saving invoice.', err))
        // res.status(500).send({message: 'Error saving transaction', error: err})
      } else {
        // console.log('Successsfully saved invoice from notification update.', responseObject)
        responseObject.messages.push(invoiceTx)
        res.status(200).send(responseObject)
      }
    })
  }

  // console.log('invoiceEventData: ', invoiceEventData)

  invoiceTxDb.get(invoiceId, (err, invoiceData) => {
    if (err) {
      console.log(getErrorObject('InvoiceTxDbError', 'Failure retrieving invoice from database on btcpay notification.', err))
    } else {
      // invoiceTx = Object.assign(invoiceData)

      for (let property in invoiceData) {
        // optional check for properties from prototype chain
        if (invoiceEventData.hasOwnProperty(property) || invoiceData.hasOwnProperty(property)) {
          invoiceTx[property] = invoiceEventData[property] || invoiceData[property] || null
          // no a property from prototype chain
        } else {
          // property from protytpe chain
        }
      }

      if (invoiceData.eventStatusHistory && Array.isArray(invoiceData.eventStatusHistory)) {
        invoiceTx.eventStatusHistory.push({
          time: invoiceEventData.currentTime,
          status: invoiceEventData.status,
          event: btcpayInvoiceEventName
        })
      }

      switch (btcpayInvoiceEventCode) {
        case 1001:// invoice_created
        case 1002: // invoice_receivedPayment
        case 1003: // invoice_paidInFull
        case 1004: // invoice_expired
        case 1006: // invoice_completed
        case 1010: // invoice_expiredPartial
          // do nothing special
          _doUpdate = true
          btcPayNotificationResponse.ok()

          break

        case 1005: // invoice_confirmed
          // invoke eos broadcast call
          _doUpdate = true

          eosAccountCreateAndBuyBw(invoiceData.requestedAccountName, invoiceData.ownerPublicKey, invoiceData.activePublicKey)
            .then(result => {
              eos.getAccount({account_name: creatorAccountName})
                .then(creatorAccountResult => console.log('eos creatorAccountName post transaction info: ', creatorAccountResult))
                .catch(error => console.log('*************Error in getAccount: ', error))
              btcPayNotificationResponse.ok()
            })
            .catch(error => {
              btcPayNotificationResponse.error(getErrorObject('FailureInEosTxBroadcast', 'Something went wrong while broadcasting EOS transaction to network', error))
            })
          break
        case 1007: // invoice_refunded
        case 1016: // invoice_refundComplete
          // TODO: confirm setup disallows refunds
          _doUpdate = true
          btcPayNotificationResponse.ok()
          break
        case 1008: // invoice_markedInvalid
        case 1009: // invoice_paidAfterExpiration
          // TODO: confirm how to handle?
          btcPayNotificationResponse.warning()
          break

        case 1011: // invoice_blockedByTierLimit
        case 1012: // invoice_manuallyNotified
        case 1013: // invoice_failedToConfirm
        case 1014: // invoice_latePayment
        case 1015: // invoice_adjustmentComplete
        // log error / notification
          console.log('Unhandled Invoice Event received', req.body)
          _doUpdate = true
          btcPayNotificationResponse.warning(
            getErrorObject('InvoiceStatusIrregularity', 'Something unhappy occurred while processing BTCPay notification event.', req.body)
          )
          break

        case 2001: // payoutRequest_funded
        case 2002: // payoutRequest_completed
        case 2003: // payoutRequest_cancelled
          // Payouts are batches of bitcoin payments to employees, customers, partners, etc.
          // TODO: confirm payoutRequests cannot be invoked or are blocked by configuration
          console.log('Unhandled Payout Request Event received', req.body)
          btcPayNotificationResponse.warning(
            getErrorObject('InvoicePayoutRequestWarning', 'A BTCPay notification event for payout has been received, and should probably not have been.', req.body)
          )
          break

        case 3001: // org_completedSetup
          // TODO: confirm event conditions & handle if necessary
          btcPayNotificationResponse.warning(
            getErrorObject('OrgCompletedSetupWarning', 'A BTCPay notification event for org setup complete has been received, and should probably not have been.', req.body)
          )

          break
        default:
          btcPayNotificationResponse.warning(
            getErrorObject('UnhandledNotificationEventWarning', 'A BTCPay notification event for an unknown/unhandled Event has been received, and should probably not have been.', req.body)
          )
          break
      }

      if (_doUpdate) {
        updateInvoiceData(invoiceTx)
      }
    }
  })
})

httpServer.listen(ENV.port, () => {
  console.log(`HTTP Server running on port ${ENV.port}`)
})

httpsServer.listen(443, () => {
  console.log('HTTPS Server running on port 443')
})

/***
 *      ___ ______________.____   _______________________________  _________
 *     /   |   \_   _____/|    |  \______   \_   _____/\______   \/   _____/
 *    /    ~    \    __)_ |    |   |     ___/|    __)_  |       _/\_____  \
 *    \    Y    /        \|    |___|    |    |        \ |    |   \/        \
 *     \___|_  /_______  /|_______ \____|   /_______  / |____|_  /_______  /
 *           \/        \/         \/                \/         \/        \/
 */

async function queryAccountName () {
  // ///////////////////////////////////////////////////
  // Query for account name

  console.log(`queryAccountName: publicKey: ${publicKey}`)
  // const accounts = await new Promise((resolve, reject) => {
  //   eos.getKeyAccounts(publicKey, (error, result) => {
  //     if (error) reject(error)
  //     resolve(result)
  //   })
  // })

  // kylan fix
  const accounts = await hyperionRpc.get_key_accounts(publicKey)
  console.log('queryAccountName accounts is: ', accounts)

  if (accounts.account_names && accounts.account_names.length > 0) {
    creatorAccountName = accounts.account_names[0]
  }
  console.log(`creatorAccountName: ${creatorAccountName}`)

  return accounts
}

async function eosAccountCreateAndBuyBw (newAccountName, ownerPubKey, activePubKey, net = CONFIG.eosAccountActivationStartingBalances.net, cpu = CONFIG.eosAccountActivationStartingBalances.cpu, ram = Number(CONFIG.eosAccountActivationStartingBalances.ram) || 8192) {
  // ///////////////////////////////////////////////////
  // Buy CPU and RAM
  console.log('eosAccountCreateAndBuyBw')

  return eos.transaction(tr => {
    const eosPricingResponse = currentEosSystemRates.data

    //apply minimum staked EOS amounts from Configs
    let stakeNetQuantity = bns.lt(bns.mul(eosPricingResponse.net, net), CONFIG.eosAccountActivationStartingBalances.minimumNetEOSStake) ? CONFIG.eosAccountActivationStartingBalances.minimumNetEOSStake : bns.mul(eosPricingResponse.net, net)
    let stakeCpuQuantity = bns.lt(bns.mul(eosPricingResponse.cpu, cpu),CONFIG.eosAccountActivationStartingBalances.minimumCpuEOSStake) ? CONFIG.eosAccountActivationStartingBalances.minimumCpuEOSStake : bns.mul(eosPricingResponse.cpu, cpu)


    const delegateBwOptions = {
      from: creatorAccountName,
      // receiver: 'edgytestey43',
      receiver: newAccountName,
      stake_net_quantity: `${Number(stakeNetQuantity).toFixed(4)} EOS`,
      stake_cpu_quantity: `${Number(stakeCpuQuantity).toFixed(4)} EOS`,
      transfer: 0
    }
    console.log('delegateBwOptions: ', delegateBwOptions)

    tr.newaccount({
      creator: creatorAccountName,
      name: newAccountName,
      owner: ownerPubKey, // <------ the public key the of the new user account that was generate by a wallet tool or the eosjs-keygen
      active: activePubKey
    })

    tr.delegatebw(delegateBwOptions)

    tr.buyrambytes({
      payer: creatorAccountName,
      receiver: newAccountName,
      bytes: ram
    })
  },
  {
    sign: true,
    broadcast: true,
    keyProvider: [CONFIG.eosCreatorAccountPrivateKey]
  })
}

function getBtcPayClient () {
  let client
  try {
    console.log('kylan in getBtCpayClient')
    const keypair = btcpay.crypto.load_keypair(Buffer.from("1f3ad04df972593d8de26a33faf852361bc097ecc5471b0e057868fa04fb3595", 'hex'))
    console.log('kylan in gtBtcPayClient, after keypair, keypair:', keypair)
    console.log('public is: ', keypair.getPublic(true|false, 'hex')
    client = new btcpay.BTCPayClient('https://btcpay.teloscrew.com', keypair, {merchant: "8iDFCwi2XUCTXBmFsKcCvKNXfTm5R2ozhDaYgRefZFpP"})
    console.log('btcPay client is: ', client)

  } catch (e) {
    throw new Error('Error in getBtcPayClient: ', e)
  }

  return client
}

function formatCleanupInvoiceData (invoiceTxData) {
  console.log('formatCleanupInvoiceData called')
  const _returnObj = {}

  CONFIG.btcPayInvoicePropsToSave.forEach((prop) => {
    switch (true) {
      case invoiceTxData[prop] !== null && typeof (invoiceTxData[prop]) !== 'undefined':
        switch (prop) {
          case 'invoiceTime':
          case 'expirationTime':
          case 'currentTime':
            _returnObj[prop] = Math.trunc(Number(invoiceTxData[prop]) / 1000)
            break
          default:
            _returnObj[prop] = invoiceTxData[prop]
            break
        }
        break
      default:
        console.log(`${prop} not available on invoice object. Check configs for properties to save`)
        break
    }
  })

  // console.log('_formatCleanupInvoiceData()', _returnObj)

  return _returnObj
}

function getErrorObject (errorCode, message, data) {
  const error = {}
  for (let arg in arguments) {
    const value = arguments[arg]
    switch (true) {
      case value && value === errorCode:
        error.errorCode = value
        break
      case value && value === message:
        error.message = value
        break
      case value && value === data:
        error.data = value
        break
      default:
      // do nothing
        break
    }
  }

  return error
}

function isSupportedCurrency (currencyCode) {
  console.log(`isSupportedCurrency() ${currencyCode}`, currencyCode, typeof (currencyCode), CONFIG.supportedCurrencies.hasOwnProperty(currencyCode))
  let _returnVal = false

  _returnVal = !!(currencyCode &&
  typeof (currencyCode) === 'string' &&
  CONFIG.supportedCurrencies.hasOwnProperty(currencyCode) &&
  CONFIG.supportedCurrencies[currencyCode])

  // console.log(`isSupportedCurrency() : ${_returnVal}`)
  return _returnVal
}
