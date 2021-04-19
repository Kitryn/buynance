import { BigNumber, ethers } from 'ethers'
import { ContractAccount } from './ContractAccount'
import { ABI } from '../types'


export class FactoryAccount extends ContractAccount {
    constructor(address: string, provider: ethers.providers.JsonRpcProvider) {
        const abi: any = ABI.factory
        super(address, provider, abi)
    }

    async getTotalPairCount(): Promise<number> {
        const result = await this.contract.allPairsLength()
        return result.toNumber()
    }

    async getPairFromIndex(index: number): Promise<string> {
        const result = await this.contract.allPairs(index)
        return result
    }
}