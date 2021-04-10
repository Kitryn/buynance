import { BigNumber, ethers } from 'ethers'
import { getAmountOut } from './src/utils/utils'


const amountIn = BigNumber.from(ethers.utils.parseEther('11.2074'))
const reserves = BigNumber.from(ethers.utils.parseEther('1000'))


console.log(`Buy 11.2074 on exchange 1 to buy on exchange 2`)
const res = getAmountOut(amountIn, reserves, reserves, 0.003)
console.log(`Step 1: ${ethers.utils.formatEther(res)}`)

const reserves2 = BigNumber.from(ethers.utils.parseEther('950'))

const res2 = getAmountOut(res, reserves2, reserves, 0.003)
console.log(`Step 2: ${ethers.utils.formatEther(res2)}`)
console.log(`Profit: ${ethers.utils.formatEther(res2.sub(amountIn).toString())}`)




console.log('----')
console.log('Opposite direction: Buy 11.2074 on exchange 2 to buy on exchange 1')
const res3 = getAmountOut(amountIn, reserves2, reserves, 0.003)
console.log(`Step 1: ${ethers.utils.formatEther(res3)}`)
const res4 = getAmountOut(res3, reserves, reserves, 0.003)
console.log(`Step 2: ${ethers.utils.formatEther(res4)}`)
console.log(`Profit: ${ethers.utils.formatEther(res4.sub(amountIn).toString())}`)