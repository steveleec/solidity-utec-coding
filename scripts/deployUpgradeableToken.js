const hre = require("hardhat");
require("dotenv").config();

async function main() {
  var UpgradeableToken = await hre.ethers.getContractFactory(
    "UpgradeableToken"
  );
  var upgradeableToken = await hre.upgrades.deployProxy(UpgradeableToken, {
    kind: "uups",
  });

  await upgradeableToken.deployed();

  var implmntAddress = await upgrades.erc1967.getImplementationAddress(
    upgradeableToken.address
  );
  console.log("El Proxy address es (V2):", upgradeableToken.address);
  console.log("El Implementation address es (V2):", implmntAddress);

  await hre.run("verify:verify", {
    address: implmntAddress,
    constructorArguments: [],
  });
}

async function upgrade() {
  var UpgradeableTokenAddress = "0xb31BF786ad7C614205C3F8129ed8a09493F16Ba0";
  const UpgradeableToken2 = await hre.ethers.getContractFactory(
    "UpgradeableToken2"
  );
  var upgradeableToken2 = await upgrades.upgradeProxy(
    UpgradeableTokenAddress,
    UpgradeableToken2
  );

  var implmntAddress = await upgrades.erc1967.getImplementationAddress(
    upgradeableToken2.address
  );
  console.log("El Proxy address es (V2):", upgradeableToken2.address);
  console.log("El Implementation address es (V2):", implmntAddress);
}
// main()
upgrade().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
