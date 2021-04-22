if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
import { ChainData } from './server/chain_interface/ChainData'
const RPC_URL = process.env.NETWORK === 'MAINNET' ? process.env.RPC_URL : process.env.RPC_URL_TESTNET
const chainData = new ChainData(RPC_URL, true)

import { Contract, ethers } from 'ethers'
import abiDecoder from 'abi-decoder'
import fs from 'fs'
import path from 'path'

const ABI_filenames = fs.readdirSync(path.resolve(__dirname, 'server', 'ABI'))
ABI_filenames.forEach(fileName => {
    const fullPath = path.resolve(__dirname, 'server', 'ABI', fileName)
    abiDecoder.addABI(require(fullPath))
})

async function main() {
    // const contract = new Contract('0x800b052609c355cA8103E06F022aA30647eAd60a', require('./server/ABI/UniswapV2Factory.json'), chainData.provider)
    // const filter = contract.filters.PairCreated(null, null)
    // const result = await contract.queryFilter(filter)
    // console.log(result.length)

    const result = abiDecoder.decodeMethod('0x95e3c50b00000000000000000000000000000000000000000000000009fdf42f6e48000000000000000000000000000000000000000000000000000009f1c7d28ffab3df0000000000000000000000000000000000000000000000000000000060802669')
    console.log(result)
    console.log(abiDecoder.getMethodIDs())
}

main().then(() => {
    process.exit(0)
})
