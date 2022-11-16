const hre = require("hardhat");
const abiCuy = require("./abiCuy");
require("dotenv").config();

function getRole(role) {
  return hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(role));
}
var MINTER_ROLE = getRole("MINTER_ROLE");
var BURNER_ROLE = getRole("BURNER_ROLE");

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

async function connectWithoutAbi() {
  var [owner] = await hre.ethers.getSigners();

  // Cuando tienes el SC en codigo (sin ABI)
  // conectarnos con el contrato MiPrimerToken
  var addressSC = "0x27C4eC475D579aa992Ea337dA9984cC418BBE285";
  var MiPrimerToken = await hre.ethers.getContractFactory("MiPrimerToken");
  var miPrimerToken = MiPrimerToken.attach(addressSC);

  var ts = await miPrimerToken.totalSupply();
  // Si he consultado un metodo view y su valor de retorno es un uint256
  // me devuelve en BigNumbers
  // console.log("Total Supply", ts.toNumber());
  console.log("Total Supply", ts);
  console.log("Total Supply formateado", hre.ethers.utils.formatEther(ts));
  console.log("Total Supply *", ts.mul(ts).toString());
  console.log("Total Supply +", ts.add(ts).toString());
  console.log("Total Supply -", ts.sub(ts).toString());

  var miAddress = "0x5387ddeec8ddC004a217d8e172241EB5F900B302";
  var miBalance = await miPrimerToken.balanceOf(miAddress);
  console.log("Mi Balance", miBalance.toString());

  // grantRole a owner
  // var tx = await miPrimerToken
  //   .connect(owner)
  //   .grantRole(MINTER_ROLE, owner.address);
  // await tx.wait(1);

  // acuñar
  var to = "0x890ECD3d23Ff71c58Fd1E847dCCAf0bC601a3cd3";
  var amount = hre.ethers.utils.parseEther("1"); // automaticamente agrega 18 ceros
  var tx = await miPrimerToken.mint(to, amount);
  await tx.wait(1);
  var transactionHash = (hash) => `https://mumbai.polygonscan.com/tx/${hash}`;
  console.log("Transaction hash", transactionHash(tx.hash));
  console.log("Transaccion se ha procesado 1");

  // var to2 = "0xbC2568Ae7c08501B54D1f53b0A6FB149818feD9E";
  // var amount = hre.ethers.utils.parseEther("1000"); // automaticamente agrega 18 ceros
  // var tx = await miPrimerToken.mint(to2, amount);
  // await tx.wait(1);
  // console.log("Transaccion se ha procesado 2");
}

async function connectWithAbi() {
  var [owner] = await hre.ethers.getSigners();

  // Cuando tienes el el ABI del SC (sin el codigo del SC)
  var address = "0x04eCd05895CCc3457fe328817B87DCfB62d8EdF3";
  var abi = abiCuy;
  var urlProvider = process.env.MUMBAI_TESNET_URL;
  var provider = new hre.ethers.providers.JsonRpcProvider(urlProvider);
  // var abiSimplificado = [
  // "function balanceOf(address owner) external returns(uint256)",
  // ];
  var cuyMoche = new hre.ethers.Contract(address, abi, provider);
  // var cuyMoche = new hre.ethers.Contract(address, abiSimplificado, provider);

  // console.log(cuyMoche);
  var res = await cuyMoche.connect(owner).balanceOf(address);
  console.log("balance", res);
}

// main()
// connectWithoutAbi();
connectWithAbi().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
