import { ethers } from 'hardhat'
import { Contract, ContractFactory, ContractReceipt, ContractTransaction, Signer } from 'ethers'

export const mochaHooks = {
    beforeAll: [
        async function () {
            global.accounts = await ethers.getSigners()
            global.owner = global.accounts[0]
        }
    ]
}