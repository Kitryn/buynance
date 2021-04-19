// We should hard-code trusted base tokens
import { Token, Factory } from './types'

const IS_MAINNET: Boolean = process.env.NETWORK === 'MAINNET' ? true : false

// Quickswap
const QUICKSWAP_FACTORY: Factory = {
    name: 'Quickswap',
    contract_address: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
    router_address: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
    fee: 0.003
}

const COMETHSWAP_FACTORY: Factory = {
    name: 'Comethswap',
    contract_address: '0x800b052609c355cA8103E06F022aA30647eAd60a',
    router_address: '0x7dd75252cc324FD181fC4e79335b7d78A11a8019',
    fee: 0.003
}

// Remember to assert that this data matches that found in our database
const MATIC: Token = {
    decimals: 18,
    name: 'MATIC',
    symbol: 'MATIC',
    contract_address: '0x0000000000000000000000000000000000001010'
}

// PLASMA WETH 0x8cc8538d60901d19692F5ba22684732Bc28F54A3
const POSWETH: Token = {
    decimals: 18,
    name: 'Wrapped Ether',
    symbol: 'WETH',
    contract_address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'
}

const POSUSDC: Token = {
    decimals: 6,
    name: 'USD Coin (PoS)',
    symbol: 'USDC',
    contract_address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
}

const POSUSDT: Token = {
    decimals: 6,
    name: '(PoS) Tether USD',
    symbol: 'USDT',
    contract_address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
}

const POSDAI: Token = {
    decimals: 18,
    name: '(PoS) Dai Stablecoin',
    symbol: 'DAI',
    contract_address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
}

const POSBUSD: Token = {
    decimals: 18,
    name: '(PoS) Binance USD',
    symbol: 'BUSD',
    contract_address: '0xdAb529f40E671A1D4bF91361c21bf9f0C9712ab7'
}

let exportTokens: Record<string, Token> = {
    MATIC,
    POSWETH,
    POSUSDC,
    POSUSDT,
    POSDAI,
    POSBUSD
}

let exportFactories: Record<string, Factory> = {
    QUICKSWAP_FACTORY,
    COMETHSWAP_FACTORY
}

export const BaseTokens = exportTokens
export const BaseFactories = exportFactories
