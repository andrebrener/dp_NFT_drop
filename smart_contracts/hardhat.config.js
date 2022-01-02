require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");
require('dotenv').config()

const { ALCHEMY_API_KEY, DEPLOYER_MNEMONIC, ETHERSCAN_API_KEY, COIN_MARKET_CAP_KEY } = process.env;

module.exports = {
  solidity: "0.8.0",
  gasReporter: {
    enabled: true,
    currency: 'usd',
    // gasPrice: 100,
    coinmarketcap: COIN_MARKET_CAP_KEY
  },
  networks: {
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: { mnemonic: DEPLOYER_MNEMONIC }
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
};