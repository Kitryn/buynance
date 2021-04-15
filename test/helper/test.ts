import { expect } from 'chai'
import { ethers, BigNumber } from 'ethers'
import { tradeDirection, findMaxBuy } from '../../src/utils/utils'

describe('utils/tradeDirection', () => {
    let reserveA0: BigNumber
    let reserveA1: BigNumber
    let reserveB0: BigNumber
    let reserveB1: BigNumber
    
    beforeEach(() => {
        reserveA0 = ethers.utils.parseEther('1000')
        reserveA1 = ethers.utils.parseEther('1000')
        reserveB0 = ethers.utils.parseEther('1000')
        reserveB1 = ethers.utils.parseEther('950')
    })
    
    it('Should return correct trade direction', () => {
        expect(tradeDirection(reserveA0, reserveA1, reserveB0, reserveB1)).to.be.true
        reserveB1 = ethers.utils.parseEther('10000')
        expect(tradeDirection(reserveA0, reserveA1, reserveB0, reserveB1)).to.be.false
    })

    it('Should fail if ratios are equal', () => {
        reserveB1 = ethers.utils.parseEther('1000')
        expect(() => tradeDirection(reserveA0, reserveA1, reserveB0, reserveB1)).to.throw()
    })

    it('Should do something', () => {
        const tradeDetails = findMaxBuy(
            reserveA0,
            reserveA1,
            reserveB0,
            reserveB1
        )
        console.log(tradeDetails.START_POINT, ethers.utils.formatEther(tradeDetails.initialLoan), ethers.utils.formatEther(tradeDetails.expectedProfit))
    })
})