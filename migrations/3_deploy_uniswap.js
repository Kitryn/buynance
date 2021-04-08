const fs = require('fs')
const path = require('path')
const UniswapV2FactoryJson = require('@uniswap/v2-core/build/UniswapV2Factory.json')
UniswapV2FactoryJson['contractName'] = 'UniswapV2Factory'
fs.writeFileSync(path.resolve('..', 'build', 'contracts', 'UniswapV2Factory.json'), JSON.stringify(UniswapV2FactoryJson))

const UniswapV2Factory = artifacts.require('UniswapV2Factory')

module.exports = function(deployer, network, accounts) {
    deployer.deploy(UniswapV2Factory, accounts[0])
}