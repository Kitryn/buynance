import ethers from 'ethers'
import { BigNumber, FixedNumber } from 'ethers'
import { Price, BigintIsh } from '@uniswap/sdk'
import assert from 'assert'
import BigNumberJS from 'bignumber.js'

export interface TradeDetails {
    START_POINT: 'BASE' | 'ALT'
    initialLoan: BigNumber
    expectedProfit: BigNumber
}

export function addressSortOrder(address0: string, address1: string): [string, string] {
    return address0.toLowerCase() < address1.toLowerCase() ? [address0, address1] : [address1, address0]
}

export function getAmountOut (  // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    amountIn: BigNumber,
    reserveIn: BigNumber,
    reserveOut: BigNumber,
    fee: number
): BigNumber {
    assert(amountIn.gt(0))
    assert(reserveIn.gt(0) && reserveOut.gt(0))
    assert(fee >= 0.001 || fee === 0)  // either no fee, or min fee 0.001%

    const amountInWithFee: BigNumber = amountIn.mul(1000 - (fee * 1000))
    const numerator = amountInWithFee.mul(reserveOut)
    const denominator = reserveIn.mul(1000).add(amountInWithFee)

    return numerator.div(denominator)
}

export function getAmountIn(  // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
    amountOut: BigNumber,
    reserveIn: BigNumber,
    reserveOut: BigNumber,
    fee: number
): BigNumber {
    assert(amountOut.gt(0))
    assert(reserveIn.gt(0) && reserveOut.gt(0))
    assert(fee >= 0.001 || fee === 0)  // either no fee, or min fee 0.001%

    const numerator = reserveIn.mul(amountOut).mul(1000)
    const denominator = reserveOut.sub(amountOut).mul(1000 - (fee * 1000))
    
    return numerator.div(denominator)
}

export function executionPrice(
    amountIn: BigNumber,
    reserveIn: BigNumber,
    reserveOut: BigNumber,
    fee: number
): FixedNumber {
    assert(amountIn.gt(0))
    assert(reserveIn.gt(0) && reserveOut.gt(0))
    assert(fee >= 0.001 || fee === 0)  // either no fee, or min fee 0.001%

    const fnFee = FixedNumber.from((1 - fee).toString())

    const numerator = fnFee.mulUnsafe(FixedNumber.from(reserveOut))
    const denominator = FixedNumber.from(amountIn).mulUnsafe(fnFee).addUnsafe(FixedNumber.from(reserveIn))

    return numerator.divUnsafe(denominator)
}

export function findMaxBuy(
    _reserveAX : BigNumber,
    _reserveA1 : BigNumber,
    _reserveBX : BigNumber,
    _reserveB1 : BigNumber
): TradeDetails {
    const reserveAX = new BigNumberJS(_reserveAX.toString())
    const reserveA1 = new BigNumberJS(_reserveA1.toString())
    const reserveBX = new BigNumberJS(_reserveBX.toString())
    const reserveB1 = new BigNumberJS(_reserveB1.toString())
    
    // Assume X is our stablecoin or MATIC or WETH or whatever
    // True price in terms of our maincoin
    const truePrice = reserveAX.plus(reserveBX).div(reserveA1.plus(reserveB1))
    const ratioA = reserveAX.div(reserveA1)
    
    // Assume exchange A is our main exchange

    const kA = reserveAX.times(reserveA1)
    const kB = reserveBX.times(reserveB1)
    const new_reserveA1 = kA.div(truePrice).sqrt()
    // const new_reserveAX = kA.div(new_reserveA1)
    const new_reserveB1 = kB.div(truePrice).sqrt()
    // const new_reserveBX = kB.div(new_reserveB1)
    
    const profit1 = reserveA1.plus(reserveB1).minus(new_reserveA1).minus(new_reserveB1)
    // const profitX = reserveAX.plus(reserveBX).minus(new_reserveAX).minus(new_reserveBX)

    // we now need to get rid of 1 because we only want X. our maincoin
    const total1 = new_reserveA1.plus(new_reserveB1)
    const new_new_reserveA1 = new_reserveA1.plus(profit1.times(new_reserveA1.div(total1)))
    const new_new_reserveAX = kA.div(new_new_reserveA1)

    const new_new_reserveB1 = new_reserveB1.plus(profit1.times(new_reserveB1.div(total1)))
    const new_new_reserveBX = kB.div(new_new_reserveB1)

    const new_profit1 = reserveA1.plus(reserveB1).minus(new_new_reserveA1).minus(new_new_reserveB1)
    const new_profitX = reserveAX.plus(reserveBX).minus(new_new_reserveAX).minus(new_new_reserveBX)

    let START_POINT: 'BASE' | 'ALT'
    let initialLoan: BigNumber
    let expectedProfit: BigNumber
    let temp: BigNumberJS
    // if truePrice is smaller than ratio on exchangeA. we need to flashloan main coin to sell on exchange B
    // else, flashloan other coin
    if (truePrice.lt(ratioA)) {
        START_POINT = 'BASE'
        temp = new_new_reserveBX.minus(reserveBX)
    } else {
        START_POINT = 'ALT'
        temp = new_new_reserveB1.minus(reserveB1)
    }
    initialLoan = BigNumber.from(temp.toFixed(0))
    expectedProfit = BigNumber.from(new_profitX.toFixed(0))

    const output: TradeDetails = {
        START_POINT, initialLoan, expectedProfit
    }

    return output
}


export function tradeDirection (
    reserveA0 : BigNumber,
    reserveA1 : BigNumber,
    reserveB0 : BigNumber,
    reserveB1 : BigNumber
) {
    // Price if sell A0 to get A1 ==> A1/A0
    // BigNumber doesn't support decimals
    const precision = BigNumber.from('10000')  // Will be able to convert to ratio with up to 5 SF
    const A_ratio_n = reserveA1.mul(precision).div(reserveA0)
    const A_ratio = A_ratio_n.toNumber() / precision.toNumber()
    
    const B_ratio_n = reserveB1.mul(precision).div(reserveB0)
    const B_ratio = B_ratio_n.toNumber() / precision.toNumber()
    // Assume we're always starting on exchange A. 
    // If B_ratio < A_ratio, we should go A0->A1->B1->B0
    // If A_ratio < B_ratio, we should go from A1->A0->B0->B1
    // Convention -> consider 0->1 as forward (true) and 1->0 as backward (false)
    if (B_ratio < A_ratio) {
        return true
    } else if (B_ratio > A_ratio) {
        return false
    } else {
        throw new Error('Reserves ratio is equal between exchanges!')
    }
}