import { BigNumber, ethers } from 'ethers'


export abstract class ContractAccount {
    address: string
    provider: ethers.providers.JsonRpcProvider
    contract: ethers.Contract

    constructor(address: string, provider: ethers.providers.JsonRpcProvider, abi: ethers.ContractInterface) {
        this.address = address
        this.provider = provider
        this.contract = new ethers.Contract(address, abi, this.provider)
    }
}