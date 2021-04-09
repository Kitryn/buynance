const fs = require('fs')
const path = require('path')

const UniswapV2FactoryJson = require('@uniswap/v2-core/build/UniswapV2Factory.json')
UniswapV2FactoryJson['contractName'] = 'UniswapV2Factory'
fs.writeFileSync(path.resolve('..', 'build', 'contracts', 'UniswapV2Factory.json'), JSON.stringify(UniswapV2FactoryJson))

const UniswapV2Router02Json = require('@uniswap/v2-periphery/build/UniswapV2Router02.json')
UniswapV2Router02Json['contractName'] = 'UniswapV2Router02'
fs.writeFileSync(path.resolve('..', 'build', 'contracts', 'UniswapV2Router02.json'), JSON.stringify(UniswapV2Router02Json))

const UniswapV2PairJson = require('@uniswap/v2-core/build/UniswapV2Pair.json')
UniswapV2PairJson['contractName'] = 'UniswapV2Pair'
fs.writeFileSync(path.resolve('..', 'build', 'contracts', 'UniswapV2Pair.json'), JSON.stringify(UniswapV2PairJson))

const UniswapV2Factory = artifacts.require('UniswapV2Factory')
const UniswapV2Router02 = artifacts.require('UniswapV2Router02')
const UniswapV2Pair = artifacts.require('UniswapV2Pair')
const WETH = artifacts.require('WETH')
const ILMoney = artifacts.require('ILMoney')

UniswapV2Pair.setProvider(this.web3._provider)


module.exports = function(deployer, network, accounts) {
    deployer.deploy(UniswapV2Factory, accounts[0]).then(async () => {
        const factory_instance = await UniswapV2Factory.deployed()
        const WETH_instance = await WETH.deployed()
        const ILMoney_instance = await ILMoney.deployed()

        await deployer.deploy(UniswapV2Router02, factory_instance.address, WETH_instance.address)

        const result = await factory_instance.createPair(WETH_instance.address, ILMoney_instance.address)
        // console.log(result)  // result.logs[0].args.pair
        // console.log(result.logs[0].args)

        const pairAddress = result.logs[0].args.pair
        // Get pair instance in console with let instance = await UniswapV2Pair.at(<address>)
        const weth_ilm_pair_instance = await UniswapV2Pair.at(result.logs[0].args.pair)
        // Possible that these functions should go into test instead of deploy

        const router_instance = await UniswapV2Router02.deployed()

        // const addResult = await router_instance.addLiquidity(
        //     WETH_instance.address,
        //     ILMoney_instance.address,
        //     web3.utils.toWei('1', 'ether'),
        //     web3.utils.toWei('1', 'ether'),
        //     web3.utils.toWei('0.9', 'ether'),
        //     web3.utils.toWei('0.9', 'ether'),
        //     accounts[0],
        //     Date.now() / 1000
        // )  // this should fail as we havent granted approval for the router to spend our tokens
        // console.log(addResult)
    })
}