// We should hard-code trusted base tokens
import { Token, Factory } from './types/types'

const IS_MAINNET: Boolean = process.env.NETWORK === 'MAINNET' ? true : false

// Pancakeswap
const PANCAKE_FACTORY: Factory = {
    name: 'Pancakeswap',
    contract_address: IS_MAINNET ? '0xBCfCcbde45cE874adCB698cC183deBcF17952812' : '0x6725F303b657a9451d8BA641348b6761A6CC7a17',
    router_address: IS_MAINNET ? '0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F' : '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
    fee: 0.002
}

const SASHIMI_FACTORY: Factory = {
    name: 'Sashimiswap',
    contract_address: IS_MAINNET ? '0x1DaeD74ed1dD7C9Dabbe51361ac90A69d851234D' : '0x5240870Cc7A4E28eE7A79cf77d0dF69957B92da2',
    router_address: IS_MAINNET ? '0x24cEFA86fC1826FD31b4cb911034907735F8085A': '0xb3598412392a422970D02Bd68B2Cd8eAeb41fCf3',
    fee: 0.003
}

// Remember to assert that this data matches that found in our database
const WBNB: Token = {
    decimals: 18,
    name: 'Wrapped BNB',
    symbol: 'WBNB',
    contract_address: IS_MAINNET ? '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' : '0xae13d989dac2f0debff460ac112a837c89baa7cd'
}

const BUSD: Token = {
    decimals: 18,
    name: 'BUSD Token',
    symbol: 'BUSD',
    contract_address: IS_MAINNET ? '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56' : '0x8301f2213c0eed49a7e28ae4c3e91722919b8b47'
}

const ETH: Token = {
    decimals: 18,
    name: 'Ethereum Token',
    symbol: 'ETH',
    contract_address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8'
}

const USDT: Token = {
    decimals: 18,
    name: 'Tether USD',
    symbol: 'USDT',
    contract_address: '0x55d398326f99059fF775485246999027B3197955'
}

let exportTokens: Record<string, Token> = {
    WBNB,
    BUSD
}

if (IS_MAINNET) {
    exportTokens.ETH = ETH
    exportTokens.USDT = USDT
}

let exportFactories: Record<string, Factory> = {
    PANCAKE_FACTORY,
    SASHIMI_FACTORY
}

export const BaseTokens = exportTokens
export const BaseFactories = exportFactories
