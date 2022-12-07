const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  var USDCoin6 = await hre.ethers.getContractFactory("USDCoin6");
  var uSDCoin6 = await USDCoin6.deploy();
  var tx = await uSDCoin6.deployed();

  // 5 bloques de confirmacion
  await tx.deployTransaction.wait(5);
  console.log("USDCCoin6 esta publicado en el address", uSDCoin6.address);

  console.log("Empezo la verificaion");
  // script para verificacion del contrato
  await hre.run("verify:verify", {
    address: uSDCoin6.address,
    constructorArguments: [],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
