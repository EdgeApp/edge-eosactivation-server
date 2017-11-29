// @flow
// import fetch from 'node-fetch'
// const fetch = require('node-fetch')
const sprintf = require('sprintf-js').sprintf

const net = require('net')
const tls = require('tls')
// const childProcess = require('child_process')

const CHECK_BLOCK_HEIGHT = '484253'
const CHECK_BLOCK_MERKLE_BTC = '378f5397b121e4828d8295f2496dcd093e4776b2214f2080782586a3cb4cd5c4'
const CHECK_BLOCK_MERKLE_LTC = '20f5ef8eeb44d156faafb40bcdf4d46595b67766d478ac7febe634c3ea7d3424'
const CHECK_BLOCK_MERKLE_BCH = '2ae67f75ac7bf080f5092ec547d548d895cfe9f92de1bdcf2d157c56280aebe1'
const CHECK_SEGWIT_TX_ID = 'ef298148f25162db85127b83daefe07e46b06078f95aa30969b007a09a722b61'
// const CHECK_NONSEGWIT_TX_RAW = '0100000002f8a7d578817bb42636a2552de53db822f30d776133ec3d1b9c58f435342e50ad000000002322002096c365c331033867275b5b693000e7396baa02cbeca80d605356c5acf3d9b0deffffffffe023a2e5ee2b63957e8e40a5a1ef3cf21f0de201af0da674d19e35a415394407000000002322002015e61ade874e81c9efcdb6739be8b67332c190554759cc5e144937f6974b7a77ffffffff02060e0600000000001976a91440f857348a9e1282b6455d83db110ae204b7268388acc06998000000000017a914395cc0ef446992db0694a8ee6a52274bab0a4c8c8700000000'
const CHECK_NONSEGWIT_TX_RAW = '0100000002f8a7d578817bb4'

// 0100000002f8a7d578817bb42636a2552de53db822f30d776133ec3d1b9c58f435342e50ad000000002322002096c365c331033867275b5b693000e7396baa02cbeca80d605356c5acf3d9b0deffffffffe023a2e5ee2b63957e8e40a5a1ef3cf21f0de201af0da674d19e35a415394407000000002322002015e61ade874e81c9efcdb6739be8b67332c190554759cc5e144937f6974b7a77ffffffff02060e0600000000001976a91440f857348a9e1282b6455d83db110ae204b7268388acc06998000000000017a914395cc0ef446992db0694a8ee6a52274bab0a4c8c8700000000
// 01000000000102f8a7d578817bb42636a2552de53db822f30d776133ec3d1b9c58f435342e50ad000000002322002096c365c331033867275b5b693000e7396baa02cbeca80d605356c5acf3d9b0deffffffffe023a2e5ee2b63957e8e40a5a1ef3cf21f0de201af0da674d19e35a415394407000000002322002015e61ade874e81c9efcdb6739be8b67332c190554759cc5e144937f6974b7a77ffffffff02060e0600000000001976a91440f857348a9e1282b6455d83db110ae204b7268388acc06998000000000017a914395cc0ef446992db0694a8ee6a52274bab0a4c8c87040047304402207ed7de08fcd309a88a27d9d0c6fbce10b402f3bf3111137a607b1b4fb110b0de0220348a5e653020885c4dcbd054e348daf53fdd2d2282db05bee822d8dbc5390bff01483045022100f3ae6b2368355c6041c44081caf51828e420d8afd7b0d3d486ed722c2eae5ef2022021e5c66709a1f3c1e8a7ff41d23d9b0e1da9e2b1bd9f832da9df631b6af78ca6016952210204888c56fd54f254c5e991c60131e3efc8db0ed7051a2232b3d4d24143b6f2f02103022fc4c408d08902134880a4958f6b3c9207026586683c609f9635c03e46a379210310d3885dbb09a93b7bdb12aa9757579539b746fc080c3397c2bb1e688cea438053ae04004730440220733792dc3ad7613db14bb960ab6b918702aa8178986e5be90024f0a6d97e373602205b7a5767d524d6e8415caaaea6b24a9c3e2ad09f4dd2b6ac5775d392b53c580e0147304402205775814f3de90c0ca18737d3f2d9fdf52f9af4d8fdf66dd9e2355c68e490bb600220302b00399fe75650bf89bb68c24a39c804dd7aa449490d3486aceaca4b0d008e0169522102af82a350b7d485c20bb9e6b4ab93ad1138413981c364887e8ba9ce1f27c9b75e21036da1cdf952bb54ff5a4d02df4008a161ad6047193447fdd5a7176e12bc71fa49210225f085f9dc41d41
// 01000000000102f8a7d578817bb42636a2552de53d

console.log(CHECK_SEGWIT_TX_ID)
console.log(CHECK_NONSEGWIT_TX_RAW)
const SEED_SERVERS = [
  'electrum://electrum.jdubya.info:50001',
  'electrums://electrum-bc-az-eusa.airbitz.co:50002',
  'electrum://electrum-bc-az-eusa.airbitz.co:50001',
  'electrums://electrum-bu-az-wusa2.airbitz.co:50002',
  'electrum://electrum-bu-az-wusa2.airbitz.co:50001',
  'electrums://electrum-bu-az-wjapan.airbitz.co:50002',
  'electrum://electrum-bu-az-wjapan.airbitz.co:50001',
  'electrums://electrum-bu-az-ausw.airbitz.co:50002',
  'electrum://electrum-bu-az-ausw.airbitz.co:50001',
  'electrums://electrum-bu-az-weuro.airbitz.co:50002',
  'electrum://electrum-bu-az-weuro.airbitz.co:50001',
  'electrum://electrum.hsmiths.com:8080',
  'electrum://e.anonyhost.org:50001',
  'electrum://ELECTRUM.not.fyi:50001',
  'electrum://electrum.zone:50001',
  'electrum://yui.kurophoto.com:50001',
  'electrums://yui.kurophoto.com:50002',
  'electrums://electrum.zone:50002',
  'electrum://abc1.hsmiths.com:60001',
  'electrum://electrum-ltc.festivaldelhumor.org:60001',
  'electrum://electrum-ltc.petrkr.net:60001'
]

const ltcServers = []
const bchServers = []
const nonSegwitServers = []
const coreServers = []
const badServers = []

function dateString () {
  const date = new Date()
  return date.toDateString() + ':' + date.toTimeString()
}

// async function fetchGet (url:string) {
//   const response = await fetch(url, {
//     method: 'GET'
//   })
//   return response.json()
// }

type CheckServersResponse = {
  ltcServers: Array<string>,
  bchServers: Array<string>,
  coreServers: Array<string>,
  nonSegwitServers: Array<string>,
  btc2xServers: Array<string>,
  badServers: Array<string>
}

export async function checkServers (serverList:Array<string>): Promise<CheckServersResponse> {
  // let currentHeight
  // try {
  //   const data = await fetchGet('https://blockchain.info/latestblock')
  //   currentHeight = data.height
  // } catch (e) {
  //   console.log(e)
  //   return
  // }

  let servers = SEED_SERVERS.concat(serverList)
  let finalServers = servers.slice()
  let promiseArray = []

  //
  // Loop over all servers
  //

  for (let server of servers) {
    console.log(server)
    const p = getPeers(server)
    promiseArray.push(p)
  }

  let results:Array<any> = await Promise.all(promiseArray)

  for (const result of results) {
    // Each result is an array of peers or -1 if that server failed
    if (result.peers === -1) {
      badServers.push(result.serverUrl)
    } else {
      finalServers = finalServers.concat(result.peers)
    }
  }

  let uniqueServers = Array.from(new Set(finalServers))
  // let uniqueServers = SEED_SERVERS
  console.log('Found ' + uniqueServers.length + ' unique peers to check')

  promiseArray = []
  // uniqueServers = ['electrum://electrum-bu-az-wjapan.airbitz.co:50001', 'electrum://electrum-bu-az-weuro.airbitz.co:50001']
  // uniqueServers = ['electrum://cluelessperson.com:50001']
  // uniqueServers = ['electrum://electrum-ltc.petrkr.net:60001', 'electrum://electrum-ltc.festivaldelhumor.org:60001']

  for (let svr of uniqueServers) {
    const p = checkServer(svr)
    promiseArray.push(p)
  }

  results = await Promise.all(promiseArray)

  for (const result: CheckServerResponse of results) {
    const serverUrl = result.serverUrl
    const blockHeight = result.blockHeight
    if (result.useServer === true) {
      if (result.isBch === CHK_TRUE && result.v11 === CHK_TRUE) {
        bchServers.push({serverUrl, blockHeight})
        console.log('bchServers: [' + serverUrl + ']')
      } else if (result.isLtc === CHK_TRUE && result.v11 === CHK_TRUE) {
        ltcServers.push({serverUrl, blockHeight})
        console.log('ltcServers: [' + serverUrl + ']')
      } else if (result.isBtc === CHK_TRUE && result.hasSegwit === CHK_TRUE && result.v11 === CHK_TRUE) {
        coreServers.push({serverUrl, blockHeight})
        console.log('coreServers: [' + serverUrl + ']')
      } else if (result.isBtc === CHK_TRUE && result.hasSegwit === CHK_FALSE) {
        // Assume non-segwit, legacy core server
        nonSegwitServers.push({serverUrl, blockHeight})
        console.log('nonSegwitServers: [' + serverUrl + ']')
      } else {
        badServers.push(serverUrl)
        console.log('bad server: [' + serverUrl + ']')
      }
    } else {
      badServers.push(serverUrl)
      console.log('bad server: [' + serverUrl + ']')
    }
    console.log('num ltcServers      :' + ltcServers.length)
    console.log('num bchServers      :' + bchServers.length)
    console.log('num coreServers     :' + coreServers.length)
    console.log('num nonSegwitServers:' + nonSegwitServers.length)
    console.log('num badServers      :' + badServers.length)
    if (bchServers.length + coreServers.length + nonSegwitServers.length + badServers.length === uniqueServers.length) {
      break
    }
  }

  const bestLtcServers = pruneLowBlockHeight(ltcServers)
  const bestBchServers = pruneLowBlockHeight(bchServers)
  const bestCoreServers = pruneLowBlockHeight(coreServers)
  const bestNonSegwitServers = pruneLowBlockHeight(nonSegwitServers)

  const finalLtcServerSet = new Set(bestLtcServers)
  const finalBchServerSet = new Set(bestBchServers)
  const finalCoreServerSet = new Set(bestCoreServers)
  const finalNonSegwitServerSet = new Set(bestNonSegwitServers)

  const finalLtcServers = [...finalLtcServerSet]
  const finalBchServers = [...finalBchServerSet]
  const finalCoreServers = [...finalCoreServerSet]
  const finalNonSegwitServers = [...finalNonSegwitServerSet]

  const out: CheckServersResponse = {
    ltcServers: finalLtcServers,
    bchServers: finalBchServers,
    coreServers: finalCoreServers,
    nonSegwitServers: finalNonSegwitServers,
    btc2xServers: [],
    badServers
  }

  console.log('\n' + out.ltcServers.length + ' LTC SERVERS')
  for (let s of out.ltcServers) {
    console.log(s)
  }
  console.log('\n' + out.bchServers.length + ' BCH SERVERS')
  for (let s of out.bchServers) {
    console.log(s)
  }
  console.log('\n' + out.coreServers.length + ' Core SERVERS:\n')
  for (let s of out.coreServers) {
    console.log(s)
  }
  console.log('\n' + out.nonSegwitServers.length + ' NonSegwit SERVERS:\n')
  for (let s of out.nonSegwitServers) {
    console.log(s)
  }
  console.log('\n' + out.badServers.length + ' BAD SERVERS:\n')
  for (let s of out.badServers) {
    console.log(s)
  }
  console.log('num ltcServers      :' + out.ltcServers.length)
  console.log('num bchServers      :' + out.bchServers.length)
  console.log('num coreServers     :' + out.coreServers.length)
  console.log('num nonSegwitServers:' + out.nonSegwitServers.length)
  console.log('num badServers      :' + out.badServers.length)

  return out
}

// Remove the servers which have lower blockHeights than the majority of other servers
function pruneLowBlockHeight (servers: Array<{serverUrl: string, blockHeight: number}>) {
  const heights = {}
  for (const s of servers) {
    if (typeof heights[s.blockHeight] === 'undefined') {
      heights[s.blockHeight] = 1
    } else {
      heights[s.blockHeight] += 1
    }
  }
  console.log('Heights object:', heights)

  let highestScore: number = 0
  let heightWithHighestScore: number = 0
  for (const s in heights) {
    if (heights[s] > highestScore) {
      highestScore = heights[s]
      heightWithHighestScore = parseInt(s)
    }
  }
  console.log('highestScore:' + highestScore)
  console.log('heightWithHighestScore:' + heightWithHighestScore)

  const out = []
  for (const s of servers) {
    if (
      s.blockHeight >= heightWithHighestScore - 1 &&
      s.blockHeight <= heightWithHighestScore + 1
    ) {
      out.push(s.serverUrl)
    } else {
      console.log('Low blockheight: ' + s.serverUrl + ': ' + s.blockHeight)
    }
  }
  return out
}

const ID_VERSION = 1
const ID_HEIGHT = 2
const ID_HEADER = 3
const ID_SEGWIT = 4
const NUM_CHECKS = ID_SEGWIT

type CheckServerResponse = {
  useServer: boolean,
  hasSegwit: number,
  isBtc: number,
  isLtc: number,
  isBch: number,
  blockHeight: number,
  serverUrl: string,
  v11: number
}

const UNKNOWN = 0
const CHK_TRUE = 1
const CHK_FALSE = 2

function checkServer (serverUrl: string): Promise<CheckServerResponse> {
  return new Promise((resolve) => {
    let regex
    let ssl = false
    if (serverUrl.startsWith('electrums:')) {
      regex = new RegExp(/electrums:\/\/(.*):(.*)/)
      ssl = true
    } else {
      regex = new RegExp(/electrum:\/\/(.*):(.*)/)
    }
    let results = regex.exec(serverUrl)

    let out: CheckServerResponse = {
      serverUrl,
      useServer: false,
      hasSegwit: UNKNOWN,
      isBtc: UNKNOWN,
      isBch: UNKNOWN,
      isLtc: UNKNOWN,
      blockHeight: 0,
      v11: 0
    }

    let client

    const checks = [false, false, false, false, false, false, false, false]

    if (results === null) {
      resolve(out)
    } else {
      let resolved = false
      const port = results[2]
      const host = results[1]
      let tcp
      if (ssl) {
        tcp = tls
      } else {
        tcp = net
      }
      client = tcp.connect({ port, host, rejectUnauthorized: false }, () => {
        console.log('****** checkServer:' + serverUrl)
        let query = sprintf('{ "id": %d, "method": "server.version", "params": ["1.1", "1.1"] }\n', ID_VERSION)
        client.write(query)
        console.log('query:' + query)

        query = sprintf('{ "id": %d, "method": "blockchain.headers.subscribe", "params": [] }\n', ID_HEIGHT)
        client.write(query)
        console.log('query:' + query)

        query = sprintf('{ "id": %d, "method": "blockchain.block.get_header", "params": [' + CHECK_BLOCK_HEIGHT + '] }\n', ID_HEADER)
        client.write(query)
        console.log('query:' + query)

        query = sprintf('{ "id": %d, "method": "blockchain.transaction.get", "params": ["' + CHECK_SEGWIT_TX_ID + '"] }\n', ID_SEGWIT)
        client.write(query)
        console.log('query:' + query)
      })

      let jsonData = ''

      client.on('data', (data) => {
        let results = data.toString('ascii')
        console.log('\nBEGIN data for ' + serverUrl)
        console.log(results)
        console.log('END data for ' + serverUrl + '\n')

        let arrayResults = []

        try {
          const resultObj = JSON.parse(jsonData + results)
          arrayResults.push(resultObj)
        } catch (e) {
          // Check if this is a multiline response by breaking up into arrays by newline
          const nlSplits = (jsonData + results).split('\n')
          if (nlSplits.length > 0) {
            for (const sp of nlSplits) {
              try {
                const resultObj = JSON.parse(sp)
                arrayResults.push(resultObj)
              } catch (e) {
                jsonData += sp
              }
            }
          } else {
            jsonData += results
            return
          }
        }

        for (const result of arrayResults) {
          // const { responseId, success, blockHeight, serverType } = processResponse(result)
          const response: ProcessResponseType = processResponse(result)
          if (resolved) {
            return
          }
          if (response.success) {
            checks[response.responseId] = true

            if (response.hasSegwit > UNKNOWN) {
              out.hasSegwit = response.hasSegwit
            }
            if (response.isBtc > UNKNOWN) {
              out.isBtc = response.isBtc
            }
            if (response.isBch > UNKNOWN) {
              out.isBch = response.isBch
            }
            if (response.isLtc > UNKNOWN) {
              out.isLtc = response.isLtc
            }
            if (response.blockHeight > 0) {
              out.blockHeight = response.blockHeight
            }
            if (response.v11 > UNKNOWN) {
              out.v11 = response.v11
            }
            console.log('processResponse: ' + serverUrl, out)
          } else {
            console.log('checkServer FAIL:' + serverUrl)
            console.log(result)
            client.write('Goodbye!!!')
            resolved = true
            resolve(out)
          }

          let complete = true
          for (let c = 1; c <= NUM_CHECKS; c++) {
            if (checks[c] === false) {
              complete = false
              break
            }
          }
          if (complete) {
            console.log('checkServer SUCCESS:' + serverUrl)
            resolved = true
            client.write('Goodbye!!!')
            client.destroy()
            out.useServer = true
            resolve(out)
          }
        }
      })

      client.on('error', (err) => {
        console.log(err)
        resolved = true
        resolve(out)
      })

      client.on('close', () => {
        // console.log('Socket closed')
        resolved = true
        resolve(out)
      })

      client.on('end', () => {
        // console.log('Socket end')
        resolved = true
        resolve(out)
      })

      setTimeout(() => {
        if (!resolved) {
          client.destroy()
          // console.log('Socket timeout')
          out.useServer = false
          resolve(out)
        }
      }, 10000)
    }
  })
}

type ProcessResponseType = {
  responseId: number,
  success: boolean,
  blockHeight: number,
  hasSegwit: number,
  v11: number,
  isBtc: number,
  isBch: number,
  isLtc: number
}

function processResponse (resultObj): ProcessResponseType {
  console.log('processResponse START')
  const out: ProcessResponseType = {
    responseId: 0,
    success: false,
    blockHeight: 0,
    hasSegwit: UNKNOWN,
    isBtc: UNKNOWN,
    isBch: UNKNOWN,
    isLtc: UNKNOWN,
    v11: UNKNOWN
  }
  if (resultObj !== null) {
    out.responseId = resultObj.id
    if (out.responseId === ID_HEIGHT) {
      if (typeof resultObj.result !== 'undefined') {
        out.blockHeight = resultObj.result.block_height
        out.responseId = ID_HEIGHT
        out.success = true
      }
    } else if (out.responseId === ID_HEADER) {
      if (
        typeof resultObj.result !== 'undefined' &&
        typeof resultObj.result.merkle_root !== 'undefined'
      ) {
        if (resultObj.result.merkle_root === CHECK_BLOCK_MERKLE_BTC) {
          out.isBtc = CHK_TRUE
          console.log('processResponse bitcoin core merkle')
          out.success = true
        } else if (resultObj.result.merkle_root === CHECK_BLOCK_MERKLE_BCH) {
          out.isBch = CHK_TRUE
          console.log('processResponse bitcoincash merkle')
          out.success = true
        } else if (resultObj.result.merkle_root === CHECK_BLOCK_MERKLE_LTC) {
          out.isLtc = CHK_TRUE
          console.log('processResponse litecoin merkle')
          out.success = true
        }
      }
    } else if (out.responseId === ID_SEGWIT) {
      out.success = true
      if (typeof resultObj.result !== 'undefined') {
        if (resultObj.result.toLowerCase().includes(CHECK_NONSEGWIT_TX_RAW)) {
          out.hasSegwit = CHK_FALSE
          console.log('processResponse no segwit')
        } else {
          out.hasSegwit = CHK_TRUE
          console.log('processResponse has segwit')
        }
      } else {
        console.log('processResponse FAIL result segwit')
      }
    } else if (out.responseId === ID_VERSION) {
      if (typeof resultObj.result !== 'undefined') {
        const result = resultObj.result
        if (typeof result === 'object' && result.length === 2) {
          // Only accept ElectrumX servers since they don't prune history
          if (result[0].toLowerCase().includes('electrumx')) {
            out.success = true
            console.log('processResponse PASS electrumx')
          } else {
            console.log('processResponse FAIL electrumx')
          }
          if (parseFloat(result[1]) >= 1.1) {
            out.v11 = CHK_TRUE
            console.log('processResponse PASS version 1.1+')
          } else {
            out.v11 = CHK_FALSE
            console.log('processResponse FAIL version < 1.1 ')
          }
        } else if (typeof result === 'string') {
          out.v11 = CHK_FALSE
          if (result.toLowerCase().includes('electrumx')) {
            console.log('processResponse PASS electrumx')
            out.success = true
          } else {
            console.log('processResponse FAIL electrumx')
            out.success = false
          }
        } else {
          console.log('processResponse FAIL 1 result invalid')
        }
      } else {
        console.log('processResponse FAIL 2 result undefined')
      }
    } else {
      console.log('processResponse FAIL processid')
    }
    // if (status === 4) {
  } else {
    console.log('processResponse FAIL resultObj')
  }

  console.log(out)
  if (!out.success) {
    console.log(resultObj)
  }
  return out
}

function getPeers (_serverUrl) {
  const serverUrl = _serverUrl
  return new Promise((resolve) => {
    console.log('*********** getPeers: ' + serverUrl)
    // let regex = new RegExp(/electrum:\/\/(.*):(.*)/)
    let regex
    let ssl = false
    if (serverUrl.startsWith('electrums:')) {
      regex = new RegExp(/electrums:\/\/(.*):(.*)/)
      ssl = true
    } else {
      regex = new RegExp(/electrum:\/\/(.*):(.*)/)
    }
    let results = regex.exec(serverUrl)
    let resolved = false
    let client

    if (results !== null) {
      const port = results[2]
      const host = results[1]
      let tcp
      if (ssl) {
        tcp = tls
      } else {
        tcp = net
      }
      client = tcp.connect({ port, host, rejectUnauthorized: false }, () => {
        console.log('connect')
        const query = '{ "id": 2, "method": "server.peers.subscribe", "params": [] }\n'
        client.write(query)
        console.log('query:' + query + '***')
      })
    } else {
      resolve({serverUrl, peers: -1})
      return
    }
    let peers = []

    let jsonData = ''

    client.on('data', (data) => {
      let results = data.toString('ascii')
      console.log(results)
      let resultObj
      try {
        resultObj = JSON.parse(jsonData + results)
      } catch (e) {
        jsonData += results
        return
      }

      if (resultObj !== null) {
        let rArray = resultObj.result
        for (let serverObj of rArray) {
          let serverName = serverObj[1]
          let port = 50001
          let sport = 0
          let numTxHistory = 10000

          for (const deet of serverObj[2]) {
            if (deet.startsWith('p')) {
              let regex = new RegExp(/p(.*)/)
              let results = regex.exec(deet)
              if (results !== null) {
                numTxHistory = results[1]
              }
            }
            if (deet.startsWith('t')) {
              let regex = new RegExp(/t(.*)/)
              let results = regex.exec(deet)
              if (results !== null) {
                port = results[1]
              }
            }
            if (deet.startsWith('s')) {
              let regex = new RegExp(/s(.*)/)
              let results = regex.exec(deet)
              if (results !== null) {
                sport = results[1]
              }
            }
          }

          if (numTxHistory < 1000) {
            // Exit
            console.log(serverName + ': Insufficient numTxHistory:' + numTxHistory)
            continue
          }

          if (parseInt(sport) > 0) {
            const url = 'electrums://' + serverName + ':' + sport
            console.log('Add peer: ' + url + ' from:' + serverUrl)
            peers.push(url)
          }

          const url = 'electrum://' + serverName + ':' + port
          console.log('Add peer: ' + url + ' from:' + serverUrl)
          peers.push(url)
        }
      }
      console.log(dateString())
      console.log('-------------- FINISHED getPeers: ' + serverUrl)
      client.write('Goodbye!!!')
      client.destroy()
      resolved = true
      resolve({serverUrl, peers})
    })

    client.on('error', function (err) {
      console.log(dateString())
      console.log('-------------- ERROR getPeers:' + serverUrl)
      console.log(err)
      resolved = true
      resolve({serverUrl, peers: -1})
    })

    client.on('close', function () {
      console.log(dateString())
      console.log('CLOSE getPeers:' + serverUrl)
    })

    setTimeout(() => {
      if (!resolved) {
        client.write('Goodbye!!!')
        client.destroy()
        console.log(dateString())
        console.log('TIMEOUT getPeers:' + serverUrl)
        resolve({serverUrl, peers: -1})
      }
    }, 10000)
  })
}
