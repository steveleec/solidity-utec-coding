var getTxHash = (hash, network) => {
  var prefix;
  if (process.env.HARDHAT_NETWORK == "matic")
    prefix = "https://goerli.etherscan.io/tx/";
  else prefix = "https://mumbai.polygonscan.com/tx/";

  return `${prefix}${hash}`;
};

async function execute(signer, smartContract, command, args, msg) {
  var txHash;
  try {
    var tx = await smartContract.connect(signer)[command](...args);
    var res = await tx.wait();

    txHash = getTxHash(res.transactionHash);
  } catch (error) {
    console.log(`Failed SC ${msg}: ${error}`);
  }

  return [txHash, res];
}

module.exports = { execute };
