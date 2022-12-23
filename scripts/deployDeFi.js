const hre = require("hardhat");
const { ethers } = hre;

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

async function publishAddLiquidity() {
  var AddLiquidity = await hre.ethers.getContractFactory("AddLiquidity");
  var addLiquidity = await AddLiquidity.deploy();
  var tx = await addLiquidity.deployed();
  await tx.deployTransaction.wait(5);
  console.log("Address:", addLiquidity.address);

  await hre.run("verify:verify", {
    address: addLiquidity.address,
    constructorArguments: [],
  });
}

var pEth = ethers.utils.parseEther;

async function addLiquidityToPool() {
  var tokenAAdd = "0xe8e5087004C10a99FB1a13E7C48Ca4a1f3bEf8c9";
  var TokenA = await hre.ethers.getContractFactory("TokenA");
  var tokenA = TokenA.attach(tokenAAdd);

  var tokenBAdd = "0xEBabd70215B973930663b5E259870AB8efBA5886";
  var TokenB = await hre.ethers.getContractFactory("TokenB");
  var tokenB = TokenB.attach(tokenBAdd);

  var addLiquidityAdd = "0xf9637cECe963a1e8837fe3F1D6366E59daEaa952";
  var AddLiquidity = await hre.ethers.getContractFactory("AddLiquidity");
  var addLiquidity = AddLiquidity.attach(addLiquidityAdd);

  // Darle fondos al contrato AddLiquity
  var tx = await tokenA.mint(addLiquidityAdd, pEth("1000000"));
  await tx.wait();
  var tx = await tokenB.mint(addLiquidityAdd, pEth("2500000"));
  await tx.wait();

  // Definir el ratio => definir el X * Y = K
  // Token A: 1,000,000
  // Token B: 2,500,000
  // ration 10:25

  var _tokenA = tokenAAdd;
  var _tokenB = tokenBAdd;
  var _amountADesired = pEth("1000000");
  var _amountBDesired = pEth("2500000");
  var _amountAMin = pEth("1000000");
  var _amountBMin = pEth("2500000");
  var _to = addLiquidity.address;
  var _deadline = new Date().getTime();

  var tx = await addLiquidity.addLiquidity(
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
  console.log("transaction hash", res.transactionHash);

  console.log(
    "Balance A",
    (await tokenA.balanceOf(addLiquidityAdd)).toString()
  );
  console.log(
    "Balance B",
    (await tokenB.balanceOf(addLiquidityAdd)).toString()
  );
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

async function swapTokensForExactTokens() {
  var tokenAAdd = "0xe8e5087004C10a99FB1a13E7C48Ca4a1f3bEf8c9";
  var TokenA = await hre.ethers.getContractFactory("TokenA");
  var tokenA = TokenA.attach(tokenAAdd);

  var tokenBAdd = "0xEBabd70215B973930663b5E259870AB8efBA5886";
  var TokenB = await hre.ethers.getContractFactory("TokenB");
  var tokenB = TokenB.attach(tokenBAdd);

  var swapperAdd = "0x62C98fDBD3798357c043C094bd40692B251D2E95";
  var Swapper = await hre.ethers.getContractFactory("Swapper");
  var swapper = Swapper.attach(swapperAdd);

  // Contrato swapper no tiene tokens (ni A ni B)
  // Enviaremos al contrato swapper la cantidad de 500 tokens A
  // El ratio que hemos creado es de 10:25 (1M de A/ 2.5M de B)
  // Le vamos a pedir al pool de liquidez que nos entregue 1000 tokens B
  // Aprox: cuantos tokens A deberia entregar? ~400 tokens A

  var tx = await tokenA.mint(swapperAdd, pEth("500"));
  await tx.wait();

  console.log("Balance A", (await tokenA.balanceOf(swapperAdd)).toString());
  console.log("Balance B", (await tokenB.balanceOf(swapperAdd)).toString());
  console.log("===============");

  var amountOut = pEth("100"); // recibir exact tokens B
  var amountInMax = pEth("500"); // tokens A max a usar
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
  console.log("Tx Hash:", res.transactionHash);

  console.log("Balance A", (await tokenA.balanceOf(swapperAdd)).toString());
  console.log("Balance B", (await tokenB.balanceOf(swapperAdd)).toString());
}

swapTokensForExactTokens()
  // publishSwapper()
  // addLiquidityToPool()
  // publishAddLiquidity()
  // main()
  //
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
