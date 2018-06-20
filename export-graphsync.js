/* eslint-env mocha */
'use strict'

const fs = require('fs')

const BlockService = require('ipfs-block-service')
const IpfsRepo = require('ipfs-repo')
const Ipld = require('ipld')
const pull = require('pull-stream')

const unixFSEngine = require('./src')
const exporter = unixFSEngine.exporter
const importer = unixFSEngine.importer

const repo = new IpfsRepo('/tmp/unixfsenginerepo')
const PeerId = require('peer-id')
const PeerInfo = require('peer-info')
const Node = require('./libp2p-bundle')


const peerInfo = {
  "id": "Qma3GsJmB47xYuyahPZPSadh1avvxfyYQwk8R3UnFrQ6aP",
  "privKey": "CAASpwkwggSjAgEAAoIBAQCaNSDOjPz6T8HZsf7LDpxiQRiN2OjeyIHUS05p8QWOr3EFUCFsC31R4moihE5HN+FxNalUyyFZU//yjf1pdnlMJqrVByJSMa+y2y4x2FucpoCAO97Tx+iWzwlZ2UXEUXM1Y81mhPbeWXy+wP2xElTgIER0Tsn/thoA0SD2u9wJuVvM7dB7cBcHYmqV6JH+KWCedRTum6O1BssqP/4Lbm2+rkrbZ4+oVRoU2DRLoFhKqwqLtylrbuj4XOI3XykMXV5+uQXz1JzubNOB9lsc6K+eRC+w8hhhDuFMgzkZ4qomCnx3uhO67KaICd8yqqBa6PJ/+fBM5Xk4hjyR40bwcf41AgMBAAECggEAZnrCJ6IYiLyyRdr9SbKXCNDb4YByGYPEi/HT1aHgIJfFE1PSMjxcdytxfyjP4JJpVtPjiT9JFVU2ddoYu5qJN6tGwjVwgJEWg1UXmPaAw1T/drjS94kVsAs82qICtFmwp52Apg3dBZ0Qwq/8qE1XbG7lLyohIbfCBiL0tiPYMfkcsN9gnFT/kFCX0LVs2pa9fHCRMY9rqCc4/rWJa1w8sMuQ23y4lDaxKF9OZVvOHFQkbBDrkquWHE4r55fchCz/rJklkPJUNENuncBRu0/2X+p4IKFD1DnttXNwb8j4LPiSlLro1T0hiUr5gO2QmdYwXFF63Q3mjQy0+5I4eNbjjQKBgQDZvZy3gUKS/nQNkYfq9za80uLbIj/cWbO+ZZjXCsj0fNIcQFJcKMBoA7DjJvu2S/lf86/41YHkPdmrLAEQAkJ+5BBNOycjYK9minTEjIMMmZDTXXugZ62wnU6F46uLkgEChTqEP57Y6xwwV+JaEDFEsW5N1eE9lEVX9nGIr4phMwKBgQC1TazLuEt1WBx/iUT83ita7obXqoKNzwsS/MWfY2innzYZKDOqeSYZzLtt9uTtp4X4uLyPbYs0qFYhXLsUYMoGHNN8+NdjoyxCjQRJRBkMtaNR0lc5lVDWl3bTuJovjFCgAr9uqJrmI5OHcCIk/cDpdWb3nWaMihVlePmiTcTy9wKBgQCU0u7c1jKkudqks4XM6a+2HAYGdUBk4cLjLhnrUWnNAcuyl5wzdX8dGPi8KZb+IKuQE8WBNJ2VXVj7kBYh1QmSJVunDflQSvNYCOaKuOeRoxzD+y9Wkca74qkbBmPn/6FFEb7PSZTO+tPHjyodGNgz9XpJJRjQuBk1aDJtlF3m1QKBgE5SAr5ym65SZOU3UGUIOKRsfDW4Q/OsqDUImvpywCgBICaX9lHDShFFHwau7FA52ScL7vDquoMB4UtCOtLfyQYA9995w9oYCCurrVlVIJkb8jSLcADBHw3EmqF1kq3NqJqm9TmBfoDCh52vdCCUufxgKh33kfBOSlXuf7B8dgMbAoGAZ3r0/mBQX6S+s5+xCETMTSNv7TQzxgtURIpVs+ZVr2cMhWhiv+n0Omab9X9Z50se8cWl5lkvx8vn3D/XHHIPrMF6qk7RAXtvReb+PeitNvm0odqjFv0J2qki6fDs0HKwq4kojAXI1Md8Th0eobNjsy21fEEJT7uKMJdovI/SErI=",
  "pubKey": "CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCaNSDOjPz6T8HZsf7LDpxiQRiN2OjeyIHUS05p8QWOr3EFUCFsC31R4moihE5HN+FxNalUyyFZU//yjf1pdnlMJqrVByJSMa+y2y4x2FucpoCAO97Tx+iWzwlZ2UXEUXM1Y81mhPbeWXy+wP2xElTgIER0Tsn/thoA0SD2u9wJuVvM7dB7cBcHYmqV6JH+KWCedRTum6O1BssqP/4Lbm2+rkrbZ4+oVRoU2DRLoFhKqwqLtylrbuj4XOI3XykMXV5+uQXz1JzubNOB9lsc6K+eRC+w8hhhDuFMgzkZ4qomCnx3uhO67KaICd8yqqBa6PJ/+fBM5Xk4hjyR40bwcf41AgMBAAE="
}

PeerId.createFromJSON(peerInfo, (err, idDialer) => {
  if (err) {
    throw err
  }

  const peerDialer = new PeerInfo(idDialer)
  peerDialer.multiaddrs.add('/ip4/0.0.0.0/tcp/0')
  const nodeDialer = new Node(peerDialer)

  nodeDialer.start((err) => {
    if (err) {
      throw err
    }

    repo.init({}, () => {
      repo.open((err) => {
        if (err) {
          throw err
        }

        const bs = new BlockService(repo)
        const ipld = new Ipld(bs)

        const addTestFile = (file, cb) => {
          const path = 'foo'
          pull(
            pull.values([{
              path,
              content: file
            }]),
            importer(ipld, {
              // strategy,
              // chunkerOptions: {
              //   maxChunkSize
              // }
            }),
            pull.collect((error, nodes) => {
              cb(error, nodes && nodes[0] && nodes[0].multihash)
            })
          )
        }

        const peer = process.argv[2] || '/ip4/127.0.0.1/tcp/4002/ipfs/QmWW8TqH8W9uj6uTrjy5gMrgPiCQotbHAKhCKUwQSazVRc'

        // Qme79eYSxpXhhwr6bu6ZSnWJR9rnBFdYAC9hhYohRx6e35
        nodeDialer.dialProtocol(peer, '/ipfs/graphsync/0.1.0', (err, conn) => {
          if (err) {
            throw err
          }

          const file = fs.readFileSync('/tmp/10m.data')
          // addTestFile(file, (err, multihash) => {
            // console.log('multihash to get is:', multihash)
            const multihash = Buffer.from('1220ea459496d7c4ebc26f1f02bbfa5efc9c4fd646c9fde1cd09b478e992820d1ae4', 'hex')
            pull(
              exporter(multihash, conn),
              pull.collect((err, files) => {
                console.log('files:', files)
                pull(
                  files[0].content,
                  pull.collect((err, content) => {
                    if (err) {
                      throw err
                    }
                    console.log('export-graphsync: collecting!')
                    const data = Buffer.concat(content)
                    console.log('content:', data)
                    // console.log(data.toString())
                    fs.writeFileSync('/tmp/unixfsoutgraphsync.dat', data)
                  })
                  // pull.map((data) => {
                  //   console.log('export-graphsync: got some data:', data)
                  // }),
                  // pull.onEnd(() => {
                  //   console.log('vmx: onend')
                  // })
                )
              })
            )
          // })
        })
      })
    })
  })
})
