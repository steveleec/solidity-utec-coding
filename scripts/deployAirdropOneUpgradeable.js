const hre = require("hardhat");
const abiCuy = require("./abiCuy");
require("dotenv").config();

function getRole(role) {
  return hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(role));
}
var MINTER_ROLE = getRole("MINTER_ROLE");
var BURNER_ROLE = getRole("BURNER_ROLE");

async function main() {
  var name = "Mi Primer Token Upgradeable";
  var symbol = "MPRTKNUPGRD";

  // publicar TokenUpgradeableAirdrop
  var TokenUpgradeableAirdrop = await hre.ethers.getContractFactory(
    "TokenUpgradeableAirdrop"
  );
  var tokenUpgradeableAirdrop = await hre.upgrades.deployProxy(
    TokenUpgradeableAirdrop,
    [name, symbol],
    {
      kind: "uups",
    }
  );
  var tx = await tokenUpgradeableAirdrop.deployed();
  await tx.deployTransaction.wait(5);

  // getting addresses
  console.log("Token address", tokenUpgradeableAirdrop.address);
  var implmntTokenUp = await upgrades.erc1967.getImplementationAddress(
    tokenUpgradeableAirdrop.address
  );
  console.log("Token Imp address", implmntTokenUp);

  // publicar AirdropONEUpgradeable
  var AirdropONEUpgradeable = await hre.ethers.getContractFactory(
    "AirdropONEUpgradeable"
  );
  var airdropONEUpgradeable = await hre.upgrades.deployProxy(
    AirdropONEUpgradeable,
    [tokenUpgradeableAirdrop.address],
    { kind: "uups" }
  );
  var tx = await airdropONEUpgradeable.deployed();
  await tx.deployTransaction.wait(5);
  // getting addresses
  console.log("AirdropOne address", airdropONEUpgradeable.address);
  var implmntAirdropUp = await upgrades.erc1967.getImplementationAddress(
    airdropONEUpgradeable.address
  );
  console.log("AirdropOne Imp address", implmntAirdropUp);

  // Set Up
  await airdropONEUpgradeable.setTokenAddress(tokenUpgradeableAirdrop.address);

  // Set up Roles Token => Airdrop
  await tokenUpgradeableAirdrop.grantRole(
    MINTER_ROLE,
    airdropONEUpgradeable.address
  );
  await tokenUpgradeableAirdrop.grantRole(
    BURNER_ROLE,
    airdropONEUpgradeable.address
  );

  console.log("Empezo la verificaion");
  // script para verificacion del contrato
  await hre.run("verify:verify", {
    address: implmntTokenUp,
    constructorArguments: [],
  });

  await hre.run("verify:verify", {
    address: implmntAirdropUp,
    constructorArguments: [],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
