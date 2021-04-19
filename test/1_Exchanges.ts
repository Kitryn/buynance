import { ethers } from 'hardhat'
import { BigNumber, Contract, ContractFactory, ContractReceipt, ContractTransaction, Signer } from 'ethers'
import { expect } from 'chai'
import { Token, Fetcher, Pair, TokenAmount, BigintIsh, Route, Price, Trade, TradeType } from '@uniswap/sdk'

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


before(async () => {
    accounts = await ethers.getSigners()
    owner = accounts[0]
    chainId = await owner.getChainId()
})


describe('Test Infrastructure', () => {
    describe('WETH', () => {
        before(async () => {
            WETH = await ethers.getContractFactory('WETH')
            WETHToken = await WETH.deploy()
        })
    
        it('Deployment should mint and assign total supply of tokens to the owner', async function () {
            const ownerBalance = await WETHToken.balanceOf(await owner.getAddress())
            expect(await WETHToken.totalSupply()).to.equal(ownerBalance)
        })
    
        it('Should transfer 5000 tokens between accounts', async function () {
            await WETHToken.transfer(await accounts[1].getAddress(), ethers.utils.parseEther('5000'))
            
            // 5000 WETH should be in accounts 1
            const balance1 = await WETHToken.balanceOf(await accounts[1].getAddress())
            expect(balance1).to.equal(ethers.utils.parseEther('5000'))
        })
    })
    
    describe('ILM', () => {
        before(async () => {
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
            
            // 5000 WETH should be in accounts 1
            const balance1 = await ILMToken.balanceOf(await accounts[1].getAddress())
            expect(balance1).to.equal(ethers.utils.parseEther('5000'))
        })
    })
    
    // ------------------
    
    describe('Factory1', () => {
        before(async () => {
            Factory1 = await ethers.getContractFactory('Factory1')
            Factory1Instance = await Factory1.deploy(await owner.getAddress())
        })
    
        it('Should deploy and set feeToSetter to owner', async () => {
            expect(await Factory1Instance.feeToSetter()).to.equal(await owner.getAddress())
        })
    
        it('Should not have set a feeTo', async () => {
            expect(await Factory1Instance.feeTo()).to.equal(ethers.constants.AddressZero)
        })
    })
    
    describe('Factory2', () => {
        before(async () => {
            Factory2 = await ethers.getContractFactory('Factory2')
            Factory2Instance = await Factory2.deploy(await owner.getAddress())
        })
    
        it('Should deploy and set feeToSetter to owner', async () => {
            expect(await Factory2Instance.feeToSetter()).to.equal(await owner.getAddress())
        })
    
        it('Should not have set a feeTo', async () => {
            expect(await Factory2Instance.feeTo()).to.equal(ethers.constants.AddressZero)
        })
    })
    
    describe('Pairs1', () => {
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
            [token0, token1] = addressSortOrder(WETHToken.address, ILMToken.address)
            
            expect(await Pair1Instance.token0()).to.equal(token0)
            expect(await Pair1Instance.token1()).to.equal(token1)
            expect(await Pair1Instance.factory()).to.equal(Factory1Instance.address)
        })
    })
    
    describe('Pairs2', () => {
        it('Should create Pair', async () => {
            const response: ContractTransaction = await Factory2Instance.createPair(WETHToken.address, ILMToken.address)
            const result: ContractReceipt = await response.wait()
            const events: any = result.events?.filter(elem => {return elem.event === 'PairCreated'})
            const event = events[0]
            expect(event).to.be.ok
            expect(await Factory2Instance.allPairsLength()).to.equal(ethers.BigNumber.from('1'))
    
            const pairAddress = event.args.pair
            expect(pairAddress).to.be.ok
            
            Pair2Instance = Pair1.attach(pairAddress)
        })
    
        it('Should have factory address set and WETH and ILMToken set as tokens', async () => {
            let token0, token1
            [token0, token1] = addressSortOrder(WETHToken.address, ILMToken.address)
    
            expect(await Pair2Instance.token0()).to.equal(token0)
            expect(await Pair2Instance.token1()).to.equal(token1)
            expect(await Pair2Instance.factory()).to.equal(Factory2Instance.address)
        })
    })
    
    describe('Router2', () => {
        before(async () => {
            Router2 = await ethers.getContractFactory('Router2')
            Router2Instance = await Router2.deploy(Factory2Instance.address, WETHToken.address)
        })
    
        it('Should register factory and weth address', async () => {
            expect(await Router2Instance.factory()).to.equal(Factory2Instance.address)
            expect(await Router2Instance.WETH()).to.equal(WETHToken.address)
        })
    })
    
    describe('Router1', () => {
        before(async () => {
            Router1 = await ethers.getContractFactory('Router1')
            Router1Instance = await Router1.deploy(Factory1Instance.address, WETHToken.address)
        })
        
        it('Should register factory and weth address', async () => {
            expect(await Router1Instance.factory()).to.equal(Factory1Instance.address)
            expect(await Router1Instance.WETH()).to.equal(WETHToken.address)
        })
    
        it('Should approve Router to spend Owner\'s WETH', async () => {
            const response: ContractTransaction = await WETHToken.approve(Router1Instance.address, ethers.BigNumber.from(2).pow(256).sub(1))
            const result: ContractReceipt = await response.wait()
            const events: any = result.events?.filter(elem => {return elem.event === 'Approval'})
            const event = events[0]
            expect(event).to.be.ok
            expect(await WETHToken.allowance(await owner.getAddress(), Router1Instance.address)).to.equal(ethers.BigNumber.from(2).pow(256).sub(1))
        })
    
        it('Should approve Router to spend Owner\'s ILMToken', async () => {
            const response: ContractTransaction = await ILMToken.approve(Router1Instance.address, ethers.BigNumber.from(2).pow(256).sub(1))
            const result: ContractReceipt = await response.wait()
            const events: any = result.events?.filter(elem => {return elem.event === 'Approval'})
            const event = events[0]
            expect(event).to.be.ok
            expect(await ILMToken.allowance(await owner.getAddress(), Router1Instance.address)).to.equal(ethers.BigNumber.from(2).pow(256).sub(1))
        })
    
        it('Should add liquidity 1:1 100,000 ETH + 100,000 ILM', async () => {
            expect(await Router1Instance.factory()).to.equal(Factory1Instance.address)
            
            const response: ContractTransaction = await Router1Instance.addLiquidity(
                WETHToken.address, 
                ILMToken.address,
                ethers.utils.parseEther('100000'),
                ethers.utils.parseEther('100000'),
                ethers.utils.parseEther('100000'),
                ethers.utils.parseEther('100000'),
                await owner.getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000)))
            const result: ContractReceipt = await response.wait()
            expect(result).to.be.ok
    
            // check liquidity tokens
            const bal = await Pair1Instance.balanceOf(await owner.getAddress())
            expect(bal).to.equal(ethers.utils.parseEther('100000').sub(ethers.BigNumber.from('1000')))  // receive liquidity tokens minus min liquidity
        })
    
        // it('Should predict execution price', async () => {
        //     const sdkWETH: Token = await Fetcher.fetchTokenData(chainId, WETHToken.address, ethers.provider, 'WETH', 'Wrapped Ether')
        //     const sdkILM: Token = await Fetcher.fetchTokenData(chainId, ILMToken.address, ethers.provider, 'ILM', 'ILMoney')
            
        //     // Fetcher.fetchPairData doesn't work because of the constant it uses to calculate the pair address
        //     const reserves = await Pair1Instance.getReserves()
        //     const reserve0: BigintIsh & BigNumber = reserves._reserve0
        //     const reserve1: BigintIsh & BigNumber = reserves._reserve1
        //     expect(reserve0).to.not.equal(ethers.BigNumber.from(0))
        //     expect(reserve1).to.not.equal(ethers.BigNumber.from(0))
    
        //     const tokens: Token[] = [sdkWETH, sdkILM]
        //     const [token0, token1] = tokens[0].sortsBefore(tokens[1]) ? tokens : [tokens[1], tokens[0]]
    
        //     const sdkPair = new Pair(new TokenAmount(token0, reserve0), new TokenAmount(token1, reserve1))
            
        //     const sdkRoute = new Route([sdkPair], sdkWETH)
        //     const trade = new Trade(sdkRoute, new TokenAmount(sdkWETH, ethers.utils.parseEther('10').toString()), TradeType.EXACT_INPUT)
        //     // console.log(trade.executionPrice.quote(new TokenAmount(sdkWETH, ethers.utils.parseEther('1').toString())).toSignificant(6))
        //     console.log(trade.executionPrice.toSignificant(18))
        //     console.log(executionPrice(ethers.utils.parseEther('10'), reserve0,  reserve1, 0.003).toString())
        //     // console.log(executionPrice(ethers.utils.parseEther('10'), reserve0, reserve1, 0.003).toString())
    
        //     // const temp = getAmountOut(ethers.utils.parseEther('1'), reserve0, reserve1, 0.003)
        //     // console.log(ethers.utils.formatEther(temp))
        
        // })
    
        it('Should swap 1 WETH for 1 ILM from owner into accounts[2]', async () => {
            const path: string[] = [WETHToken.address, ILMToken.address]
            const response: ContractTransaction = await Router1Instance.swapExactTokensForTokens(
                ethers.utils.parseEther('1'),
                ethers.utils.parseEther('0.3'),
                path,
                await accounts[2].getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000))
            )
            const result: ContractReceipt = await response.wait()
            expect(result).to.be.ok
    
            // Expect there to be a balance in accounts[2]
            const bal: BigNumber = await ILMToken.balanceOf(await accounts[2].getAddress())
            // console.log(ethers.utils.formatEther(bal))
            expect(bal).to.not.equal(ethers.BigNumber.from('0'))
        })
    })
})
