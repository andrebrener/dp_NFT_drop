const { expect } = require("chai");

describe("DPDrop", function () {
  beforeEach(async function () {
    [this.user1, this.user2, this.user3, this.admin] = await hre.ethers.getSigners();
    this.provider = hre.ethers.provider;
    this.baseURI = "baseURI";
    this.name = "DPDrop";
    this.symbol = "DPD";

    this.DPDrop = await hre.ethers.getContractFactory("DPDrop");
    this.dPDrop = await this.DPDrop.deploy(this.name, this.symbol, this.baseURI);
    await this.dPDrop.deployed();
    this.randomTokenLimit = await this.dPDrop.RANDOM_TOKEN_LIMIT();
    this.knownTokenLimit = await this.dPDrop.KNOWN_TOKEN_LIMIT();

    this.randomMintPrice = await this.dPDrop.RANDOM_MINT_PRICE();
    this.knownMintPrice = await this.dPDrop.KNOWN_MINT_PRICE();
    this.maxMintsPerTx = await this.dPDrop.MAX_MINTS_PER_TX();

    this.randomMintPriceEth = ethers.utils.formatEther(this.randomMintPrice);
    this.knownMintPriceEth = ethers.utils.formatEther(this.knownMintPrice);
  });
;

// BASE URI

  it("Should change baseURI", async function () {
    const newBaseURI = "newBaseURI"
    await this.dPDrop.connect(this.admin).setBaseURI(newBaseURI);
    expect(await this.dPDrop.baseURI()).to.equal(newBaseURI);
  });

  it("Should freeze baseURI after changing", async function () {
    const newBaseURI = "newBaseURI"
    await this.dPDrop.connect(this.admin).setBaseURI(newBaseURI);
    expect(await this.dPDrop.baseTokenURIFreezed()).to.equal(true);
  });

  it("Should fail when changing baseURI and not admin", async function () {
    await expect(this.dPDrop.connect(this.user2).setBaseURI("")).to.be.reverted;
  });

  it("Should fail when changing baseURI if frozen", async function () {
    await this.dPDrop.connect(this.admin).setBaseURI("");
    await expect(this.dPDrop.connect(this.admin).setBaseURI("")).to.be.revertedWith('BaseURI is frozen');
  });

  // START SALE

  it("Should start sale", async function () {
    await this.dPDrop.startSale();
    expect(await this.dPDrop.saleStarted()).to.equal(true);
  });

  it("Should emit event sale started", async function () {
    await expect(this.dPDrop.startSale()).to.emit(this.dPDrop, "SaleBegins");
  });

  it("Should fail when starter has no starter role", async function () {
    await expect(this.dPDrop.connect(this.user2).startSale()).to.be.reverted;
  });

  it("Should fail when start sale if sale is already started", async function () {
    await this.dPDrop.startSale();
    await expect(this.dPDrop.startSale()).to.be.revertedWith('Sale already started');
  });

  // RANDOM MINT

  it("Should add to random tokens minted after minting", async function () {
    await this.dPDrop.startSale(); 
    await this.dPDrop.randomMint(this.user1.address, 1, {value: this.randomMintPrice})

    const numTokens = await this.dPDrop.randomTokensMinted()

    await expect(numTokens.toNumber()).to.equal(1);
  });

  it("Should substract from random mints remaining after minting", async function () {
    await this.dPDrop.startSale(); 
    await this.dPDrop.randomMint(this.user1.address, 1, {value: this.randomMintPrice})

    const mintsRemaining = await this.dPDrop.randomMintsRemaining()

    await expect(mintsRemaining.toNumber()).to.equal(this.randomTokenLimit.toNumber() - 1);
  });

  it("Should get next random tokenId correctly", async function () {
    await this.dPDrop.startSale(); 
    await this.dPDrop.randomMint(this.user1.address, 1, {value: this.randomMintPrice})

    const nextTokenId = await this.dPDrop.nextRandomTokenId()

    await expect(nextTokenId.toNumber()).to.equal(2);
  });

  it("Should random mint first token with tokenId = 1", async function () {
    await this.dPDrop.startSale(); 
    await expect(this.dPDrop.randomMint(this.user1.address, 1, {value: this.randomMintPrice}))
      .to.emit(this.dPDrop, "Transfer")
      .withArgs(
        ethers.constants.AddressZero,
        this.user1.address,
        1
      );
  });

  it("Should fail when random mint and sale is not started", async function () {
    await expect(this.dPDrop.randomMint(this.user1.address, 1, {value: 0})).to.be.revertedWith('Sale not started');
  });

  it("Should fail when random mint has insufficient funds", async function () {
    await this.dPDrop.startSale();
    await expect(this.dPDrop.randomMint(this.user1.address, 1, {value: 0})).to.be.revertedWith('Insufficient funds');
  });

  it("Should fail when amount is greater than limit in random mints", async function () {
    await this.dPDrop.startSale();
    const amount = this.maxMintsPerTx.toNumber() + 1    
    await expect(this.dPDrop.randomMint(this.user1.address, amount, {value: 0})).to.be.revertedWith('Amount is over the limit per tx');
  });

  // KNOWN MINT

  it("Should add to known tokens minted after minting", async function () {
    await this.dPDrop.startSale(); 
    const tokenId = this.randomTokenLimit.toNumber() + 1
    await this.dPDrop.knownMint(this.user1.address, tokenId, {value: this.knownMintPrice})

    const numTokens = await this.dPDrop.knownTokensMinted()

    await expect(numTokens.toNumber()).to.equal(1);
  });

  it("Should substract from known mints remaining after minting", async function () {
    await this.dPDrop.startSale(); 
    const tokenId = this.randomTokenLimit.toNumber() + 1
    await this.dPDrop.knownMint(this.user1.address, tokenId, {value: this.randomMintPrice})

    const mintsRemaining = await this.dPDrop.knownMintsRemaining()

    await expect(mintsRemaining.toNumber()).to.equal(this.knownTokenLimit.toNumber() - 1);
  });

  it("Should known mint first token with correct tokenId for the first & last", async function () {
    await this.dPDrop.startSale(); 
    const tokenId = this.randomTokenLimit.toNumber() + 1;
    await expect(this.dPDrop.knownMint(this.user1.address, tokenId, {value: this.knownMintPrice}))
      .to.emit(this.dPDrop, "Transfer")
      .withArgs(
        ethers.constants.AddressZero,
        this.user1.address,
        tokenId
      );

      const lastTokenId = this.randomTokenLimit.toNumber() + this.knownTokenLimit.toNumber();
      await expect(this.dPDrop.knownMint(this.user1.address, lastTokenId, {value: this.knownMintPrice}))
        .to.emit(this.dPDrop, "Transfer")
        .withArgs(
          ethers.constants.AddressZero,
          this.user1.address,
          lastTokenId
        );
  });

  it("Should fail when known mint and sale is not started", async function () {
    await expect(this.dPDrop.knownMint(this.user1.address, 1, {value: 0})).to.be.revertedWith('Sale not started');
  });

  it("Should fail when known mint has insufficient funds", async function () {
    await this.dPDrop.startSale();
    const tokenId = this.randomTokenLimit.toNumber() + 1;
    await expect(this.dPDrop.knownMint(this.user1.address, tokenId, {value: 0})).to.be.revertedWith('Insufficient funds');
  });

  it("Should fail when known minting a tokenId that is a random mint", async function () {
    await this.dPDrop.startSale(); 
    await expect(this.dPDrop.knownMint(this.user1.address, 1, {value: 0})).to.be.revertedWith('Selected Token Id is for random mint');
  });

  it("Should fail when known minting a tokenId over the limit", async function () {
    await this.dPDrop.startSale(); 
    const tokenId = this.randomTokenLimit.toNumber() + this.knownTokenLimit.toNumber() + 1;
    await expect(this.dPDrop.knownMint(this.user1.address, tokenId, {value: 0})).to.be.revertedWith('Selected Token Id is over the limit');
  });

  // RECOVER FUNDS

  it("Should fail when recovering funds and sender not admin", async function () {
    await expect(this.dPDrop.connect(this.user2).recoverFunds()).to.be.reverted;
  });

  it("Should recover funds correcty", async function () {
    // Mint
    await this.dPDrop.startSale(); 
    const ethValue = this.randomMintPriceEth * 10
    const value = ethers.utils.parseEther(ethValue.toString());
    await this.dPDrop.randomMint(this.user1.address, 1, {value: value})

    // Recover
    const balanceBefore = await this.provider.getBalance(this.admin.address);
    const balanceBeforeEth = parseInt(ethers.utils.formatEther(balanceBefore.toString()));

    await this.dPDrop.connect(this.admin).recoverFunds();
    const balanceAfter = await this.provider.getBalance(this.admin.address);
    const balanceAfterEth = parseInt(ethers.utils.formatEther(balanceAfter.toString()))

    await expect(balanceAfterEth).to.be.greaterThan(balanceBeforeEth);
  });


  // Before Reveal date

  // it("Should fail when revealing before reveal date", async function () {
  //   await expect(this.dPDrop.connect(this.admin).reveal()).to.be.revertedWith('Reveal not started');
  // });

  // After reveal date

    it("Should fail when revealing twice", async function () {
      await this.dPDrop.connect(this.admin).reveal();
      await expect(this.dPDrop.connect(this.admin).reveal()).to.be.revertedWith('Already shuffled');
    });

    it("Should set shuffled to true after reveal", async function () {
      await this.dPDrop.connect(this.admin).reveal()
      expect(await this.dPDrop.shuffled()).to.equal(true);
    });

    it("Should fail if reveal is not admin", async function () {
      await expect(this.dPDrop.reveal()).to.be.reverted;
    });

  // Mock Token Limits

  // it("Should fail when there are no random mints available", async function () {
  //   await this.dPDrop.startSale();
  //   for (let i = 0; i < this.randomTokenLimit; i++) {
  //     await this.dPDrop.randomMint(this.user1.address, 1, {value: this.randomMintPrice});
  //   }
  //   await expect(this.dPDrop.randomMint(this.user1.address, 1, {value: this.randomMintPrice})).to.be.revertedWith('Sale limit reached');
  // });

  // it("Should fail when there are no known mints available", async function () {
  //   await this.dPDrop.startSale();
  //   for (let i = 0; i < this.knownTokenLimit; i++) {
  //     const tokenId = this.randomTokenLimit.toNumber() + i;
  //     await this.dPDrop.knownMint(this.user1.address, tokenId, {value: this.knownMintPrice});
  //   }
  //   await expect(this.dPDrop.knownMint(this.user1.address, {value: this.knownMintPrice})).to.be.revertedWith('Sale limit reached');
  // });
});