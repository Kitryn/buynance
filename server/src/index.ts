import assert from 'assert'

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const dbConn = require('./models/DbConfig')()
import { PairsModel } from './models/PairsModel'
import { ChainData } from './chain_interface/ChainData'
import { PairAccount } from './chain_interface/PairAccount'
import { TokenAccount } from './chain_interface/TokenAccount'
import { RpcUrl } from './types'
import { ethers } from 'ethers'



// const db = require('./models/DbConfig')()
// const pairsDb = new Pairs(db)
const mainnet_PancakeFactoryAddress = '0xBCfCcbde45cE874adCB698cC183deBcF17952812'
const mainnet_BAKE_BUSD = '0xE2D1B285d83efb935134F644d00FB7c943e84B5B'
const mainnet_BUSD = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
const mainnet_BAKE = '0xE02dF9e3e622DeBdD69fb838bB799E3F168902c5'


async function main() {
    const db = new PairsModel(dbConn)
    db.addFactory('Pancakeswap', mainnet_PancakeFactoryAddress)
    // Todo -- memoize get Token
    const provider = new ethers.providers.JsonRpcProvider(RpcUrl.MAINNET)
    const BUSDToken = new TokenAccount(mainnet_BUSD, provider)
    const BUSD = await BUSDToken.get()
    db.addToken(BUSD)

    const BAKEToken = new TokenAccount(mainnet_BAKE, provider)
    const BAKE = await BAKEToken.get()
    db.addToken(BAKE)

    const BAKE_BUSD_pair = new PairAccount(mainnet_BAKE_BUSD, provider)
    const pairInfo = await BAKE_BUSD_pair.get()
    console.log(pairInfo)
    db.addPair(pairInfo)
}

main()