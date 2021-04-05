import { ethers } from 'ethers';
import { FactoryAccount } from './FactoryAccount';


export class ChainData {
    _factories: Map<string, FactoryAccount>
    private provider: ethers.providers.JsonRpcProvider;

    constructor(rpcUrl: string) {
        this.provider = new ethers.providers.JsonRpcProvider(rpcUrl)
        this._factories = new Map<string, FactoryAccount>()
    }

    get factories(): string[] {
        return Array.from(this._factories.keys())
    }

    registerFactory(address: string) {
        const factory = new FactoryAccount(address, this.provider)
        const key = address.toLowerCase()
        this._factories.set(key, factory)
    }
}