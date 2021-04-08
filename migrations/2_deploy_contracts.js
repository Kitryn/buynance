const WETH = artifacts.require('WETH')
const ILMoney = artifacts.require('ILMoney')

module.exports = function(deployer) {
  deployer.deploy(WETH)
  deployer.deploy(ILMoney)
  // deployer.link(ConvertLib, MetaCoin)
  // deployer.deploy(MetaCoin)
}
