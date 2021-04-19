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
import { Factories, BaseTokens } from './addresses'
import { Factory } from './types'

// const db = require('./models/DbConfig')()
// const pairsDb = new Pairs(db)
const mainnet_BAKE_BUSD = '0xE2D1B285d83efb935134F644d00FB7c943e84B5B'
const mainnet_BUSD = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
const mainnet_BAKE = '0xE02dF9e3e622DeBdD69fb838bB799E3F168902c5'


async function main() {
    console.log(`Running on ${process.env.NETWORK}`)
    const RPC_URL = process.env.NETWORK === 'MAINNET' ? process.env.RPC_URL : process.env.RPC_URL_TESTNET
    
    const chainData = new ChainData(RPC_URL)
    chainData.loadAllFactories()

    // load factories from hardcoded factories since if it already exists, nothing happens
    for (const factoryKey in Factories) {
        const factoryInfo: Factory = Factories[factoryKey]
        chainData.registerNewFactory(factoryInfo.name, factoryInfo.contract_address, factoryInfo.router_address, factoryInfo.fee)
    }
    await chainData.sync(Factories.QUICKSWAP_FACTORY.contract_address)
    await chainData.sync(Factories.COMETHSWAP_FACTORY.contract_address)
}

main()