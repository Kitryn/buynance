if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const dbConn = require('./models/DbConfig')()
import { PairsModel } from './models/PairsModel'
import { ChainData } from './chain_interface/ChainData'
import { ethers } from 'ethers'

async function main() {
    const db = new PairsModel(dbConn)
    const result = db.getCommonPairs()
    console.log(result.size)
    // console.log(db.getPairTicker('0xc41ae5e54d006ce309df5b03fc56f334d1350083'))

    const RPC_URL = process.env.NETWORK === 'MAINNET' ? process.env.RPC_URL : process.env.RPC_URL_TESTNET
    
    const chainData = new ChainData(RPC_URL)
    chainData.loadAllFactories()

    for (let [key, value] of result) {
        const tradeDetails = await chainData.getPairLiquidity(value)
        
        console.log(`Pair: ${db.getPairTicker(value[0].contract_address)}`)
        console.log(`TradeDetails: Start ${tradeDetails.START_POINT}, Loan ${ethers.utils.formatEther(tradeDetails.initialLoan.quantity)}, Expected ${ethers.utils.formatEther(tradeDetails.expectedProfit.quantity)}`)
        console.log('--------------')
    }
}

main()