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

    const file = fs.readFileSync('/tmp/10m.data')
    addTestFile(file, (err, multihash) => {
      pull(
        exporter(multihash, ipld),
        pull.collect((err, files) => {
          // console.log('files:', files)
          pull(
            files[0].content,
            pull.collect((err, content) => {
              const data = Buffer.concat(content)
              console.log('content:', data)
              // console.log(data.toString())
              fs.writeFileSync('/tmp/unixfsout.dat', data)
            })
          )
        })
      )
    })
  })
})
