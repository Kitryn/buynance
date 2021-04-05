import { BigNumber, ethers } from 'ethers'
import { ContractAccount } from './ContractAccount'
import { ABI, Pair } from './types'

interface ContractResponse {
    type: 'decimals' | 'token0address' | 'token1address'
    result: any
}

export class PairAccount extends ContractAccount {
    constructor(address: string, provider: ethers.providers.JsonRpcProvider) {
        const abi: any = ABI.pair
        super(address, provider, abi)
    }

    private async _getDecimals(): Promise<ContractResponse> {
        const result = await this.contract.decimals()
        return {type: 'decimals', result: result}
    }

    private async _getToken0Address(): Promise<ContractResponse> {
        const result = await this.contract.token0()
        return {type: 'token0address', result: result}
    }

    private async _getToken1Address(): Promise<ContractResponse> {
        const result = await this.contract.token1()
        return {type: 'token1address', result: result}
    }

    async getPair(): Promise<Pair> { 
        const work: Promise<ContractResponse>[] = []
        work.push(this._getDecimals())
        work.push(this._getToken0Address())
        work.push(this._getToken1Address())

        const result: ContractResponse[] = await Promise.all(work)  // if one fails all fails -- TODO -- harden this

        let decimals
        let token0_address
        let token1_address

        for (const res of result) {
            switch(res.type) {
                case 'decimals':
                    decimals = res.result
                    break
                case 'token0address':
                    token0_address = res.result
                    break
                case 'token1address':
                    token1_address = res.result    
                    break
                default:
                    throw new Error('Invalid result when fetching pairs!')
            }
        }

        const pair: Pair = {
            token0_address,
            token1_address,
            decimals,
            contract_address: this.address
        }

        return pair
    }
}