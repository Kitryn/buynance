import assert from 'assert'

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}


const dbConn = require('./models/DbConfig')()
import { PairsModel } from './models/PairsModel'
import { SqliteError } from 'better-sqlite3'
import { ChainData } from './chain_interface/ChainData'
import { PairAccount } from './chain_interface/PairAccount'
import { TokenAccount } from './chain_interface/TokenAccount'
import { ethers } from 'ethers'



// const db = require('./models/DbConfig')()
// const pairsDb = new Pairs(db)
const mainnet_PancakeFactoryAddress = '0xBCfCcbde45cE874adCB698cC183deBcF17952812'
const mainnet_BAKE_BUSD = '0xE2D1B285d83efb935134F644d00FB7c943e84B5B'
const mainnet_BUSD = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
const mainnet_BAKE = '0xE02dF9e3e622DeBdD69fb838bB799E3F168902c5'

const testnet_PancakeFactoryAddress = '0x6725F303b657a9451d8BA641348b6761A6CC7a17'


async function main() {
    // const db = new PairsModel(dbConn)
    // db.addFactory('Pancakeswap', mainnet_PancakeFactoryAddress)
    // const provider = new ethers.providers.JsonRpcProvider(RpcUrl.MAINNET)
    const RPC_URL = process.env.NETWORK === 'MAINNET' ? process.env.RPC_URL : process.env.RPC_URL_TESTNET
    
    const chainData = new ChainData(RPC_URL)
    chainData.loadAllFactories()
    // chainData.registerNewFactory('Pancakeswap Testnet', mainnet_PancakeFactoryAddress, 0.002)
    await chainData.sync(mainnet_PancakeFactoryAddress)
}

main()