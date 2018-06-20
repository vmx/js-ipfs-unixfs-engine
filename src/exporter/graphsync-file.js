'use strict'

const traverse = require('pull-traverse')
const UnixFS = require('ipfs-unixfs')
const CID = require('cids')
const pull = require('pull-stream')
const paramap = require('pull-paramap')


const through = require('pull-through')
const BitswapMessage = require('ipfs-bitswap/src/types/message')
const ipldDagPb = require('ipld-dag-pb')

const splitBlocks = through(function (blocks) {
  console.log('within through')
  for (const block of blocks) {
    this.queue(block)
  }
})

const callGraphSync = (conn, cid) => {
  console.log('should be a cid:', cid)
  console.log('conn:', conn)

  return pull(
    // Send the CID to the other peer
    pull.values([cid]),

    conn,
    // At the moment, GrapgSync returns one huge message containing all
    // the blocks
    pull.asyncMap((data, cb) => {
      console.log('some data:', data.length)
      BitswapMessage.deserialize(data, cb)
    }),
    pull.asyncMap((msg, cb) => {
      // conn.getPeerInfo((err, peerInfo) => {
      //   if (err) { return cb(err) }
      //
      //   console.log('data from', peerInfo.id.toB58String())
      //   console.log('msg block:', msg.blocks.size)
      //   cb(null, msg.blocks)
      // })
      console.log('msg block:', msg.blocks.size)
      cb(null, msg.blocks)
    }),
    splitBlocks,
    pull.asyncMap((block, cb) => {
      // NOTE vmx 2018-06-08: This should be done in `splitBlocks()` but
      // I don't know how to make a `through` with a callback
      ipldDagPb.util.deserialize(block[1].data, (err, deserialized) => {
        if (err) {
          return cb(err)
        }
        const file = UnixFS.unmarshal(deserialized.data)
        cb(null, file.data)
      })
    }),
    pull.filter(Boolean)
  )
}

// Logic to export a single (possibly chunked) unixfs file.
module.exports = (node, name, path, pathRest, resolve, size, dag, parent, depth, offset, length) => {
  const accepts = pathRest[0]

  if (accepts !== undefined && accepts !== path) {
    return pull.empty()
  }

  const file = UnixFS.unmarshal(node.data)
  const fileSize = size || file.fileSize()

  if (offset < 0) {
    return pull.error(new Error('Offset must be greater than 0'))
  }

  if (offset > fileSize) {
    return pull.error(new Error('Offset must be less than the file size'))
  }

  if (length < 0) {
    return pull.error(new Error('Length must be greater than or equal to 0'))
  }

  if (length === 0) {
    return pull.empty()
  }

  if (!offset) {
    offset = 0
  }

  if (!length || (offset + length > fileSize)) {
    length = fileSize - offset
  }

  const cid = new CID(node.multihash).toBaseEncodedString()
  const content = callGraphSync(dag._graphsync, cid)

  return pull.values([{
    depth: depth,
    content: content,
    name: name,
    path: path,
    hash: node.multihash,
    size: fileSize,
    type: 'file'
  }])
}
