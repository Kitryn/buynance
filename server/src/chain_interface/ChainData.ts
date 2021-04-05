import { ethers } from 'ethers'
import { FactoryAccount } from './FactoryAccount'

import { PairsModel } from '../models/PairsModel'
import { Factory, Pair, Token } from '../types'
import { PairAccount } from './PairAccount'
import { TokenAccount } from './TokenAccount'
import { SqliteError } from 'better-sqlite3'
const dbConn = require('../models/DbConfig')()

export class ChainData {
    _factories: Map<string, FactoryAccount>
    private provider: ethers.providers.JsonRpcProvider;
    db: PairsModel

    constructor(rpcUrl: string) {
        this.provider = new ethers.providers.JsonRpcProvider(rpcUrl)
        this._factories = new Map<string, FactoryAccount>()
        this.db = new PairsModel(dbConn)
    }

    get factories(): string[] {
        return Array.from(this._factories.keys())
    }

    loadAllFactories(): Factory[] {
        const factoryList: Factory[] = this.db.getFactories()
        for (const factoryInfo of factoryList) {
            this.registerNewFactory(factoryInfo.name, factoryInfo.contract_address)
        }
        return factoryList
    }

    registerNewFactory(name: string, address: string) {
        const key = address.toLowerCase()
        this.db.addFactory(name, key)  // ignores if address already exists

        const factory = new FactoryAccount(address, this.provider)
        this._factories.set(key, factory)
    }

    async registerTokenIfNotExist(address: string) {
        const res = this.db.getTokenFromAddress(address)
        if (res != null) return
        
        const tokenAccount = new TokenAccount(address, this.provider)
        const tokenInfo: Token = await tokenAccount.get()
        this.db.addToken(tokenInfo)
    }

    async registerPairFromFactoryIndex(factoryAddress: string, pairIndex: number) {
        const factoryKey = factoryAddress.toLowerCase()
        const factory = this._factories.get(factoryKey)
        if (factory == null) throw new Error('Factory not found! Register first!')

        const pairAddress: string = await factory.getPairFromIndex(pairIndex)
        const pairAccount = new PairAccount(pairAddress, this.provider)
        const pairInfo: Pair = await pairAccount.get()

        await this.registerTokenIfNotExist(pairInfo.token0_address)
        await this.registerTokenIfNotExist(pairInfo.token1_address)

        pairInfo.pair_index = pairIndex

        try {
            this.db.addPair(pairInfo)
        } catch (err) {
            if (err instanceof SqliteError) {
                if (err.message.split(' ')[0] === 'UNIQUE') {
                    console.log('Duplicate address exists, ignoring')
                    return
                }
            }
            throw err          
        }
    }
}