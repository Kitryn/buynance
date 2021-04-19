import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'
import { findMaxBuy, getAmountOut, StartPoint } from '../src/utils/utils'
const formatEther = ethers.utils.formatEther

const BSC_ARB_ADD = '0x0554b483576E08c5d18Cfc410e63ccf62ae84530'
const BSC_WBNB = '0xae13d989dac2f0debff460ac112a837c89baa7cd'
const BSC_BUSD = '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee'

const sashimi_factory = '0x5240870Cc7A4E28eE7A79cf77d0dF69957B92da2'
const pancake_factory = '0x6725F303b657a9451d8BA641348b6761A6CC7a17'

const BSC_pancakepair = '0x575Cb459b6E6B8187d3Ef9a25105D64011874820'
const BSC_sashimipair = '0x43BDf7284D8c44A050ce0A240db378Ae123ce4C5'

async function main() {
    const Arb = await ethers.getContractFactory('Arbitrage')
    const arb = await Arb.attach(BSC_ARB_ADD)

    const Pair = await ethers.getContractFactory('Pair1')
    const pancakePair = await Pair.attach(BSC_pancakepair)
    const sashimiPair = await Pair.attach(BSC_sashimipair)

    const pancakeReserves = await pancakePair.getReserves()
    let pcr_WBNB, pcr_BUSD
    [pcr_WBNB, pcr_BUSD] = BSC_WBNB.toLowerCase() < BSC_BUSD.toLowerCase() ? [pancakeReserves._reserve0, pancakeReserves._reserve1] : [pancakeReserves._reserve1, pancakeReserves._reserve0]

    const sashimiReserves = await sashimiPair.getReserves()
    let ssr_WBNB, ssr_BUSD
    [ssr_WBNB, ssr_BUSD] = BSC_WBNB.toLowerCase() < BSC_BUSD.toLowerCase() ? [sashimiReserves._reserve0, sashimiReserves._reserve1] : [sashimiReserves._reserve1, sashimiReserves._reserve0]        
    console.log(`Pancakeswap: WBNB: ${formatEther(pcr_WBNB)} | BUSD: ${formatEther(pcr_BUSD)}`)
    console.log(`Sashimiswap: WBNB: ${formatEther(ssr_WBNB)} | BUSD: ${formatEther(ssr_BUSD)}`)

    let tradeDetails = findMaxBuy(
        pcr_WBNB,
        pcr_BUSD,
        ssr_WBNB,
        ssr_BUSD,
        true
    )

    let flashloanBASE: boolean = tradeDetails.START_POINT === StartPoint.BASE ? true : false
    console.log(`TradeDetails: Start ${tradeDetails.START_POINT}, Loan ${formatEther(tradeDetails.initialLoan.quantity)}, Expected ${formatEther(tradeDetails.expectedProfit.quantity)}`)

    const gasEstimate = await arb.estimateGas.startArbitrage(
        BSC_WBNB,
        BSC_BUSD,
        tradeDetails.initialLoan.quantity,
        flashloanBASE
    )
    console.log(`Estimate gas used: ${gasEstimate}`)

    await arb.startArbitrage(
        BSC_WBNB,
        BSC_BUSD,
        tradeDetails.initialLoan.quantity,
        flashloanBASE
    )
}

main().then(() => process.exit(0)).catch(err => {
    console.error(err)
    process.exit(1)
})