import { ethers } from 'hardhat'
import { BigNumber, Contract, ContractFactory, ContractReceipt, ContractTransaction, Signer } from 'ethers'
import { expect } from 'chai'
import { addressSortOrder, executionPrice } from '../src/utils/utils'

let accounts: Signer[]
let owner: Signer
let chainId: number
let WETH: ContractFactory
let WETHToken: Contract
let ILM: ContractFactory
let ILMToken: Contract
let Factory1: ContractFactory
let Factory1Instance: Contract
let Factory2: ContractFactory
let Factory2Instance: Contract
let Router1: ContractFactory
let Router1Instance: Contract
let Router2: ContractFactory
let Router2Instance: Contract
let Pair1: ContractFactory
let Pair1Instance: Contract
let Pair2Instance: Contract

async function deployInfrastructure() {
    accounts = await ethers.getSigners()
    owner = accounts[0]
    chainId = await owner.getChainId()

    // Deploy all testing infrastructure first
    WETH = await ethers.getContractFactory('WETH')
    WETHToken = await WETH.deploy()
    ILM = await ethers.getContractFactory('ILMoney')
    ILMToken = await ILM.deploy()
    Factory1 = await ethers.getContractFactory('Factory1')
    Factory1Instance = await Factory1.deploy(await owner.getAddress())
    Factory2 = await ethers.getContractFactory('Factory2')
    Factory2Instance = await Factory2.deploy(await owner.getAddress())

    const response1: ContractTransaction = await Factory1Instance.createPair(WETHToken.address, ILMToken.address)
    const result1: ContractReceipt = await response1.wait()
    const events1: any = result1.events?.filter(elem => {return elem.event === 'PairCreated'})
    const event1 = events1[0]
    expect(event1).to.be.ok
    expect(await Factory1Instance.allPairsLength()).to.equal(ethers.BigNumber.from('1'))

    const pairAddress1 = event1.args.pair
    expect(pairAddress1).to.be.ok
    
    Pair1 = await ethers.getContractFactory('Pair1')
    Pair1Instance = Pair1.attach(pairAddress1)

    const response2: ContractTransaction = await Factory2Instance.createPair(WETHToken.address, ILMToken.address)
    const result2: ContractReceipt = await response2.wait()
    const events2: any = result2.events?.filter(elem => {return elem.event === 'PairCreated'})
    const event2 = events2[0]
    expect(event2).to.be.ok
    expect(await Factory2Instance.allPairsLength()).to.equal(ethers.BigNumber.from('1'))

    const pairAddress2 = event2.args.pair
    expect(pairAddress2).to.be.ok
    
    Pair2Instance = Pair1.attach(pairAddress2)

    Router1 = await ethers.getContractFactory('Router1')
    Router1Instance = await Router1.deploy(Factory1Instance.address, WETHToken.address)

    Router2 = await ethers.getContractFactory('Router2')
    Router2Instance = await Router2.deploy(Factory2Instance.address, WETHToken.address)
}



before(async () => {
    await deployInfrastructure()
})

describe('Arbitrage Contract', () => {
    it('Should deploy', async () => {
        const Arbitrage: ContractFactory = await ethers.getContractFactory('Arbitrage')
        const ArbitrageInstance: Contract = await Arbitrage.deploy(Factory1Instance.address, Router1Instance.address)
        expect(ArbitrageInstance.address).to.be.ok
    })
})