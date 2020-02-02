var AdminWindow = artifacts.require("AdminWindow");
var BountyHub = artifacts.require("BountyHub");

module.exports = function(deployer) {
  deployer.deploy(AdminWindow).then(function() {
  	return deployer.deploy(BountyHub, AdminWindow.address);
  });
};
