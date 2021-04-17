import { BigNumber, FixedNumber } from 'ethers'
import assert from 'assert'
import BigNumberJS from 'bignumber.js'

export enum StartPoint {
    BASE = 'BASE',
    ALT = 'ALT',
    NONE = 'NONE'
}

export interface TradeDetails {
    START_POINT: StartPoint
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

export function calcArb(
    inputAmount: BigNumber,
    startPoint: StartPoint,
    reserveAX: BigNumber,
    reserveAY: BigNumber,
    reserveBX: BigNumber,
    reserveBY: BigNumber,
) {
    if (startPoint === StartPoint.BASE) {
        [reserveAY, reserveAX] = [reserveAX, reserveAY];
        [reserveBY, reserveBX] = [reserveBX, reserveBY]
    }

    const temp = getAmountOut(inputAmount, reserveBY, reserveBX, 0.003)
    const out = getAmountOut(temp, reserveAX, reserveAY, 0.003)

    return out.sub(inputAmount)
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
    _reserveAY : BigNumber,
    _reserveBX : BigNumber,
    _reserveBY : BigNumber
) {
    let reserveAX = new BigNumberJS(_reserveAX.toString())
    let reserveAY = new BigNumberJS(_reserveAY.toString())
    let reserveBX = new BigNumberJS(_reserveBX.toString())
    let reserveBY = new BigNumberJS(_reserveBY.toString())
    
    // Assume X is our stablecoin or MATIC or WETH or whatever
    // First find trade direction -- will throw if insufficient liquidity
    let START_POINT: StartPoint = tradeDirection(_reserveAX, _reserveAY, _reserveBX, _reserveBY)
    
    let reserveA0: BigNumberJS, reserveA1: BigNumberJS, reserveB0: BigNumberJS, reserveB1: BigNumberJS
    let sr_reserveA0: BigNumberJS, sr_reserveA1: BigNumberJS, sr_reserveB0: BigNumberJS, sr_reserveB1: BigNumberJS

    if (START_POINT === StartPoint.BASE) {
        [reserveA0, reserveA1] = [reserveAY, reserveAX];
        [reserveB0, reserveB1] = [reserveBY, reserveBX]
    } else {
        [reserveA0, reserveA1] = [reserveAX, reserveAY];
        [reserveB0, reserveB1] = [reserveBX, reserveBY]
    }
    [sr_reserveA0, sr_reserveA1, sr_reserveB0, sr_reserveB1] = [reserveA0.sqrt(), reserveA1.sqrt(), reserveB0.sqrt(), reserveB1.sqrt()]

    let fee: BigNumberJS = new BigNumberJS(1 - 0.003)
    let inputAmount: BigNumberJS

    let numerator = (fee.times(sr_reserveB0).times(sr_reserveA1).minus(sr_reserveA0.times(sr_reserveB1))).times(sr_reserveA0).times(sr_reserveB1)
    let denominator = fee.times(fee.times(reserveB0).plus(reserveA0))
    inputAmount = numerator.div(denominator)

    const initialLoan = BigNumber.from(inputAmount.decimalPlaces(0).toFixed())
    
    const temp = getAmountOut(
        initialLoan,
        BigNumber.from(reserveB1.toFixed()),
        BigNumber.from(reserveB0.toFixed()),
        0.003
    )
    const out = getAmountOut(
        temp,
        BigNumber.from(reserveA0.toFixed()),
        BigNumber.from(reserveA1.toFixed()),
        0.003
    )
    
    const expectedProfit = out.sub(initialLoan)

    const output: TradeDetails = {
        START_POINT,
        initialLoan,
        expectedProfit
    }
    return output
}

export function tradeDirection (
    _reserveAX : BigNumber,
    _reserveAY : BigNumber,
    _reserveBX : BigNumber,
    _reserveBY : BigNumber
): StartPoint {
    const reserveAX = new BigNumberJS(_reserveAX.toString())
    const reserveAY = new BigNumberJS(_reserveAY.toString())
    const reserveBX = new BigNumberJS(_reserveBX.toString())
    const reserveBY = new BigNumberJS(_reserveBY.toString())
    
    if (reserveAX.eq(0) || reserveAY.eq(0) || reserveBX.eq(0) || reserveBY.eq(0)) {
        throw new Error('INSUFFICIENT LIQUIDITY')
    }

    // Assume X is our stablecoin or MATIC or WETH or whatever
    // True price ==> 1 of tokenY = truePrice of tokenX
    const truePrice = reserveAX.plus(reserveBX).div(reserveAY.plus(reserveBY))
    const ratioA = reserveAX.div(reserveAY)

    // if truePrice is smaller than ratio on exchangeA. we need to flashloan main coin to sell on exchange B
    // else, flashloan other coin
    let START_POINT: StartPoint
    if (truePrice.lt(ratioA)) {
        START_POINT = StartPoint.BASE
    } else if (truePrice.gt(ratioA)) {
        START_POINT = StartPoint.ALT
    } else {
        console.log(truePrice.toFixed(), ratioA.toFixed())
        START_POINT = StartPoint.NONE
    }

    return START_POINT
}