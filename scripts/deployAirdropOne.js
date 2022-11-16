const hre = require("hardhat");

async function main() {
  /**
   *
   * var arr = [1,2,3,4];
   * var a,b,c,d;
   * a = arr[0]
   * b = arr[1]
   * c = arr[2]
   * d = arr[3]
   *
   * var [a,b,c,d] = [1,2,3,4] // desestructuracion
   */
  var [owner] = await hre.ethers.getSigners();
  var alice = owner;
  var bob = owner;
  var carl = owner;

  // publicar MiPrimerToken
  var name = "Mi Primer Token";
  var symbol = "MPRTKN";
  var MiPrimerToken = await hre.ethers.getContractFactory("MiPrimerToken");
  var miPrimerToken = await MiPrimerToken.deploy(name, symbol);
  var tx = await miPrimerToken.deployed();
  console.log("MiPrimerToken Address", miPrimerToken.address);
  // cuando queremos deployar a tesnet/mainnet
  await tx.deployTransaction.wait(5);

  // publicar AirdroOne
  var AirdropOne = await hre.ethers.getContractFactory("AirdropONE");
  var airdropOne = await AirdropOne.deploy(miPrimerToken.address);
  var tx = await airdropOne.deployed();
  console.log("Airdrop Address", airdropOne.address);
  // cuando queremos deployar a tesnet/mainnet
  await tx.deployTransaction.wait(5);

  // Set Up
  await airdropOne.setTokenAddress(miPrimerToken.address);

  // Set up Roles Token => Airdrop
  function getRole(role) {
    return hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(role));
  }
  var MINTER_ROLE = getRole("MINTER_ROLE");
  var BURNER_ROLE = getRole("BURNER_ROLE");

  await miPrimerToken.grantRole(MINTER_ROLE, airdropOne.address);
  await miPrimerToken.grantRole(BURNER_ROLE, airdropOne.address);
  console.log("Set Up finalizado");

  // Verificar si el contrato Airdrop tiene los roles
  var res = await miPrimerToken.hasRole(MINTER_ROLE, airdropOne.address);
  console.log("Role MINTER_ROLE?", res);
  var res = await miPrimerToken.hasRole(BURNER_ROLE, airdropOne.address);
  console.log("Role BURNER_ROLE?", res);

  // Añadir a lista blanca usando el owner
  await airdropOne.connect(owner).addToWhiteList(alice.address);
  await airdropOne.connect(owner).addToWhiteList(bob.address);

  // alice no tiene permiso en Airdrop para addToWhiteList
  // le damos permiso a alice
  var adminRole =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  var addressZero = "0x0000000000000000000000000000000000000000";
  await airdropOne.connect(owner).grantRole(adminRole, alice.address);
  try {
    await airdropOne.connect(alice).addToWhiteList(carl.address);
  } catch (error) {
    console.log(error);
  }

  console.log("Empezo la verificaion");
  // script para verificacion del contrato
  await hre.run("verify:verify", {
    address: miPrimerToken.address,
    constructorArguments: [name, symbol],
  });

  await hre.run("verify:verify", {
    address: airdropOne.address,
    constructorArguments: [miPrimerToken.address],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
