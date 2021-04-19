export enum ContractType {
    factory = 'factory',
    pair = 'pair',
    router = 'router'
}

export enum ABI {
    factory = require('./ABI/factory.json'),
    pair = require('./ABI/pair.json'),
    bep20 = require('./ABI/bep20.json')
}

export interface Pair {
    token0_symbol?: string
    token1_symbol?: string
    token0_address: string
    token1_address: string
    decimals: number
    contract_address: string
    factory_address: string
    pair_index?: number | null
}

export interface Token {
    decimals: number,
    name: string,
    symbol: string,
    contract_address: string
}

export interface Factory {
    name: string,
    contract_address: string,
    router_address: string,
    fee: number
}