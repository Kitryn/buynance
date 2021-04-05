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

async function main() {
    const db = new PairsModel(dbConn)
    db.addFactory('Pancakeswap', mainnet_PancakeFactoryAddress)
}

main()