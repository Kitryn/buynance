import assert from 'assert'

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

import { Pairs } from './models/Pairs'
import { ChainData } from './ChainData'
import { PairAccount } from './PairAccount'
import { RpcUrl } from './types'
import { ethers } from 'ethers'



// const db = require('./models/DbConfig')()
// const pairsDb = new Pairs(db)
const mainnet_PancakeFactoryAddress = '0xBCfCcbde45cE874adCB698cC183deBcF17952812'
const mainnet_BAKE_BUSD = '0xE2D1B285d83efb935134F644d00FB7c943e84B5B'

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(RpcUrl.MAINNET)
    const pair = new PairAccount(mainnet_BAKE_BUSD, provider)
    console.log(await pair.getPair())
}

main()