const hre = require("hardhat");
require("dotenv").config();

/**
 * Proxy Address: 0x75527eBC969E9F8B06089Debcc0FF5637eEd3fc0
 * Implementation Address: 0xcc78aaa4fa560706aca2a48ed282d05f764a9d51
 */

async function main() {
  // deploy
  var UpgradeableToken = await hre.ethers.getContractFactory(
    "UpgradeableToken"
  );
  var upgradeableToken = await hre.upgrades.deployProxy(UpgradeableToken, {
    kind: "uups",
  });
  var tx = await upgradeableToken.deployed();
  await tx.deployTransaction.wait(5);

  var implementationAddress = await upgrades.erc1967.getImplementationAddress(
    upgradeableToken.address
  );

  console.log("Proxy Address:", upgradeableToken.address);
  console.log("Implementation Address:", implementationAddress);

  await hre.run("verify:verify", {
    address: implementationAddress, // <===== Address del Contrato de Implementation!!!!
    constructorArguments: [],
  });
}

async function upgrade() {
  var UpgradeableTokenAddress = "0x75527eBC969E9F8B06089Debcc0FF5637eEd3fc0";
  var UpgradeableToken2 = await hre.ethers.getContractFactory(
    "UpgradeableToken2"
  );

  var upgradeableToken2 = await hre.upgrades.upgradeProxy(
    UpgradeableTokenAddress,
    UpgradeableToken2
  );
  await tx.deployTransaction.wait(5);

  // debemos esperar para que propague la actualizacion
  var implementationAddress = await upgrades.erc1967.getImplementationAddress(
    upgradeableToken2.address
  );

  console.log("Proxy Address:", upgradeableToken2.address);
  console.log("Implementation Address:", implementationAddress);
}

upgrade().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
