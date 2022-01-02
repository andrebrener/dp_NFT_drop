// scripts/index.js
async function main() {
    // Set up an ethers contract, representing our deployed Box instance
    // const address = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    const address = "0x361fA6da7d7ad961dB403203cCc9fE3fe9A933b9"
    
    const DPAuction = await ethers.getContractFactory("DPAuction");
    const dPAuction = await DPAuction.attach(address);

    [user1, user2, user3] = await hre.ethers.getSigners();

    console.log("address1:", user1.address);
    console.log("address2:", user2.address);

    // Start sale
    // await dPAuction.startAuction();

    // First bid
    // const firstBid = ethers.utils.parseEther("0.3");
    // console.log("First Bid:", ethers.utils.formatEther(firstBid))
    // await dPAuction.bid({value: firstBid})

    // const maxBidFirst = await dPAuction.maxBid()
    // const maxBidderFirst = await dPAuction.maxBidder()

    // console.log("Highest bid:", ethers.utils.formatEther(maxBidFirst))
    // console.log("Highest bidder:", maxBidderFirst)

    // // Second bid
    // const secondBid = ethers.utils.parseEther("3");
    // console.log("First Bid:", ethers.utils.formatEther(secondBid))
    // await dPAuction.connect(user2).bid({value: secondBid})

    // const maxBidSec = await dPAuction.maxBid()
    // const maxBidderSec = await dPAuction.maxBidder()

    // console.log("Highest bid:", ethers.utils.formatEther(maxBidSec))
    // console.log("Highest bidder:", maxBidderSec)

    // await dPAuction.connect(user2).mint()

    // await dPAuction.recoverFunds()

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });