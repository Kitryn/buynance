import { ethers } from 'hardhat'
import { BigNumber, Contract, ContractFactory, ContractReceipt, ContractTransaction, Signer } from 'ethers'
import { expect } from 'chai'
import { addressSortOrder, findMaxBuy, StartPoint, tradeDirection, TradeDetails } from '../src/utils/utils'
import BigNumberJS from 'bignumber.js'

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
    describe('Set up', async () => {
        let Arbitrage: ContractFactory
        let ArbitrageInstance: Contract

        beforeEach(async () => {
            Arbitrage = await ethers.getContractFactory('Arbitrage')
            ArbitrageInstance = await Arbitrage.deploy(Factory1Instance.address, Factory2Instance.address, Router1Instance.address, Router2Instance.address)
        })
        
        it('Should deploy', async () => {
            expect(ArbitrageInstance.address).to.be.ok
        })

        it('Should set owner', async () => {
            expect(await ArbitrageInstance.owner()).to.equal(await owner.getAddress())
        })

        it('Should receive funds', async () => {
            const tx = {
                to: ArbitrageInstance.address,
                value: ethers.utils.parseEther('1')
            }
            await owner.sendTransaction(tx)
            expect(await ethers.provider.getBalance(ArbitrageInstance.address)).to.equal(ethers.utils.parseEther('1'))
        })

        it('Should not have funds', async () => {
            expect(await ethers.provider.getBalance(ArbitrageInstance.address)).to.equal(ethers.utils.parseEther('0'))
        })

        it('Should receive and withdraw', async () => {
            const tx = {
                to: ArbitrageInstance.address,
                value: ethers.utils.parseEther('1')
            }
            await owner.sendTransaction(tx)
            const beforeReceiveBal = parseFloat(ethers.utils.formatEther(await owner.getBalance()))
            
            await ArbitrageInstance.withdrawAll()
            expect(await ethers.provider.getBalance(ArbitrageInstance.address)).to.equal(ethers.utils.parseEther('0'))
            
            const afterReceiveBal = parseFloat(ethers.utils.formatEther(await owner.getBalance()))

            expect((afterReceiveBal - beforeReceiveBal) > 0.99).to.be.true
        })

        it('Should not allow 0 token withdrawal', async () => {
            expect(await WETHToken.balanceOf(ArbitrageInstance.address)).to.equal(ethers.utils.parseEther('0'))
            try {
                await ArbitrageInstance.withdrawAllToken(WETHToken.address)
            } catch(err) {
                expect(err.message).to.include('INSUFFICIENT TOKEN BALANCE')
            }
        })

        it('Should only allow owner to call onlyOwner functions', async () => {
            try {
                await ArbitrageInstance.connect(accounts[1]).withdrawAll()
            } catch(err) {
                expect(err.message).to.include('caller is not the owner')
            }
        })

        it('Should receive and withdraw ERC20', async () => {
            const originalBalance = await WETHToken.balanceOf(await owner.getAddress())
            await WETHToken.transfer(ArbitrageInstance.address, ethers.utils.parseEther('10'))
            expect(await WETHToken.balanceOf(ArbitrageInstance.address)).to.equal(ethers.utils.parseEther('10'))
            expect(await WETHToken.balanceOf(await owner.getAddress())).to.not.equal(originalBalance)

            await ArbitrageInstance.withdrawAllToken(WETHToken.address)

            expect(await WETHToken.balanceOf(ArbitrageInstance.address)).to.equal(ethers.utils.parseEther('0'))
            expect(await WETHToken.balanceOf(await owner.getAddress())).to.equal(originalBalance)
        })
    })

    describe('Arbitrage', async () => {
        let Arbitrage: ContractFactory
        let ArbitrageInstance: Contract

        beforeEach(async () => {
            await deployInfrastructure()
            await ILMToken.approve(Router1Instance.address, ethers.BigNumber.from(2).pow(256).sub(1))
            await WETHToken.approve(Router1Instance.address, ethers.BigNumber.from(2).pow(256).sub(1))
            await ILMToken.approve(Router2Instance.address, ethers.BigNumber.from(2).pow(256).sub(1))
            await WETHToken.approve(Router2Instance.address, ethers.BigNumber.from(2).pow(256).sub(1))
            Arbitrage = await ethers.getContractFactory('Arbitrage')
            ArbitrageInstance = await Arbitrage.deploy(Factory1Instance.address, Factory2Instance.address, Router1Instance.address,  Router2Instance.address)
        })

        it('Should throw if pair does not exist', async () => {
            try {
                await ArbitrageInstance.startArbitrage(
                    WETHToken.address,
                    ethers.constants.AddressZero,
                    ethers.utils.parseEther('0.5'),
                    true
                )
            } catch (err) {
                expect(err.message).to.include('PAIR DOES NOT EXIST')
            }
        })

        async function doArbitrage() {
            const reservesF1 = await Pair1Instance.getReserves()
            let F1WethReserves, F1IlmReserves
            [F1WethReserves, F1IlmReserves] = WETHToken.address.toLowerCase() < ILMToken.address.toLowerCase() ? [reservesF1._reserve0, reservesF1._reserve1] : [reservesF1._reserve1, reservesF1._reserve0]
            console.log(`Exchange 1: WETH: ${ethers.utils.formatEther(F1WethReserves)} | ILM: ${ethers.utils.formatEther(F1IlmReserves)}`)

            const reservesF2 = await Pair2Instance.getReserves()
            let F2WethReserves, F2IlmReserves
            [F2WethReserves, F2IlmReserves] = WETHToken.address.toLowerCase() < ILMToken.address.toLowerCase() ? [reservesF2._reserve0, reservesF2._reserve1] : [reservesF2._reserve1, reservesF2._reserve0]            
            console.log(`Exchange 2: WETH: ${ethers.utils.formatEther(F2WethReserves)} | ILM: ${ethers.utils.formatEther(F2IlmReserves)}`)
            
            const WETHBal_before: BigNumber = await WETHToken.balanceOf(ArbitrageInstance.address)
            const ILMBal_before: BigNumber = await ILMToken.balanceOf(ArbitrageInstance.address)
            console.log(`Initial bal: WETH: ${ethers.utils.formatEther(WETHBal_before)} || ILM: ${ethers.utils.formatEther(ILMBal_before)}`)

            let tradeDetails: TradeDetails = findMaxBuy(
                F1WethReserves,
                F1IlmReserves,
                F2WethReserves,
                F2IlmReserves,
                true
            )
            // if (tradeDetails.START_POINT !== StartPoint.BASE && tradeDetails.START_POINT !== StartPoint.ALT) {
            //     throw new Error('Invalid reserve state!')
            // }
            let flashloanBASE: boolean = tradeDetails.START_POINT === StartPoint.BASE ? true : false

            console.log(`TradeDetails: Start ${tradeDetails.START_POINT}, Loan ${ethers.utils.formatEther(tradeDetails.initialLoan.quantity)}, Expected ${ethers.utils.formatEther(tradeDetails.expectedProfit.quantity)}`)

            const gasEstimate = await ArbitrageInstance.estimateGas.startArbitrage(
                WETHToken.address,
                ILMToken.address,
                tradeDetails.initialLoan.quantity,
                flashloanBASE
            )
            console.log(`Estimate gas used: ${gasEstimate}`)

            await ArbitrageInstance.startArbitrage(
                WETHToken.address,
                ILMToken.address,
                tradeDetails.initialLoan.quantity,
                flashloanBASE
            )
            
            const WETHBal_after: BigNumber = await WETHToken.balanceOf(ArbitrageInstance.address)
            const ILMBal_after: BigNumber = await ILMToken.balanceOf(ArbitrageInstance.address)

            console.log(`Final bal: WETH: ${ethers.utils.formatEther(WETHBal_after)} || ILM: ${ethers.utils.formatEther(ILMBal_after)}`)

            const reservesF1_after = await Pair1Instance.getReserves()
            let F1WethReserves_after, F1IlmReserves_after
            [F1WethReserves_after, F1IlmReserves_after] = WETHToken.address.toLowerCase() < ILMToken.address.toLowerCase() ? [reservesF1_after._reserve0, reservesF1_after._reserve1] : [reservesF1_after._reserve1, reservesF1_after._reserve0]
            console.log(`Exchange 1: WETH: ${ethers.utils.formatEther(F1WethReserves_after)} | ILM: ${ethers.utils.formatEther(F1IlmReserves_after)}`)

            const reservesF2_after = await Pair2Instance.getReserves()
            let F2WethReserves_after, F2IlmReserves_after
            [F2WethReserves_after, F2IlmReserves_after] = WETHToken.address.toLowerCase() < ILMToken.address.toLowerCase() ? [reservesF2_after._reserve0, reservesF2_after._reserve1] : [reservesF2_after._reserve1, reservesF2_after._reserve0]            
            console.log(`Exchange 2: WETH: ${ethers.utils.formatEther(F2WethReserves_after)} | ILM: ${ethers.utils.formatEther(F2IlmReserves_after)}`)
            
            const ratio1: BigNumberJS = (new BigNumberJS(F1IlmReserves_after.toString())).div(new BigNumberJS(F1WethReserves_after.toString()))
            const ratio2: BigNumberJS = (new BigNumberJS(F2IlmReserves_after.toString())).div(new BigNumberJS(F2WethReserves_after.toString()))

            console.log(`Ratio1: ${ratio1.toFixed()}, Ratio2: ${ratio2.toFixed()}`)
            expect(WETHBal_after.gte(WETHBal_before)).to.be.true
            expect(ILMBal_after.gte(ILMBal_before)).to.be.true
        }

        it('Should arbitrage Test Case #1', async () => {
            await Router1Instance.addLiquidity(
                WETHToken.address, 
                ILMToken.address,
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                await owner.getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000))
            )
            
            await Router2Instance.addLiquidity(
                WETHToken.address, 
                ILMToken.address,
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('950'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('950'),
                await owner.getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000))
            )
            // TODO -- the above code doesn't check if approval on Arbitrage.sol works because it pre-approves

            await doArbitrage()
        })

        it('Should arbitrage Test Case #2', async () => {
            await Router1Instance.addLiquidity(
                WETHToken.address, 
                ILMToken.address,
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                await owner.getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000))
            )
            
            await Router2Instance.addLiquidity(
                WETHToken.address, 
                ILMToken.address,
                ethers.utils.parseEther('950'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('950'),
                ethers.utils.parseEther('1000'),
                await owner.getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000))
            )
            // TODO -- the above code doesn't check if approval on Arbitrage.sol works because it pre-approves

            await doArbitrage()
        })

        it('Should arbitrage Test Case #3', async () => {
            await Router1Instance.addLiquidity(
                WETHToken.address, 
                ILMToken.address,
                ethers.utils.parseEther('950'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('950'),
                ethers.utils.parseEther('1000'),
                await owner.getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000))
            )
            
            await Router2Instance.addLiquidity(
                WETHToken.address, 
                ILMToken.address,
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                await owner.getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000))
            )
            // TODO -- the above code doesn't check if approval on Arbitrage.sol works because it pre-approves

            await doArbitrage()
        })

        it('Should arbitrage Test Case #4', async () => {
            await Router1Instance.addLiquidity(
                WETHToken.address, 
                ILMToken.address,
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('950'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('950'),
                await owner.getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000))
            )
            
            await Router2Instance.addLiquidity(
                WETHToken.address, 
                ILMToken.address,
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                await owner.getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000))
            )
            // TODO -- the above code doesn't check if approval on Arbitrage.sol works because it pre-approves

            await doArbitrage()
        })

        it('Should arbitrage Test Case #5', async () => {
            await Router1Instance.addLiquidity(
                WETHToken.address, 
                ILMToken.address,
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1'),
                await owner.getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000))
            )
            
            await Router2Instance.addLiquidity(
                WETHToken.address, 
                ILMToken.address,
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                await owner.getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000))
            )
            // TODO -- the above code doesn't check if approval on Arbitrage.sol works because it pre-approves
            try {
                await doArbitrage()
            } catch (err) {
                expect(err.message).to.include('revert UniswapV2: INSUFFICIENT_OUTPUT_AMOUNT')
            }
        })

        it('Should arbitrage Test Case #6', async () => {
            await Router1Instance.addLiquidity(
                WETHToken.address, 
                ILMToken.address,
                ethers.utils.parseEther('1'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1'),
                ethers.utils.parseEther('1000'),
                await owner.getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000))
            )
            
            await Router2Instance.addLiquidity(
                WETHToken.address, 
                ILMToken.address,
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                await owner.getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000))
            )
            // TODO -- the above code doesn't check if approval on Arbitrage.sol works because it pre-approves
            try {
                await doArbitrage()
            } catch (err) {
                expect(err.message).to.include('revert UniswapV2: INSUFFICIENT_OUTPUT_AMOUNT')
            }
        })

        it('Should arbitrage Test Case #7', async () => {
            await Router1Instance.addLiquidity(
                WETHToken.address, 
                ILMToken.address,
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                await owner.getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000))
            )
            
            await Router2Instance.addLiquidity(
                WETHToken.address, 
                ILMToken.address,
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1'),
                await owner.getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000))
            )
            // TODO -- the above code doesn't check if approval on Arbitrage.sol works because it pre-approves
            try {
                await doArbitrage()
            } catch (err) {
                expect(err.message).to.include('revert UniswapV2: INSUFFICIENT_OUTPUT_AMOUNT')
            }
        })

        it('Should arbitrage Test Case #8', async () => {
            await Router1Instance.addLiquidity(
                WETHToken.address, 
                ILMToken.address,
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                await owner.getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000))
            )
            
            await Router2Instance.addLiquidity(
                WETHToken.address, 
                ILMToken.address,
                ethers.utils.parseEther('1'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1'),
                ethers.utils.parseEther('1000'),
                await owner.getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000))
            )
            // TODO -- the above code doesn't check if approval on Arbitrage.sol works because it pre-approves
            try {
                await doArbitrage()
            } catch (err) {
                expect(err.message).to.include('revert UniswapV2: INSUFFICIENT_OUTPUT_AMOUNT')
            }
        })

        it('Should NOT arbitrage Test Case #1', async () => {
            await Router1Instance.addLiquidity(
                WETHToken.address, 
                ILMToken.address,
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                await owner.getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000))
            )
            
            await Router2Instance.addLiquidity(
                WETHToken.address, 
                ILMToken.address,
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                ethers.utils.parseEther('1000'),
                await owner.getAddress(),
                ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 10000))
            )
            // TODO -- the above code doesn't check if approval on Arbitrage.sol works because it pre-approves
            try {
                await doArbitrage()
            } catch (err) {
                expect(err.message).to.include('revert UniswapV2: INSUFFICIENT_OUTPUT_AMOUNT')
            }
        })

        
    })
})