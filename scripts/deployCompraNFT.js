const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  var CompraNFT = await hre.ethers.getContractFactory("CompraNFT");
  var compraNFT = await CompraNFT.deploy();

  var tx = await compraNFT.deployed();
  await tx.deployTransaction.wait(5);
  console.log("CompraNFT esta publicado en el address", compraNFT.address);

  // script para verificacion del contrato
  await hre.run("verify:verify", {
    address: compraNFT.address,
    constructorArguments: [],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
