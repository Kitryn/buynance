const WETH = artifacts.require("WETH");

module.exports = function(deployer) {
  deployer.deploy(WETH);
  // deployer.link(ConvertLib, MetaCoin);
  // deployer.deploy(MetaCoin);
};
