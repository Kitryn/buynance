import { BigNumber, ethers } from 'ethers'
import { ContractAccount } from './ContractAccount'
import { ABI } from '../types'


export class FactoryAccount extends ContractAccount {
    constructor(address: string, provider: ethers.providers.JsonRpcProvider) {
        const abi: any = ABI.factory
        super(address, provider, abi)
    }

    async getTotalPairCount(): Promise<BigNumber> {
        const result = await this.contract.allPairsLength()
        return result
    }

    async getPairFromIndex(index: number) {

    }
}