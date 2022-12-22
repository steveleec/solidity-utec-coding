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
  tokenAAdd = "0x52A525D4c44b0E0491c14CA7Ff5A45a3884c15B3";
  tokenBAdd = "0x89EC644A1224eC1595952D6f0b90c041A46a0765";
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

// async function addLiquidity() {
//   var [tokenA, tokenB, deFi, owner, alice] = await initSCs();

//   // await execute(owner, tokenA, "mint", [deFi.address, pEth("25000")], "mintA");
//   // await execute(owner, tokenB, "mint", [deFi.address, pEth("1000")], "mintB");
//   var [txHash] = await execute(owner, deFi, "addLiquidity", [], "df");
//   console.log(txHash);
// }

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

async function publishTokens() {
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

  console.log("Empezo la verificaion");
  await hre.run("verify:verify", {
    contract: "contracts/TokenAB.sol:TokenA",
    address: tokenA.address,
    constructorArguments: [],
  });
  await hre.run("verify:verify", {
    contract: "contracts/TokenAB.sol:TokenB",
    address: tokenB.address,
    constructorArguments: [],
  });
}

async function publishLiquiditySC() {
  var LiquidityPool = await hre.ethers.getContractFactory("LiquidityPool");
  var liquidityPool = await LiquidityPool.deploy();
  var tx = await liquidityPool.deployed();
  await tx.deployTransaction.wait(5);
  console.log("Address:", liquidityPool.address);

  await hre.run("verify:verify", {
    address: liquidityPool.address,
    constructorArguments: [],
  });
}

async function addLiquidity() {
  var [owner] = await hre.ethers.getSigners();

  var tokenAAdd = "0x52A525D4c44b0E0491c14CA7Ff5A45a3884c15B3";
  var TokenA = await hre.ethers.getContractFactory("TokenA");
  var tokenA = TokenA.attach(tokenAAdd);

  var tokenBAdd = "0x89EC644A1224eC1595952D6f0b90c041A46a0765";
  var TokenB = await hre.ethers.getContractFactory("TokenB");
  var tokenB = TokenB.attach(tokenBAdd);

  var liquidityPoolAdd = "0x73E9D688842E6AbFaCe854fE7Fd880BE82ED6670";
  var LiquidityPool = await hre.ethers.getContractFactory("LiquidityPool");
  var liquidityPool = LiquidityPool.attach(liquidityPoolAdd);

  // Depositar tokens en el contrato que creará el pool de liquidez
  var tx = await tokenA.mint(liquidityPoolAdd, pEth("10000"));
  await tx.wait();
  var tx = await tokenB.mint(liquidityPoolAdd, pEth("10000"));
  await tx.wait();

  // Definir un ratio
  // 10 token A = 25 token B

  // Añadir liquidez
  var _tokenA = tokenAAdd;
  var _tokenB = tokenBAdd;
  var _amountADesired = pEth("1000");
  var _amountBDesired = pEth("2500");
  var _amountAMin = pEth("1000");
  var _amountBMin = pEth("2500");
  var _to = owner.address;
  var _deadline = new Date().getTime();
  var tx = await liquidityPool.addLiquidity(
    _tokenA,
    _tokenB,
    _amountADesired,
    _amountBDesired,
    _amountAMin,
    _amountBMin,
    _to,
    _deadline
  );
  var res = await tx.wait();
  console.log("Transaction Hash", res.transactionHash);
}

async function publishSwapper() {
  var Swapper = await hre.ethers.getContractFactory("Swapper");
  var swapper = await Swapper.deploy();
  var tx = await swapper.deployed();
  await tx.deployTransaction.wait(5);
  console.log("Address:", swapper.address);

  await hre.run("verify:verify", {
    address: swapper.address,
    constructorArguments: [],
  });
}

async function swapTokensForExact() {
  var tokenAAdd = "0x52A525D4c44b0E0491c14CA7Ff5A45a3884c15B3";
  var TokenA = await hre.ethers.getContractFactory("TokenA");
  var tokenA = TokenA.attach(tokenAAdd);

  var tokenBAdd = "0x89EC644A1224eC1595952D6f0b90c041A46a0765";
  var TokenB = await hre.ethers.getContractFactory("TokenB");
  var tokenB = TokenB.attach(tokenBAdd);

  var swapperAdd = "0xE65D464aC7D3C195e18413EbEA7f7a989449Aa83";
  var Swapper = await hre.ethers.getContractFactory("Swapper");
  var swapper = Swapper.attach(swapperAdd);

  // Enviaremos al contrato Swapper 100 tokens A
  // El contrato Swapper no tiene tokens B
  // El ratio de tokens A a tokens B es 10:25
  // Vamos a solicitar la cantidad exacta de 100 tokens B
  // No sabemos cuantos tokens A necesitamos para obtener 100 tokens B
  // Atravès del liquidity pool, se intercambirá los tokens A por tokens B

  // Enviar tokens A al contrato Swapper
  var tx = await tokenA.mint(swapperAdd, pEth("100"));
  await tx.wait();

  var amountOut = pEth("100"); // 100 tokens B
  var amountInMax = pEth("45"); // Aprox, estoy dispuesto a entregar 45 tokens A
  var path = [tokenAAdd, tokenBAdd];
  var to = swapperAdd;
  var deadline = new Date().getTime();

  var tx = await swapper.swapTokensForExactTokens(
    amountOut,
    amountInMax,
    path,
    to,
    deadline
  );

  var res = await tx.wait();
  console.log("Transaction Hash", res.transactionHash);

  console.log("Token A Bal: ", (await tokenA.balanceOf(swapperAdd)).toString());
  console.log("Token B Bal: ", (await tokenB.balanceOf(swapperAdd)).toString());
}

async function swapExactTokens() {
  var tokenAAdd = "0x52A525D4c44b0E0491c14CA7Ff5A45a3884c15B3";
  var TokenA = await hre.ethers.getContractFactory("TokenA");
  var tokenA = TokenA.attach(tokenAAdd);

  var tokenBAdd = "0x89EC644A1224eC1595952D6f0b90c041A46a0765";
  var TokenB = await hre.ethers.getContractFactory("TokenB");
  var tokenB = TokenB.attach(tokenBAdd);

  var swapperAdd = "0xE65D464aC7D3C195e18413EbEA7f7a989449Aa83";
  var Swapper = await hre.ethers.getContractFactory("Swapper");
  var swapper = Swapper.attach(swapperAdd);

  // El contrato Swapper tiene los siguientes balances de tokens
  // Token A Bal:  58207957204948177866
  // Token B Bal:  100000000000000000000
  // El ratio de tokens A a tokens B es 10:25
  // Vamos a enviar a cambiar la cantidad exacta de 100 tokens B
  // No sabemos cuantos tokens A vamos
  // Atravès del liquidity pool, se intercambirá los tokens B por tokens A

  var amountIn = pEth("100"); // Envio exactamente 100 tokens B
  var amountOutMin = pEth("35"); // Aprox, recibiré al menos 35 tokens A
  var path = [tokenBAdd, tokenAAdd];
  var to = swapperAdd;
  var deadline = new Date().getTime();

  var tx = await swapper.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    path,
    to,
    deadline
  );

  var res = await tx.wait();
  console.log("Transaction Hash", res.transactionHash);

  console.log("Token A Bal: ", (await tokenA.balanceOf(swapperAdd)).toString());
  console.log("Token B Bal: ", (await tokenB.balanceOf(swapperAdd)).toString());
}

swapExactTokens()
  // swapTokensForExact()
  // publishSwapper()
  // publishLiquiditySC()
  // publishTokens()
  // main()
  // deployDeFi()
  // upgrade()
  // addLiquidity()
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
