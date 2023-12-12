require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    goerli: {
      url: "https://eth-goerli.g.alchemy.com/v2/JL-Q05CtV602eTXzE8BpiAXwf8OKaG1F",
      accounts: [process.env.account],
      gasPrice: 3110000,
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/" + process.env.infuraApiKey,
      accounts: [process.env.account]
    },
    mainnet: {
      url: "https://mainnet.infura.io/v3/" + process.env.infuraApiKey,
      accounts: [process.env.account]
    }
  },
  etherscan: {
    apiKey: {
      goerli: process.env.etherscanApiKey
    }
  },
  mocha: {
    timeout: 100000000
  }
};
