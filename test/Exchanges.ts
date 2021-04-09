import { ethers } from 'hardhat'
import { Contract, ContractFactory, ContractReceipt, ContractTransaction, Signer } from 'ethers'
import { expect } from 'chai'


let accounts: Signer[]
let owner: Signer
let WETH: ContractFactory
let WETHToken: Contract
let ILM: ContractFactory
let ILMToken: Contract
let Factory1: ContractFactory
let Factory1Instance: Contract
let Router1: ContractFactory
let Router1Instance: Contract
let Pair1: ContractFactory
let Pair1Instance: Contract

before(async () => {
    accounts = await ethers.getSigners()
    owner = accounts[0]
})


describe('WETH', () => {
    beforeEach(async () => {
        WETH = await ethers.getContractFactory('WETH')
        WETHToken = await WETH.deploy()
    })

    it('Deployment should mint and assign total supply of tokens to the owner', async function () {
        const ownerBalance = await WETHToken.balanceOf(await owner.getAddress())
        expect(await WETHToken.totalSupply()).to.equal(ownerBalance)
    })

    it('Should transfer 5000 tokens between accounts', async function () {
        await WETHToken.transfer(await accounts[1].getAddress(), ethers.utils.parseEther('5000'))
        
        // 5000 WETH should be in accounts 0 and 1
        const balance0 = await WETHToken.balanceOf(await accounts[0].getAddress())
        expect(balance0).to.equal(ethers.utils.parseEther('5000'))

        const balance1 = await WETHToken.balanceOf(await accounts[1].getAddress())
        expect(balance1).to.equal(ethers.utils.parseEther('5000'))
    })
})

describe('ILM', () => {
    beforeEach(async () => {
        ILM = await ethers.getContractFactory('ILMoney')
        ILMToken = await ILM.deploy()
    })

    it('Should set the right owner', async function () {
        expect(await ILMToken.owner()).to.equal(await owner.getAddress())
    })

    it('Deployment should mint and assign total supply of tokens to the owner', async function () {
        const ownerBalance = await ILMToken.balanceOf(await owner.getAddress())
        expect(await ILMToken.totalSupply()).to.equal(ownerBalance)
    })

    it('Should transfer 5000 tokens between accounts', async function () {
        await ILMToken.transfer(await accounts[1].getAddress(), ethers.utils.parseEther('5000'))
        
        // 5000 WETH should be in accounts 0 and 1
        const balance0 = await ILMToken.balanceOf(await accounts[0].getAddress())
        expect(balance0).to.equal(ethers.utils.parseEther('5000'))

        const balance1 = await ILMToken.balanceOf(await accounts[1].getAddress())
        expect(balance1).to.equal(ethers.utils.parseEther('5000'))
    })
})



describe('Factory', () => {
    beforeEach(async () => {
        Factory1 = await ethers.getContractFactory('Factory1')
        Factory1Instance = await Factory1.deploy(await owner.getAddress())
    })

    it('Should deploy and set feeToSetter to owner', async () => {
        expect(await Factory1Instance.feeToSetter()).to.equal(await owner.getAddress())
    })
})

describe('Pairs', () => {
    it('Should create Pair', async () => {
        const response: ContractTransaction = await Factory1Instance.createPair(WETHToken.address, ILMToken.address)
        const result: ContractReceipt = await response.wait()
        const events: any = result.events?.filter(elem => {return elem.event === 'PairCreated'})
        const event = events[0]
        expect(event).to.be.ok
        expect(await Factory1Instance.allPairsLength()).to.equal(ethers.BigNumber.from('1'))

        const pairAddress = event.args.pair
        expect(pairAddress).to.be.ok
        
        Pair1 = await ethers.getContractFactory('Pair1')
        Pair1Instance = Pair1.attach(pairAddress)
    })

    it('Should have factory address set and WETH and ILMToken set as tokens', async () => {
        let token0, token1
        [token0, token1] = WETHToken.address < ILMToken.address ? [WETHToken.address, ILMToken.address] : [ILMToken.address, WETHToken.address];
        
        expect(await Pair1Instance.token0()).to.equal(token0)
        expect(await Pair1Instance.token1()).to.equal(token1)
        expect(await Pair1Instance.factory()).to.equal(Factory1Instance.address)
    })
})

describe('Router', () => {
    beforeEach(async () => {
        Router1 = await ethers.getContractFactory('Router1')
        Router1Instance = await Router1.deploy(Factory1Instance.address, WETHToken.address)
    })
    
    it('Should register factory and weth address', async () => {
        expect(await Router1Instance.factory()).to.equal(Factory1Instance.address)
        expect(await Router1Instance.WETH()).to.equal(WETHToken.address)
    })
})