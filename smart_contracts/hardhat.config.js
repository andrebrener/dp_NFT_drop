require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");
require('dotenv').config()

const { ALCHEMY_API_KEY, DEPLOYER_MNEMONIC, ETHERSCAN_API_KEY, COIN_MARKET_CAP_KEY } = process.env;

// Only register remote networks when credentials are present, so local
// compile/test works without an .env file.
const networks = {};
if (ALCHEMY_API_KEY && DEPLOYER_MNEMONIC) {
  networks.ropsten = {
    url: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
    accounts: { mnemonic: DEPLOYER_MNEMONIC }
  };
}

module.exports = {
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  gasReporter: {
    enabled: true,
    currency: 'usd',
    coinmarketcap: COIN_MARKET_CAP_KEY
  },
  networks,
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
};