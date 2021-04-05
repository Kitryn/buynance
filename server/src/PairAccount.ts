import { BigNumber, ethers } from 'ethers'
import { ContractAccount } from './ContractAccount'
import { ABI } from './types'

export class PairAccount extends ContractAccount {
    constructor(address: string, provider: ethers.providers.JsonRpcProvider) {
        const abi: any = ABI.pair
        super(address, provider, abi)
    }

    async getDecimals(): Promise<number> {
        const result = await this.contract.decimals()
        return result
    }
}