const hre = require("hardhat");
const { execute } = require("./utils");

var routerAddress = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d";
var tokenAAdd;
var tokenBAdd;
var DefiAddress;

if (process.env.HARDHAT_NETWORK == "matic") {
  // Polygon
  tokenAAdd = "0x4b26Cb735a17C8f0F175A83fbbd0EB1AcC5617D3";
  tokenBAdd = "0x6ac4BDa141dAbf42c1BC0bdB74738eC8c2A9568E";
  DefiAddress = "0x7963a32292C3a529287B612C620dBE2F120CE045";
} else {
  // Goerli
  tokenAAdd = "0xC4be22a4D92F7d3650f03FE0f2750e076AB97989";
  tokenBAdd = "0x2d130BA5111fdc117A614F20896d7Cc9B0EF6c6e";
  DefiAddress = "0x7B8086c69A56cB60EBe6Cc388d6B7049915F1785";
}

var gcf = hre.ethers.getContractFactory;
var pEth = hre.ethers.utils.parseEther;
var fEth = hre.ethers.utils.formatEther;

async function main() {
  var TokenA = await hre.ethers.getContractFactory("TokenA");
  var tokenA = await TokenA.deploy();
  var tx = await tokenA.deployed();
  await tx.deployTransaction.wait(5);
  console.log("Address:", tokenA.address);

  var TokenB = await hre.ethers.getContractFactory("TokenB");
  var tokenB = await TokenB.deploy();
  var tx = await tokenB.deployed();
  await tx.deployTransaction.wait(5);
  console.log("Address:", tokenB.address);

  var DeFi = await hre.ethers.getContractFactory("DeFi");
  var deFi = await hre.upgrades.deployProxy(DeFi, [tokenAAdd, tokenBAdd], {
    kind: "uups",
  });
  var tx = await deFi.deployed();
  await tx.deployTransaction.wait(5);

  console.log("Address P: ", deFi.address);
  var implementation = await upgrades.erc1967.getImplementationAddress(
    deFi.address
  );
  console.log("Address I: ", implementation);

  await hre.run("verify:verify", {
    address: implementation,
    constructorArguments: [],
  });

  console.log("Empezo la verificaion");
  await hre.run("verify:verify", {
    contract: "contracts/DeFi.sol:TokenA",
    address: tokenA.address,
    constructorArguments: [],
  });
  await hre.run("verify:verify", {
    contract: "contracts/DeFi.sol:TokenB",
    address: tokenB.address,
    constructorArguments: [],
  });
}

async function initSCs() {
  var [owner, alice] = await hre.ethers.getSigners();
  var TokenA = await hre.ethers.getContractFactory("TokenA");
  var tokenA = TokenA.attach(tokenAAdd);

  var TokenB = await hre.ethers.getContractFactory("TokenB");
  var tokenB = TokenB.attach(tokenBAdd);

  var DeFi = await hre.ethers.getContractFactory("DeFi");
  var deFi = DeFi.attach(DefiAddress);

  return [tokenA, tokenB, deFi, owner, alice];
}

async function addLiquidity() {
  var [tokenA, tokenB, deFi, owner, alice] = await initSCs();

  // await execute(owner, tokenA, "mint", [deFi.address, pEth("25000")], "mintA");
  // await execute(owner, tokenB, "mint", [deFi.address, pEth("1000")], "mintB");
  var [txHash] = await execute(owner, deFi, "addLiquidity", [], "df");
  console.log(txHash);
}

async function upgrade() {
  const DeFi = await hre.ethers.getContractFactory("DeFi");
  var defi = await upgrades.upgradeProxy(DefiAddress, DeFi);

  try {
    await defi.deployTransaction.wait(5);
  } catch (error) {
    console.log(error);
  }
  var implementation = await upgrades.erc1967.getImplementationAddress(
    defi.address
  );
  await hre.run("verify:verify", {
    address: implementation,
    constructorArguments: [],
  });
}

async function getPair() {
  var [tokenA, tokenB, deFi] = await initSCs();
  var res = await deFi.getPair();
  console.log(res);
}

async function swapExactTokensForTokens() {
  // uint256 amountA = 25000 * 10 ** 18;
  // uint256 amountB = 1000 * 10 ** 18;
  // 1 token B === 25 token A
  var [tokenA, tokenB, deFi, owner, alice] = await initSCs();

  var amntIn = pEth("50"); // tokenA
  await execute(owner, tokenA, "transfer", [alice.address, amntIn], "trans");
  console.log(
    `Balance token A: ${fEth(await tokenA.balanceOf(alice.address))}`
  );
  console.log(
    `Balance token B: ${fEth(await tokenB.balanceOf(alice.address))}`
  );

  await execute(alice, tokenA, "transfer", [deFi.address, amntIn], "trans");
  await execute(alice, deFi, "swapExactTokensForTokens", [amntIn], "deFi");

  console.log(
    `Balance token A: ${fEth(await tokenA.balanceOf(alice.address))}`
  );
  console.log(
    `Balance token B: ${fEth(await tokenB.balanceOf(alice.address))}`
  );
}

async function swapTokensForExactTokens() {
  var [tokenA, tokenB, deFi, owner, alice] = await initSCs();
  await execute(owner, tokenB, "transfer", [alice.address, pEth("2")], "t");

  var balTokenB = await tokenB.balanceOf(alice.address);
  console.log(
    `Balance token A: ${fEth(await tokenA.balanceOf(alice.address))}`
  );
  console.log(`Balance token B: ${fEth(balTokenB)}`);

  var amountOut = pEth("30");
  var amountInMax = balTokenB;
  await execute(alice, tokenB, "approve", [deFi.address, amountInMax], "trans");
  var [txHash] = await execute(
    alice,
    deFi,
    "swapTokensForExactTokens",
    [amountOut, amountInMax],
    "deFi"
  );

  console.log(
    `Balance token A: ${fEth(await tokenA.balanceOf(owner.address))}`
  );
  console.log(
    `Balance token B: ${fEth(await tokenB.balanceOf(owner.address))}`
  );
  console.log(txHash);
}

// main()
// deployDeFi()
// upgrade()
addLiquidity()
  // getPair()
  // swapExactTokensForTokens()
  // swapTokensForExactTokens()
  // s
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

/**
   *
   * 
   var event = "event SwapTokensForExactTokens(uint[] amounts)";
    var iface = new ethers.utils.Interface([event]);
    var topic = iface.getEventTopic("PurchaseLand");
   */
