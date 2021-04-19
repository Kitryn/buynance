import { BigNumber, FixedNumber } from 'ethers'
import assert from 'assert'
import { AssertionError } from 'assert'
import BigNumberJS from 'bignumber.js'

export enum StartPoint {
    BASE = 'BASE',
    ALT = 'ALT',
    NONE = 'NONE'
}

export interface Quantity {
    asset: 'BASE' | 'ALT' | 'NONE'
    quantity: BigNumber
}

export interface TradeDetails {
    START_POINT: StartPoint
    initialLoan: Quantity
    expectedProfit: Quantity
}

export function addressSortOrder(address0: string, address1: string): [string, string] {
    return address0.toLowerCase() < address1.toLowerCase() ? [address0, address1] : [address1, address0]
}

export function getAmountOut(  // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
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

export function getAmountOutSimulate(
    amountIn: BigNumber,
    reserveIn: BigNumber,
    reserveOut: BigNumber,
    fee: number
) {
    assert(amountIn.gt(0))
    assert(reserveIn.gt(0) && reserveOut.gt(0))
    assert(fee >= 0.001 || fee === 0)  // either no fee, or min fee 0.001%

    const amountInWithFee: BigNumber = amountIn.mul(1000 - (fee * 1000))
    const numerator = amountInWithFee.mul(reserveOut)
    const denominator = reserveIn.mul(1000).add(amountInWithFee)
    const amountOut = numerator.div(denominator)

    return {
        amountOut,
        reserveIn: reserveIn.add(amountIn),
        reserveOut: reserveOut.sub(amountOut)
    }
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
    _reserveA_BASE : BigNumber,
    _reserveA_ALT : BigNumber,
    _reserveB_BASE : BigNumber,
    _reserveB_ALT : BigNumber,
    convertProfitToBase: boolean
): TradeDetails {
    // Assume two exchanges A and B
    // Assume two coins Base (USD, WETH etc) and Alt (any)
    let reserveA_BASE = new BigNumberJS(_reserveA_BASE.toString())
    let reserveA_ALT = new BigNumberJS(_reserveA_ALT.toString())
    let reserveB_BASE = new BigNumberJS(_reserveB_BASE.toString())
    let reserveB_ALT = new BigNumberJS(_reserveB_ALT.toString())
    
    let START_POINT: StartPoint = tradeDirection(_reserveA_BASE, _reserveA_ALT, _reserveB_BASE, _reserveB_ALT)
    if (START_POINT === StartPoint.NONE) {
        const temp: Quantity = {
            asset: 'NONE',
            quantity: BigNumber.from(0) 
        }
        return {
            START_POINT,
            initialLoan: temp,
            expectedProfit: temp
        }
    }
    
    let reserveA0: BigNumberJS, reserveA1: BigNumberJS, reserveB0: BigNumberJS, reserveB1: BigNumberJS
    let sr_reserveA0: BigNumberJS, sr_reserveA1: BigNumberJS, sr_reserveB0: BigNumberJS, sr_reserveB1: BigNumberJS

    if (START_POINT === StartPoint.BASE) {
        // Flash loan A_BASE to sell to B_BASE
        [reserveA0, reserveA1] = [reserveA_ALT, reserveA_BASE];
        [reserveB0, reserveB1] = [reserveB_ALT, reserveB_BASE]
    } else {
        // Flash loan A_ALT to sell to B_ALT
        [reserveA0, reserveA1] = [reserveA_BASE, reserveA_ALT];
        [reserveB0, reserveB1] = [reserveB_BASE, reserveB_ALT]
    }
    [sr_reserveA0, sr_reserveA1, sr_reserveB0, sr_reserveB1] = [reserveA0.sqrt(), reserveA1.sqrt(), reserveB0.sqrt(), reserveB1.sqrt()]

    let fee: BigNumberJS = new BigNumberJS(1 - 0.003)

    let numerator = (fee.times(sr_reserveB0).times(sr_reserveA1).minus(sr_reserveA0.times(sr_reserveB1))).times(sr_reserveA0).times(sr_reserveB1)
    let denominator = fee.times(fee.times(reserveB0).plus(reserveA0))
    let inputAmount: BigNumberJS = numerator.div(denominator)
    
    // initialLoan in terms of BASE/ALT depending on START_POINT
    const _initialLoan = BigNumber.from(inputAmount.decimalPlaces(0).toFixed())
    
    // If flashloan ALT to begin with, profits will be in BASE
    // If flashloan BASE to begin with, profits will be in ALT so may need to convert depending on convertProfitToBase
    
    try {
        let midstep: BigNumber
        midstep = getAmountOut(
            _initialLoan,
            BigNumber.from(reserveB1.toFixed()),
            BigNumber.from(reserveB0.toFixed()),
            0.003
        )

        let _expectedProfit: BigNumber
        let expectedProfit: Quantity
    
        if (START_POINT === StartPoint.ALT) {
            const repay = getAmountIn(_initialLoan, BigNumber.from(reserveA0.toFixed()), BigNumber.from(reserveA1.toFixed()), 0.003)
            _expectedProfit = midstep.sub(repay)
            expectedProfit = {
                asset: 'BASE',
                quantity: _expectedProfit
            }
        } else {
            // START_POINT === BASE
            if (convertProfitToBase) {
                const out = getAmountOut(midstep, BigNumber.from(reserveA0.toFixed()), BigNumber.from(reserveA1.toFixed()), 0.003)
                _expectedProfit = out.sub(_initialLoan)
                expectedProfit = {
                    asset: 'BASE',
                    quantity: _expectedProfit
                }
            } else {
                const repay = getAmountIn(_initialLoan, BigNumber.from(reserveA0.toFixed()), BigNumber.from(reserveA1.toFixed()), 0.003)
                _expectedProfit = midstep.sub(repay)
                expectedProfit = {
                    asset: 'ALT',
                    quantity: _expectedProfit
                }
            }
        }
    
    
        const output: TradeDetails = {
            START_POINT,
            initialLoan: {
                asset: START_POINT === StartPoint.BASE ? 'BASE' : 'ALT',
                quantity: _initialLoan
            },
            expectedProfit
        }
        return output

    } catch (err) {
        // Possibly insufficient liquidity to make the trade (Case: reserve = 1 and can't go any lower)
        if (err instanceof AssertionError) {
            // console.error(err)
            // console.log(START_POINT)
            // console.log(_initialLoan.toString())
            console.error('Probably insufficient liquidity')
            const temp: Quantity = {
                asset: 'NONE',
                quantity: BigNumber.from(0) 
            }
            return {
                START_POINT: StartPoint.NONE,
                initialLoan: temp,
                expectedProfit: temp
            } 
        }
        throw (err)
    }
}

export function tradeDirection (
    _reserveA_BASE : BigNumber,
    _reserveA_ALT : BigNumber,
    _reserveB_BASE : BigNumber,
    _reserveB_ALT : BigNumber
): StartPoint {
    const reserveA_BASE = new BigNumberJS(_reserveA_BASE.toString())
    const reserveA_ALT = new BigNumberJS(_reserveA_ALT.toString())
    const reserveB_BASE = new BigNumberJS(_reserveB_BASE.toString())
    const reserveB_ALT = new BigNumberJS(_reserveB_ALT.toString())
    
    if (reserveA_BASE.eq(0) || reserveA_ALT.eq(0) || reserveB_BASE.eq(0) || reserveB_ALT.eq(0)) {
        throw new Error('INSUFFICIENT LIQUIDITY')
    }

    // Assume X is our stablecoin or MATIC or WETH or whatever
    // True price ==> 1 of tokenY = truePrice of tokenX
    const truePrice = reserveA_BASE.plus(reserveB_BASE).div(reserveA_ALT.plus(reserveB_ALT))
    const ratioA = reserveA_BASE.div(reserveA_ALT)

    // if truePrice is smaller than ratio on exchangeA. we need to flashloan main coin to sell on exchange B
    // else, flashloan other coin
    let START_POINT: StartPoint
    if (truePrice.lt(ratioA)) {
        START_POINT = StartPoint.BASE
    } else if (truePrice.gt(ratioA)) {
        START_POINT = StartPoint.ALT
    } else {
        console.log(`Ratio between Base and Alt is the same!`)
        START_POINT = StartPoint.NONE
    }

    return START_POINT
}