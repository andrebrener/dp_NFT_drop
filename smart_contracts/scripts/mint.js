// scripts/index.js
async function main() {
    // Set up an ethers contract, representing our deployed Box instance
    const address = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    const DPAuction = await ethers.getContractFactory("DPAuction");
    const dPAuction = await DPAuction.attach(address);

    [user1, user2, user3] = await hre.ethers.getSigners();

    console.log("address1:", user1.address);
    console.log("address2:", user2.address);

    // Try minting with loser
    console.log("Minting with loser")
    try {
      await dPAuction.mint();  
    } catch (error) {
      console.log(error)
    }

    // Minting with winner
    console.log("Minting with winner");
    try {
      await dPAuction.connect(user2).mint();
    } catch (error) {
      console.log(error)
    }

    const tokenURI = await dPAuction.tokenURI(1);
    const balance = await dPAuction.balanceOf(user2.address);

    console.log("URI:", tokenURI)
    console.log("Balance:", balance.toNumber())
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });