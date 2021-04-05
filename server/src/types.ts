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

export enum RpcUrl {
    MAINNET = 'https://bsc-dataseed.binance.org/',
    TESTNET = 'https://data-seed-prebsc-2-s1.binance.org:8545/'
}

export interface Pair {
    token0_symbol?: string
    token1_symbol?: string
    token0_address: string
    token1_address: string
    decimals: number
    contract_address: string
    factory_address: string
}

export interface Token {
    decimals: number,
    name: string,
    symbol: string,
    contract_address: string
}