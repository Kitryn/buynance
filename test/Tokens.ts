import { ethers } from 'hardhat'
import { Contract, ContractFactory, Signer } from 'ethers'
import { expect } from 'chai'

describe('WETH', function () {
    let accounts: Signer[]
    let owner: Signer
    let WETH: ContractFactory
    let WETHToken: Contract

    beforeEach(async function () {
        accounts = await ethers.getSigners()
        owner = accounts[0]
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

describe('ILM', function () {
    let accounts: Signer[]
    let owner: Signer
    let ILM: ContractFactory
    let ILMToken: Contract
    
    beforeEach(async function () {
        accounts = await ethers.getSigners()
        owner = accounts[0]
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