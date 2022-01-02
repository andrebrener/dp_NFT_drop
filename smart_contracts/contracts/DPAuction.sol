// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract DPAuction is
    Ownable,
    ERC721,
    ERC721URIStorage,
    ERC721Burnable,
    ReentrancyGuard
{
    using Address for address payable;

    string private _tokenURI;

    uint256 public MIN_BID_DIFF_PERC = 5;
    uint256 public MINIMUM_BID = 0.2 ether;

    uint256 public maxBid;
    address public maxBidder;

    bool public fundsRecovered = false;

    // Withdraw
    mapping(address => uint256) public pendingWithdrawals;

    // Auction data
    bool public auctionStarted = false;
    uint256 public startAuctionTime;
    // uint256 public DURATION = 0;
    uint256 public DURATION = 7 minutes;

    // Events
    event AuctionBegins();
    event BidEntered(address indexed account, uint256 amount);
    event Withdraw(address indexed account, uint256 amount);

    constructor(
        string memory name,
        string memory symbol,
        string memory initialTokenURI
    ) ERC721(name, symbol) {
        _tokenURI = initialTokenURI;
        maxBidder = msg.sender;
    }

    function _startAuction() internal {
        require(!auctionStarted, "Auction already started");
        auctionStarted = true;
        startAuctionTime = block.timestamp;
    }

    function startAuction() external onlyOwner {
        _startAuction();
        emit AuctionBegins();
    }

    function finishTime() public view returns (uint256) {
        return startAuctionTime + DURATION;
    }

    function minExtraBid() public view returns (uint256) {
        return (maxBid * MIN_BID_DIFF_PERC) / 100;
    }

    function bid() external payable {
        require(auctionStarted, "Auction not started");
        require(block.timestamp < finishTime(), "Auction has ended");

        address bidder = msg.sender;
        uint256 bidAmount = msg.value + pendingWithdrawals[bidder];

        require(bidAmount >= MINIMUM_BID, "Amount is less than minimum bid");

        // If bidAmount - maxBid < 0 it reverts because of underflow
        require(
            bidAmount - maxBid >= minExtraBid(),
            "Amount is not greater than max bid plus percentage"
        );

        // Set bidder pendingWithdawals to zero
        pendingWithdrawals[bidder] = 0;

        // Add withdraw funds to previous max bidder
        pendingWithdrawals[maxBidder] = pendingWithdrawals[maxBidder] + maxBid;

        // Set new maximum bid
        maxBid = bidAmount;
        maxBidder = bidder;

        emit BidEntered(bidder, bidAmount);
    }

    // Withdraw funds
    function withdraw() external nonReentrant {
        address receiver = msg.sender;

        uint256 amount = pendingWithdrawals[receiver];
        payable(receiver).sendValue(amount);

        emit Withdraw(receiver, amount);

        pendingWithdrawals[receiver] = 0;
    }

    function recoverFunds() public onlyOwner nonReentrant {
        require(block.timestamp > finishTime(), "Auction has not ended");
        require(!fundsRecovered, "Already recovered");
        // Tranfer the maximum bid to owner
        payable(owner()).sendValue(maxBid);
        fundsRecovered = true;
    }

    /**
     * @dev Mints the token for the winner of the auction
     *
     * See {ERC721-_mint}.
     */
    function mint() public virtual {
        address sender = msg.sender;
        require(auctionStarted, "Auction not started");
        require(block.timestamp > finishTime(), "Auction has not ended");
        require(sender == maxBidder, "Minter is not the winner");
        _safeMint(sender, 1);
        _setTokenURI(1, _tokenURI);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
