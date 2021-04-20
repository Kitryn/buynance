if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const dbConn = require('./models/DbConfig')()
import { PairsModel } from './models/PairsModel'
import { ChainData } from './chain_interface/ChainData'
import { ethers } from 'ethers'
import { Factories } from './addresses'
// import abiDecoder from 'abi-decoder'
const routerABI = require('./ABI/uniswapv2router02.json')

const routerAddresses = Object.keys(Factories).map(elem => Factories[elem].router_address.toLowerCase())
const routerNames: Record<string, string | undefined> = {}

for (const address of routerAddresses) {
    routerNames[address] = Object.keys(Factories).find(elem => {
        if (Factories[elem].router_address.toLowerCase() === address) {
            return true
        }
        return false
    })
}

const routerInterface = new ethers.utils.Interface(routerABI)

const db = new PairsModel(dbConn)
const commonPairs = db.getCommonPairs()
// console.log(result)
// console.log(db.getPairTicker('0xc41ae5e54d006ce309df5b03fc56f334d1350083'))

const RPC_URL = process.env.NETWORK === 'MAINNET' ? process.env.RPC_URL : process.env.RPC_URL_TESTNET
const chainData = new ChainData(RPC_URL)


async function main() {
    chainData.loadAllFactories()
 
    chainData.provider.on('block', async (blockNumber) => {
        const result = await chainData.provider.getBlockWithTransactions(blockNumber)
        const transactions = result.transactions
        for (const transaction of transactions) {
            if (transaction.to == null) continue
            if (routerAddresses.includes(transaction.to.toString().toLowerCase())) {
                
                const factoryName = routerNames[transaction.to.toString().toLowerCase()]
                
                let data
                try {
                    data = routerInterface.parseTransaction(transaction)
                } catch (err) {
                    console.error(err)
                    continue
                }

                console.log(`Call to router ${factoryName} in block ${blockNumber} func ${data.functionFragment.name}`)

                const trackedFunctions = [
                    'swapTokensForExactTokens',
                    'swapTokensForExactETH',
                    'swapExactTokensForTokens',
                    'swapExactTokensForETH',
                    'swapExactETHForTokens',
                    'swapETHForExactTokens',

                    // 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
                    // 'swapExactTokensForETHSupportingFeeOnTransferTokens',
                    // 'swapExactETHForTokensSupportingFeeOnTransferTokens',

                ]
                const functionName = data.functionFragment.name
                if (trackedFunctions.includes(functionName) == false) continue

                const slug = `${data.args.path[0].toLowerCase()};${data.args.path[1].toLowerCase()}`
                const pair = commonPairs.get(slug)
                
                if (pair == null) continue
                const tradeDetails = await chainData.getPairLiquidity(pair)
                console.log(`Pair: ${db.getPairTicker(pair[0].contract_address)}`)
                console.log(`TradeDetails: Start ${tradeDetails.START_POINT}, Loan ${ethers.utils.formatEther(tradeDetails.initialLoan.quantity)}, Expected ${ethers.utils.formatEther(tradeDetails.expectedProfit.quantity)}`)
                console.log('--------------')
            }
        }
    })
    // for (let [key, value] of commonPairs) {
    //     const tradeDetails = await chainData.getPairLiquidity(value)
        
    //     console.log(`Pair: ${db.getPairTicker(value[0].contract_address)}`)
    //     console.log(`TradeDetails: Start ${tradeDetails.START_POINT}, Loan ${ethers.utils.formatEther(tradeDetails.initialLoan.quantity)}, Expected ${ethers.utils.formatEther(tradeDetails.expectedProfit.quantity)}`)
    //     console.log('--------------')
    // }
}

async function tmp() {
    const code = await chainData.provider.getCode('0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff')
    console.log(code)
    // const contract = new ethers.Contract('0x7dd75252cc324FD181fC4e79335b7d78A11a8019', routerABI, chainData.provider)
    // console.log(await contract.WETH())
}

main()
// tmp()