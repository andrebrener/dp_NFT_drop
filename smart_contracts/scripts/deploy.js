async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);

    this.tokenURI = "tokenURI";
    this.name = "DP";
    this.symbol = "DP";

    this.DPAuction = await hre.ethers.getContractFactory("DPAuction");
    this.dPAuction = await this.DPAuction.deploy(this.name, this.symbol, this.tokenURI);
  
    console.log("Token address:", dPAuction.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });