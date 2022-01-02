const { expect } = require("chai");

describe("DPAuction", function () {
  beforeEach(async function () {
    [this.user1, this.user2, this.user3] = await hre.ethers.getSigners();
    this.provider = hre.ethers.provider;
    this.tokenURI = "tokenURI";
    this.name = "DP";
    this.symbol = "DP";

    this.DPAuction = await hre.ethers.getContractFactory("DPAuction");
    this.dPAuction = await this.DPAuction.deploy(this.name, this.symbol, this.tokenURI);
    await this.dPAuction.deployed();
    this.minBidDiff = await this.dPAuction.MIN_BID_DIFF_PERC();
    this.minBid = await this.dPAuction.MINIMUM_BID();
    this.minBidEth = ethers.utils.formatEther(this.minBid);
  });
;

// General - Success
  it("Should start auction", async function () {
    await this.dPAuction.startAuction();
    expect(await this.dPAuction.auctionStarted()).to.equal(true);
  });

  it("Should emit event sale started", async function () {
    await expect(this.dPAuction.startAuction()).to.emit(this.dPAuction, "AuctionBegins");
  });

  it("Should set creation time correctly", async function () {
    const tx = await this.dPAuction.startAuction();
    const block = await this.provider.getBlock()
    const startAuctionTime = await this.dPAuction.startAuctionTime()
    await expect(startAuctionTime.toNumber()).to.equal(block.timestamp);
  });

  it("Should set ending time correctly", async function () {
    const tx = await this.dPAuction.startAuction();
    const block = await this.provider.getBlock()
    const duration = await this.dPAuction.DURATION();
    const finishTime = block.timestamp + duration.toNumber()
    const startAuctionTime = await this.dPAuction.finishTime()
    await expect(startAuctionTime.toNumber()).to.equal(finishTime);
  });

  // General - Failed

  it("Should fail when starter is not owner", async function () {
    await expect(this.dPAuction.connect(this.user2).startAuction()).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("Should fail when bidding and sale is not started", async function () {
    await expect(this.dPAuction.bid({value: 0})).to.be.revertedWith('Auction not started');
  });

  it("Should fail when start auction if auction is already started", async function () {
    await this.dPAuction.startAuction();
    await expect(this.dPAuction.startAuction()).to.be.revertedWith('Auction already started');
  });

  it("Should fail when minting and auction not started", async function () {
    await expect(this.dPAuction.mint()).to.be.revertedWith('Auction not started');
  });

  // Auction not ended - Success

  it("Should set new max bid", async function () {
    await this.dPAuction.startAuction();
    const etherBid = this.minBidEth * 2
    const newBid = ethers.utils.parseEther(etherBid.toString());
    await this.dPAuction.connect(this.user2).bid({value: newBid});
    await expect(await this.dPAuction.maxBid()).to.equal(newBid);
  });

  it("Should set new max bidder", async function () {
    await this.dPAuction.startAuction();
    const etherBid = this.minBidEth * 2
    const newBid = ethers.utils.parseEther(etherBid.toString());
    await this.dPAuction.connect(this.user2).bid({value: newBid});
    expect(await this.dPAuction.maxBidder()).to.equal(this.user2.address);
  });

  it("Should set emit bidder event", async function () {
    await this.dPAuction.startAuction();
    const etherBid = this.minBidEth * 2
    const newBid = ethers.utils.parseEther(etherBid.toString());
    await expect(this.dPAuction.bid({value: newBid}))
      .to.emit(this.dPAuction, "BidEntered")
      .withArgs(
        this.user1.address,
        newBid
      );
  });

  it("Should set new max bid after using balance", async function () {
    await this.dPAuction.startAuction();

    // First bid
    const etherBid = this.minBidEth * 2
    const newBid = ethers.utils.parseEther(etherBid.toString());
    await this.dPAuction.connect(this.user2).bid({value: newBid});

    // Second Bid
    const secondEtherBid = etherBid * 1.5
    const secondNewBid = ethers.utils.parseEther(secondEtherBid.toString());
    await this.dPAuction.bid({value: secondNewBid});

    // Third Bid
    await this.dPAuction.connect(this.user2).bid({value: newBid});

    const newMaxEthBid = etherBid * 2;

    const newMaxBid = ethers.utils.parseEther(newMaxEthBid.toString());

    expect(await this.dPAuction.maxBid()).to.equal(newMaxBid);
  });


  it("Should set pendingWithdrawals to 0 after bidding with balance", async function () {
    await this.dPAuction.startAuction();

    // First bid
    const etherBid = this.minBidEth * 2
    const newBid = ethers.utils.parseEther(etherBid.toString());
    await this.dPAuction.connect(this.user2).bid({value: newBid});

    // Second Bid
    const secondEtherBid = etherBid * 2
    const secondNewBid = ethers.utils.parseEther(secondEtherBid.toString());
    await this.dPAuction.bid({value: secondNewBid});

    // Third Bid
    const thirdEtherBid = etherBid * 2
    const thirdNewBid = ethers.utils.parseEther(thirdEtherBid.toString());
    await this.dPAuction.connect(this.user2).bid({value: thirdNewBid});

    const newPending = await this.dPAuction.pendingWithdrawals(this.user2.address);

    await expect(newPending.toString()).to.equal('0');
  });
  

  it("Should add funds to pendingWithdrawals", async function () {
    await this.dPAuction.startAuction();

    // First bid
    const etherBid = this.minBidEth * 2
    const newBid = ethers.utils.parseEther(etherBid.toString());
    await this.dPAuction.connect(this.user2).bid({value: newBid});

    // Second Bid
    const secondEtherBid = etherBid * 2
    const secondNewBid = ethers.utils.parseEther(secondEtherBid.toString());
    await this.dPAuction.bid({value: secondNewBid});

    await expect(await this.dPAuction.pendingWithdrawals(this.user2.address)).to.equal(newBid);
  });

  it("Should withdraw funds from pendingWithdrawals", async function () {
    await this.dPAuction.startAuction();

    // First bid
    const etherBid = this.minBidEth * 10
    const newBid = ethers.utils.parseEther(etherBid.toString());
    await this.dPAuction.connect(this.user2).bid({value: newBid});

    // Second Bid
    const secondEtherBid = etherBid * 10
    const secondNewBid = ethers.utils.parseEther(secondEtherBid.toString());
    await this.dPAuction.bid({value: secondNewBid});

    // Withdraw
    const balanceBefore = await this.provider.getBalance(this.user2.address);
    const balanceBeforeEth = parseInt(ethers.utils.formatEther(balanceBefore.toString()))

    const tx = await this.dPAuction.connect(this.user2).withdraw();

    const balanceAfter = await this.provider.getBalance(this.user2.address);
    const balanceAfterEth = parseInt(ethers.utils.formatEther(balanceAfter.toString()))

    const balanceDiff = balanceAfterEth - balanceBeforeEth

    await expect(balanceDiff).to.equal(etherBid);
  });

  it("Should set pendingWithdrawals to 0 after withdraw", async function () {
    await this.dPAuction.startAuction();

    // First bid
    const etherBid = this.minBidEth * 2
    const newBid = ethers.utils.parseEther(etherBid.toString());
    await this.dPAuction.connect(this.user2).bid({value: newBid});

    // Second Bid
    const secondEtherBid = etherBid * 2
    const secondNewBid = ethers.utils.parseEther(secondEtherBid.toString());
    await this.dPAuction.bid({value: secondNewBid});

    // Withdraw
    await this.dPAuction.connect(this.user2).withdraw();

    const newPending = await this.dPAuction.pendingWithdrawals(this.user2.address);

    await expect(newPending.toString()).to.equal('0');
  });

  it("Should emit Withdraw event", async function () {
    await this.dPAuction.startAuction();

    // First bid
    const etherBid = this.minBidEth * 2
    const newBid = ethers.utils.parseEther(etherBid.toString());
    await this.dPAuction.connect(this.user2).bid({value: newBid});

    // Second Bid
    const secondEtherBid = etherBid * 2
    const secondNewBid = ethers.utils.parseEther(secondEtherBid.toString());
    await this.dPAuction.bid({value: secondNewBid});

    // Withdraw
    await expect(this.dPAuction.connect(this.user2).withdraw())
      .to.emit(this.dPAuction, "Withdraw")
      .withArgs(
        this.user2.address,
        newBid
      );
  });

  // Auction Not Ended - Failed

  it("Should fail when bid is less than minimum", async function () {
    await this.dPAuction.startAuction();
    await expect(this.dPAuction.bid({value: 0})).to.be.revertedWith('Amount is less than minimum bid');
  });

  it("Should fail when bid is less than maxBid using pending withdrawal", async function () {
    await this.dPAuction.startAuction();

    // First bid
    const etherBid = this.minBidEth * 2
    const newBid = ethers.utils.parseEther(etherBid.toString());
    await this.dPAuction.connect(this.user2).bid({value: newBid});

    // Second Bid
    const secondEtherBid = etherBid * 2
    const secondNewBid = ethers.utils.parseEther(secondEtherBid.toString());
    await this.dPAuction.bid({value: secondNewBid});

    // Third Bid
    await expect(this.dPAuction.connect(this.user2).bid({value: newBid})).to.be.revertedWith('Amount is not greater than max bid plus percentage');
  });

  it("Should fail minting when auction not ended", async function () {
    await this.dPAuction.startAuction();
    await expect(this.dPAuction.mint()).to.be.revertedWith('Auction has not ended');
  });

  it("Should fail when recovering funds and auction not ended", async function () {
    await this.dPAuction.startAuction();
    await expect(this.dPAuction.recoverFunds()).to.be.revertedWith('Auction has not ended');
  });

  it("Should fail when biding same bid amount", async function () {
    await this.dPAuction.startAuction();

    // First bid
    const etherBid = this.minBidEth * 2
    const newBid = ethers.utils.parseEther(etherBid.toString());
    await this.dPAuction.connect(this.user2).bid({value: newBid});

    await expect(this.dPAuction.bid({value: newBid})).to.be.revertedWith('Amount is not greater than max bid plus percentage');
  });

  it("Should fail when bidding less than max bid", async function () {
    await this.dPAuction.startAuction();

    // First bid
    const etherBid = this.minBidEth * 2
    const newBid = ethers.utils.parseEther(etherBid.toString());
    await this.dPAuction.connect(this.user2).bid({value: newBid});

    // Second Bid
    const secondEtherBid = this.minBidEth * 1.5
    const secondBid = ethers.utils.parseEther(secondEtherBid.toString());

    await expect(this.dPAuction.bid({value: secondBid})).to.be.revertedWith(
      'reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)');
  });

  it("Should fail when biding more than maxBid but less than percentage", async function () {
    await this.dPAuction.startAuction();

    // First bid
    const etherBid = this.minBidEth * 2
    const newBid = ethers.utils.parseEther(etherBid.toString());
    await this.dPAuction.connect(this.user2).bid({value: newBid});

    // Second Bid
    const secondEtherBid = etherBid * 1.03
    const secondNewBid = ethers.utils.parseEther(secondEtherBid.toString());

    await expect(this.dPAuction.bid({value: secondNewBid})).to.be.revertedWith('Amount is not greater than max bid plus percentage');
  });

  // Auction Ended - Success

  // it("Should allow the winner to mint", async function () {
  //   await this.dPAuction.startAuction();
  //   await this.dPAuction.mint()
  //   await expect(await this.dPAuction.balanceOf(this.user1.address)).to.equal(1);
  // });

  // it("Should mint with correct tokenURI", async function () {
  //   await this.dPAuction.startAuction();
  //   await this.dPAuction.mint()
  //   await expect(await this.dPAuction.tokenURI(1)).to.equal(this.tokenURI);
  // });

  // it("Should set minted to true after mint", async function () {
  //   await this.dPAuction.startAuction();
  //   await this.dPAuction.mint()
  //   await expect(await this.dPAuction.minted()).to.equal(true);
  // });

  // // Auction Ended - Failed

  // it("Should fail when bidding and auction is ended", async function () {
  //   await this.dPAuction.startAuction();
  //   await expect(this.dPAuction.bid({value: 0})).to.be.revertedWith('Auction has ended');
  // });

  // it("Should fail minting and not winner", async function () {
  //   await this.dPAuction.startAuction();
  //   await expect(this.dPAuction.connect(this.user2).mint()).to.be.revertedWith('Minter is not the winner');
  // });

  // it("Should fail when minting twice", async function () {
  //   await this.dPAuction.startAuction();
  //   await this.dPAuction.mint();
  //   await expect(this.dPAuction.mint()).to.be.revertedWith('ERC721: token already minted');
  // });

  // it("Should fail when recovering funds and sender not owner", async function () {
  //   await this.dPAuction.startAuction();
  //   await expect(this.dPAuction.connect(this.user2).recoverFunds()).to.be.revertedWith('Ownable: caller is not the owner');
  // });

  // // Auction Ended + No restriction in Bid - Success

  // it("Should recover funds correcty", async function () {
  //   // Bid
  //   await this.dPAuction.startAuction();
  //   const etherBid = this.minBidEth * 10
  //   const newBid = ethers.utils.parseEther(etherBid.toString());
  //   await this.dPAuction.connect(this.user2).bid({value: newBid});

  //   // Recover
  //   const balanceBefore = await this.provider.getBalance(this.user1.address);
  //   const balanceBeforeEth = parseInt(ethers.utils.formatEther(balanceBefore.toString()))

  //   const tx = await this.dPAuction.recoverFunds();
  //   const balanceAfter = await this.provider.getBalance(this.user1.address);
  //   const balanceAfterEth = parseInt(ethers.utils.formatEther(balanceAfter.toString()))

  //   const balanceDiff = balanceAfterEth - balanceBeforeEth;

  //   await expect(balanceDiff).to.equal(etherBid);
  // });

  // it("Should set recoveredFunds to true", async function () {
  //   // Bid
  //   await this.dPAuction.startAuction();
  //   const etherBid = this.minBidEth * 2
  //   const newBid = ethers.utils.parseEther(etherBid.toString());
  //   await this.dPAuction.connect(this.user2).bid({value: newBid});
  //   // Recover
  //   await this.dPAuction.recoverFunds();
  //   await expect(await this.dPAuction.fundsRecovered()).to.equal(true);
  // });

  // // Auction Ended + No restriction in Bid - Failed
  
  // it("Should fail when recovering funds twice", async function () {
  //   // Bid
  //   await this.dPAuction.startAuction();
  //   const etherBid = this.minBidEth * 2
  //   const newBid = ethers.utils.parseEther(etherBid.toString());
  //   await this.dPAuction.connect(this.user2).bid({value: newBid});
  //   // Recover
  //   await this.dPAuction.recoverFunds();
  //   await expect(this.dPAuction.recoverFunds()).to.be.revertedWith('Already recovered');
  // });

});