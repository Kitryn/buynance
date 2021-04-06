// We should hard-code trusted base tokens
import { Token } from './types'

const IS_MAINNET: Boolean = process.env.NETWORK === 'MAINNET' ? true : false

// Pancakeswap
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

let exported: Record<string, Token> = {
    WBNB,
    BUSD
}

if (IS_MAINNET) {
    exported.ETH = ETH
    exported.USDT = USDT
}

export const BaseTokens = exported