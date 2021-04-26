import { BigNumber, ethers } from 'ethers'
import { ContractAccount } from './ContractAccount'
import { ABI, Token } from '../types/types'

interface token_ContractResponse {
    type: 'decimals' | 'name' | 'symbol'
    result: any
}

export class TokenAccount extends ContractAccount {
    constructor(address: string, provider: ethers.providers.JsonRpcProvider) {
        const abi: any = ABI.bep20
        super(address, provider, abi)
    }
    
    private async _getDecimals(): Promise<token_ContractResponse> {
        const result = await this.contract.decimals()
        return {type: 'decimals', result}
    }
    
    private async _getName(): Promise<token_ContractResponse> {
        const result = await this.contract.name()
        return {type: 'name', result}   
    }

    private async _getSymbol(): Promise<token_ContractResponse> {
        const result = await this.contract.symbol()
        return {type: 'symbol', result}   
    }

    async get() {
        const work: Promise<token_ContractResponse>[] = []
        work.push(this._getDecimals())
        work.push(this._getName())
        work.push(this._getSymbol())

        const result: token_ContractResponse[] = await Promise.all(work)  // if one fails all fails -- TODO -- harden this

        let decimals
        let name
        let symbol

        for (const res of result) {
            switch(res.type) {
                case 'decimals':
                    decimals = res.result
                    break
                case 'name':
                    name = res.result
                    break
                case 'symbol':
                    symbol = res.result    
                    break
                default:
                    throw new Error('Invalid result when fetching token info!')
            }
        }

        const token: Token = {
            decimals,
            name,
            symbol,
            contract_address: this.address
        }

        return token
    }
}
