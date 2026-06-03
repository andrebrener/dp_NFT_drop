async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // ---- DPAuction ----
  const auctionName = "DP";
  const auctionSymbol = "DP";
  const auctionTokenURI = "tokenURI";

  const DPAuction = await hre.ethers.getContractFactory("DPAuction");
  const dPAuction = await DPAuction.deploy(
    auctionName,
    auctionSymbol,
    auctionTokenURI
  );
  await dPAuction.deployed();
  console.log("DPAuction address:", dPAuction.address);

  // ---- DPDrop ----
  const dropName = "DPDrop";
  const dropSymbol = "DPD";
  const dropBaseURI = "baseURI";
  // Admin must be set explicitly (never hardcoded). Defaults to the deployer.
  const admin = deployer.address;
  // Reveal date ~1 day in the future; adjust before a real deployment.
  const revealDate = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

  const DPDrop = await hre.ethers.getContractFactory("DPDrop");
  const dPDrop = await DPDrop.deploy(
    dropName,
    dropSymbol,
    dropBaseURI,
    admin,
    revealDate
  );
  await dPDrop.deployed();
  console.log("DPDrop address:", dPDrop.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
