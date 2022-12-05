require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@openzeppelin/hardhat-upgrades");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  networks: {
    matic: {
      // Polygon funciona con MATIC y no ETHER
      url: process.env.MUMBAI_TESNET_URL,
      accounts: [process.env.ADMIN_ACCOUNT_PRIVATE_KEY],
      timeout: 0, // tiempo de espera para terminar el proceso
      gas: "auto", // limite de gas a gastar (gwei)
      gasPrice: "auto", // precio del gas a pagar (gwei)
    },
    goerli: {
      url: process.env.GOERLI_TESNET_URL,
      accounts: [process.env.ADMIN_ACCOUNT_PRIVATE_KEY],
      timeout: 0,
      gas: "auto",
      gasPrice: "auto",
    },
  },
  etherscan: { apiKey: process.env.POLYGONSCAN_API_KEY },
  // etherscan: { apiKey: process.env.ETHERSCAN_API_KEY },
};

// 1,000,000,000 gwei in one ether
// 10ˆ9 = 1 Eth (3,000 USD)
