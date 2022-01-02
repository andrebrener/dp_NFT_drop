// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract DPDrop is AccessControl, ERC721, ERC721Burnable {
    using Counters for Counters.Counter;
    using Address for address payable;

    string public PROVENANCE_HASH = "";

    bytes32 public constant STARTER_ROLE = keccak256("STARTER_ROLE");

    string public baseURI;

    uint256 public constant RANDOM_TOKEN_LIMIT = 5000;
    uint256 public constant RANDOM_MINT_PRICE = 0.2 ether;
    uint256 public constant MAX_MINTS_PER_TX = 10;
    uint256 public constant KNOWN_TOKEN_LIMIT = 10;
    uint256 public constant KNOWN_MINT_PRICE = 0.2 ether;

    uint256 public REVEAL_DATE = 0;
    // uint256 public REVEAL_DATE = 1646103600;

    bool public shuffled = false;
    uint256 public shuffleOffset = 0;
    uint256 public lastBlockHash = 0;

    Counters.Counter private _knownNumTokens;
    Counters.Counter private _randomNumTokens;

    bool public baseTokenURIFreezed = false;

    // Public sale
    bool public saleStarted = false;

    // Event
    event SaleBegins();

    constructor(
        string memory name,
        string memory symbol,
        string memory initialBaseURI
    ) ERC721(name, symbol) {
        baseURI = initialBaseURI;

        _setupRole(
            DEFAULT_ADMIN_ROLE,
            0x90F79bf6EB2c4f870365E785982E1f101E93b906
        );
        _setupRole(STARTER_ROLE, _msgSender());
    }

    function randomTokensMinted() public view virtual returns (uint256) {
        return _randomNumTokens.current();
    }

    function randomMintsRemaining() public view returns (uint256) {
        return RANDOM_TOKEN_LIMIT - _randomNumTokens.current();
    }

    function knownTokensMinted() public view virtual returns (uint256) {
        return _knownNumTokens.current();
    }

    function nextRandomTokenId() public view virtual returns (uint256) {
        return randomTokensMinted() + 1;
    }

    function knownMintsRemaining() public view returns (uint256) {
        return KNOWN_TOKEN_LIMIT - _knownNumTokens.current();
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function _setBaseURI(string memory newBaseURI) internal {
        require(!baseTokenURIFreezed, "BaseURI is frozen");
        baseURI = newBaseURI;
        baseTokenURIFreezed = true;
    }

    function setBaseURI(string memory newBaseURI)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _setBaseURI(newBaseURI);
    }

    function startSale() external onlyRole(STARTER_ROLE) {
        require(!saleStarted, "Sale already started");
        saleStarted = true;
        emit SaleBegins();
    }

    function reveal() public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(block.timestamp > REVEAL_DATE, "Reveal not started");
        require(!shuffled, "Already shuffled");
        shuffled = true;
        shuffleOffset = lastBlockHash % RANDOM_TOKEN_LIMIT;
    }

    function randomMint(address to, uint256 amount) public payable virtual {
        require(saleStarted, "Sale not started");
        require(amount <= MAX_MINTS_PER_TX, "Amount is over the limit per tx");
        require(randomMintsRemaining() >= amount, "Sale limit reached");
        uint256 totalSale = RANDOM_MINT_PRICE * amount;
        require(msg.value >= totalSale, "Insufficient funds");

        for (uint256 i = 0; i < amount; i++) {
            _safeMint(to, nextRandomTokenId());
            _randomNumTokens.increment();
        }

        lastBlockHash = uint256(
            keccak256(abi.encodePacked(block.difficulty, block.timestamp))
        );
    }

    function knownMint(address to, uint256 tokenId) public payable virtual {
        require(saleStarted, "Sale not started");
        require(
            tokenId > RANDOM_TOKEN_LIMIT,
            "Selected Token Id is for random mint"
        );
        require(
            tokenId <= RANDOM_TOKEN_LIMIT + KNOWN_TOKEN_LIMIT,
            "Selected Token Id is over the limit"
        );
        require(msg.value >= KNOWN_MINT_PRICE, "Insufficient funds");

        _safeMint(to, tokenId);
        _knownNumTokens.increment();
    }

    function recoverFunds() public onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(msg.sender).sendValue(address(this).balance);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
