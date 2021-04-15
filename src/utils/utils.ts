import ethers from 'ethers'
import { BigNumber, FixedNumber } from 'ethers'
import { Price, BigintIsh } from '@uniswap/sdk'
import assert from 'assert'

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

// export function findMaxBuy(
//     reserve0In: BigNumber,
//     reserve0Out: BigNumber,
//     fee0: number,
//     reserve1In: BigNumber,
//     reserve1Out: BigNumber,
//     fee1: number
// ) {
    
// }

// export function findMaxBuy(
    // reserve0In: BigNumber,
    // reserve0Out: BigNumber,
    // fee0: number,
    // reserve1In: BigNumber,
    // reserve1Out: BigNumber,
    // fee1: number
// ) {
//     // TODO -- REFACTOR TO USE UNISWAP SDK TOKENAMOUNTS??

//     const _fee0 = FixedNumber.from(1-fee0)
//     const _fee1 = FixedNumber.from(1-fee1)
//     const reserve0x = FixedNumber.from(reserve0In)
//     const reserve0y = FixedNumber.from(reserve0Out)
//     const reserve1x = FixedNumber.from(reserve1In)
//     const reserve1y = FixedNumber.from(reserve1Out)

//     // (sqrt(fee2)sqrt(r2x)sqrt(r2y)sqrt(r1x)sqrt(r1y)) / (sqrt(fee1)(fee2*r1y*r2y)) - (r2y*r1x) / (fee1(fee2*r1y+r2y))
// }

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