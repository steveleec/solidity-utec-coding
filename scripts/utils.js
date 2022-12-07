const hre = require("hardhat");
const gcf = hre.ethers.getContractFactory;
const dp = hre.upgrades.deployProxy;

function getRole(role) {
  return hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(role));
}

async function executeSet(contract, command, args, messageWhenFailed) {
  try {
    var tx = await contract[command](...args);
    return await tx.wait(1);
  } catch (e) {
    console.error(messageWhenFailed, e);
  }
}

async function verify(_implementation, _contractName, arguments = []) {
  if (!process.env.HARDHAT_NETWORK) return;
  try {
    await hre.run("verify:verify", {
      address: _implementation,
      constructorArguments: [...arguments],
    });
  } catch (e) {
    if (e.message.includes("Contract source code already verified"))
      console.log(`${_contractName} is verified already`);
    else console.error(`Error veryfing - ${_contractName}`, e);
  }
}

async function printAddress(contractName, proxyAddress) {
  console.log(`${contractName} Proxy Address: ${proxyAddress}`);
  var implementationAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );
  console.log(`${contractName} Impl Address: ${implementationAddress}`);
  return implementationAddress;
}

async function deploySC(contractName, args) {
  var smartContract = await gcf(contractName);
  var proxyContract = await dp(smartContract, [...args], {
    kind: "uups",
  });
  var tx = await proxyContract.deployed();
  // true cuando se usa '--network matic' en el script de deployment
  if (process.env.HARDHAT_NETWORK) {
    await tx.deployTransaction.wait(5);
  }
  return proxyContract;
}

module.exports = {
  executeSet,
  verify,
  getRole,
  printAddress,
  deploySC,
};
