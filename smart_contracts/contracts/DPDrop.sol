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

    uint256 public immutable REVEAL_DATE;

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

    /**
     * @param admin Address granted DEFAULT_ADMIN_ROLE (setBaseURI, reveal,
     *        recoverFunds). Must be supplied explicitly so admin control is
     *        never silently handed to a hardcoded/known account.
     * @param revealDate Unix timestamp before which {reveal} cannot run. Must
     *        be in the future so the reveal cannot fire instantly.
     */
    constructor(
        string memory name,
        string memory symbol,
        string memory initialBaseURI,
        address admin,
        uint256 revealDate
    ) ERC721(name, symbol) {
        require(admin != address(0), "Admin is the zero address");
        require(revealDate > block.timestamp, "Reveal date must be in future");

        baseURI = initialBaseURI;
        REVEAL_DATE = revealDate;

        _setupRole(DEFAULT_ADMIN_ROLE, admin);
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

    /**
     * @dev Computes the metadata shuffle offset.
     *
     * SECURITY WARNING: `shuffleOffset` is derived from `lastBlockHash`, which
     * is built in {randomMint} from `block.difficulty` and `block.timestamp`.
     * Both inputs are predictable and miner/validator-manipulable, so the
     * resulting offset can be computed or influenced in advance. This is NOT
     * secure randomness and MUST NOT be relied upon in production. A verifiable
     * source such as Chainlink VRF is required for a fair random drop. See the
     * "Security limitations" section of the README.
     */
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

        // SECURITY WARNING: predictable, miner/validator-manipulable seed.
        // Not secure randomness — see {reveal} and the README. Replace with
        // Chainlink VRF before any production use.
        lastBlockHash = uint256(
            keccak256(abi.encodePacked(block.difficulty, block.timestamp))
        );
    }

    function knownMint(address to, uint256 tokenId) public payable virtual {
        require(saleStarted, "Sale not started");
        require(knownMintsRemaining() > 0, "Sale limit reached");
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
