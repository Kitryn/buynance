import { expect } from 'chai'
import { ethers, BigNumber } from 'ethers'
import { tradeDirection } from '../../src/utils/utils'

describe('utils/tradeDirection', () => {
    let reserveA0: BigNumber
    let reserveA1: BigNumber
    let reserveB0: BigNumber
    let reserveB1: BigNumber
    
    beforeEach(() => {
        reserveA0 = BigNumber.from(1000)
        reserveA1 = BigNumber.from(1000)
        reserveB0 = BigNumber.from(1000)
        reserveB1 = BigNumber.from(950)
    })
    
    it('Should return correct trade direction', () => {
        expect(tradeDirection(reserveA0, reserveA1, reserveB0, reserveB1)).to.be.true
        reserveB1 = BigNumber.from(10000)
        expect(tradeDirection(reserveA0, reserveA1, reserveB0, reserveB1)).to.be.false
    })

    it('Should fail if ratios are equal', () => {
        reserveB1 = BigNumber.from(1000)
        expect(() => tradeDirection(reserveA0, reserveA1, reserveB0, reserveB1)).to.throw()
    })
})