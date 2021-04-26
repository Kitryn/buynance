import { expect } from 'chai'
import { ethers, BigNumber } from 'ethers'
import { tradeDirection, findMaxBuy, executionPrice, getAmountOut, calcArb, StartPoint } from '@buynance/common/dist/utils'

describe('utils', () => {
    let reserveAX: BigNumber
    let reserveA1: BigNumber
    let reserveBX: BigNumber
    let reserveB1: BigNumber
    // assume tokenX is our maincoin (USD/WETH etc)

    describe('utils/tradeDirection', () => {
        beforeEach(() => {
            reserveAX = ethers.utils.parseEther('1000')
            reserveA1 = ethers.utils.parseEther('1000')
            reserveBX = ethers.utils.parseEther('1000')
            reserveB1 = ethers.utils.parseEther('950')
        })

        it('Should return ALT', () => {
            expect(tradeDirection(reserveAX, reserveA1, reserveBX, reserveB1)).to.equal('ALT')
        })

        it('Should return BASE', () => {
            reserveB1 = ethers.utils.parseEther('10000')
            expect(tradeDirection(reserveAX, reserveA1, reserveBX, reserveB1)).to.equal('BASE')
        })

        it('Should return NONE', () => {
            reserveB1 = ethers.utils.parseEther('1000')
            expect(tradeDirection(reserveAX, reserveA1, reserveBX, reserveB1)).to.equal('NONE')            
        })

        it('Should throw with insufficient liquidity', () => {
            reserveAX = ethers.utils.parseEther('0')
            expect(() => tradeDirection(reserveAX, reserveA1, reserveBX, reserveB1)).to.throw('INSUFFICIENT LIQUIDITY')
            
            reserveAX = ethers.utils.parseEther('1000')
            reserveA1 = ethers.utils.parseEther('0')
            expect(() => tradeDirection(reserveAX, reserveA1, reserveBX, reserveB1)).to.throw('INSUFFICIENT LIQUIDITY')

            reserveA1 = ethers.utils.parseEther('1000')
            reserveBX = ethers.utils.parseEther('0')
            expect(() => tradeDirection(reserveAX, reserveA1, reserveBX, reserveB1)).to.throw('INSUFFICIENT LIQUIDITY')

            reserveBX = ethers.utils.parseEther('1000')
            reserveB1 = ethers.utils.parseEther('0')
            expect(() => tradeDirection(reserveAX, reserveA1, reserveBX, reserveB1)).to.throw('INSUFFICIENT LIQUIDITY')
        })
    })

    describe('utils/findMaxBuy', () => {
        beforeEach(() => {
            reserveAX = ethers.utils.parseEther('1000')
            reserveA1 = ethers.utils.parseEther('1000')
            reserveBX = ethers.utils.parseEther('1000')
            reserveB1 = ethers.utils.parseEther('950')
        })

        it('TODO: Write some tests for this', () => {

            const tradeDetails = findMaxBuy(
                reserveAX,
                reserveA1,
                reserveBX,
                reserveB1,
                false
            )

            console.log(`Initial loan of ${tradeDetails.initialLoan.asset}: ${ethers.utils.formatEther(tradeDetails.initialLoan.quantity)}`)
            console.log(`Expected profit in ${tradeDetails.expectedProfit.asset}: ${ethers.utils.formatEther(tradeDetails.expectedProfit.quantity)}`)

        })
    })
})