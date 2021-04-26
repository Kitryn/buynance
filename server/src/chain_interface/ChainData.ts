import { ethers, BigNumber } from 'ethers'
import { FactoryAccount } from './FactoryAccount'

import { PairsModel } from '../models/PairsModel'
import { Factory, Pair, Token } from '../types/types'
import { PairAccount } from './PairAccount'
import { TokenAccount } from './TokenAccount'
import { SqliteError } from 'better-sqlite3'
import { BaseTokens, Factories, BaseFactory } from '../addresses'
import { findMaxBuy, TradeDetails, StartPoint } from '@buynance/common/dist/utils'
import assert from 'assert'
const dbConn = require('../models/DbConfig')()

import util from 'util'
const setTimeoutPromise = util.promisify(setTimeout)


function differenceSet(a: Set<any>, b: Set<any>) {
    const difference = new Set([...a].filter(x => !b.has(x)))
    return difference
}

export class ChainData {
    _factories: Map<string, FactoryAccount>
    //private provider: ethers.providers.JsonRpcProvider;
    provider: ethers.providers.WebSocketProvider | ethers.providers.JsonRpcProvider
    is_WSS: boolean = false
    db: PairsModel

    constructor(rpcUrl: string, is_WSS: boolean = false) {
        if (is_WSS) {
            this.provider = new ethers.providers.WebSocketProvider(rpcUrl)
            this.is_WSS = true
        } else {
            this.provider = new ethers.providers.JsonRpcProvider(rpcUrl)
        }
        this._factories = new Map<string, FactoryAccount>()
        this.db = new PairsModel(dbConn)
    }

    get factories(): string[] {
        return Array.from(this._factories.keys())
    }

    loadAllFactories(): Factory[] {
        const factoryList: Factory[] = this.db.getFactories()
        for (const factoryInfo of factoryList) {
            this.registerNewFactory(factoryInfo.name, factoryInfo.contract_address, factoryInfo.router_address, factoryInfo.fee)
        }
        return factoryList
    }

    registerNewFactory(name: string, address: string, router_address: string, fee: number) {
        const key = address.toLowerCase()
        this.db.addFactory(name, key, router_address, fee)  // ignores if address already exists

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

    async getAbsentPairsInFactory(factoryAddress: string) {
        const factoryKey = factoryAddress.toLowerCase()
        const pairsInDb = this.db.getPairIndexAddressList(factoryKey)
        const pairIndexes = new Set(pairsInDb.map(elem => elem.pair_index))
        
        const factory = this._factories.get(factoryKey)
        if (factory == null) throw new Error('Factory not found! Register first!')
        const totalPairs = await factory.getTotalPairCount()
        const indexes = new Set([...Array(totalPairs).keys()])

        const newIndexes = Array.from(differenceSet(indexes, pairIndexes))
        return newIndexes
    }

    async registerPairFromFactoryIndexArray(factoryAddress: string, pairIndexes: number[]) {
        function* makeIterator() {
            for (const id of pairIndexes) {
                yield id
            }
            return
        }

        const concurrency = 5
        const iterator = makeIterator()
        let count = 0
        let countErrors = 0
        const doWork = async () => {
            for (const id of iterator) {
                try {
                    await this.registerPairFromFactoryIndex(factoryAddress, id)
                    count++
                    if (count % 100 === 0) console.log(`${count}/${pairIndexes.length}`)
                } catch (err) {
                    console.error(`Error while fetching pair ID ${id}`)
                    console.error(err)
                    if (err.status === 429) {
                        console.error('Error code 429, rate limited! Back off!')
                        await setTimeoutPromise(1000)
                    } 
                    countErrors++
                    if (countErrors >= 100) {
                        console.error('Over 100 errors, breaking')
                        break
                    }
                }
            }
        }

        const workers = []
        for (let i = 0; i < concurrency; i++) {
            const worker = doWork()
            workers.push(worker)
        }

        await Promise.allSettled(workers)
    }

    async sync(factoryAddress: string) {
        const absentIndexes: number[] = await this.getAbsentPairsInFactory(factoryAddress)
        await this.registerPairFromFactoryIndexArray(factoryAddress, absentIndexes)
    }

    async getPairLiquidity(pair: Pair[]) {
        assert(pair.map(elem => elem.factory_address).includes(BaseFactory.contract_address.toLowerCase()))
        const [_mainPair, _otherPair] = pair[0].factory_address === BaseFactory.contract_address.toLowerCase() ? [pair[0], pair[1]] : [pair[1], pair[0]]

        const mainPairAccount = new PairAccount(_mainPair.contract_address, this.provider)
        const otherPairAccount = new PairAccount(_otherPair.contract_address, this.provider)

        const [mainPairReserve0, mainPairReserve1] = await mainPairAccount.getReserves()
        const [otherPairReserve0, otherPairReserve1] = await otherPairAccount.getReserves()

        const baseTokenAddresses = Object.keys(BaseTokens).map(key => {
            return BaseTokens[key].contract_address.toLowerCase()
        })
        const [r_main_base, r_main_alt, r_other_base, r_other_alt] = baseTokenAddresses.includes(_mainPair.token0_address) ? [mainPairReserve0, mainPairReserve1, otherPairReserve0, otherPairReserve1] : [mainPairReserve1, mainPairReserve0, otherPairReserve1, otherPairReserve0]

        const tradeDetails: TradeDetails = findMaxBuy(
            r_main_base,
            r_main_alt,
            r_other_base,
            r_other_alt,
            true
        )
        return tradeDetails
    }
}