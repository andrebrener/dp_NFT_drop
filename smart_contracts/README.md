# DP Drop

Hardhat ERC-721 contracts for three styles of NFT drop. Built with OpenZeppelin
and tested with Hardhat + Waffle.

> ⚠️ **Educational / unaudited.** These contracts have not been audited and the
> "random" drop is **not** cryptographically secure (see
> [Security limitations](#security-limitations)). Do **not** use them in
> production as-is.

## Contracts

| Contract | What it does |
|---|---|
| **`DPDrop`** | An ERC-721 collection with two mint paths: a **random** mint (sequential token IDs `1..RANDOM_TOKEN_LIMIT`, with a post-sale metadata "reveal"/shuffle) and a **known** mint where the buyer picks a specific fixed token ID from a reserved range. Uses `AccessControl` (a `DEFAULT_ADMIN_ROLE` set in the constructor, plus a `STARTER_ROLE` that starts the sale). |
| **`DPAuction`** | A single 1-of-1 auction. Bidders call `bid()`; outbid bidders' funds move to `pendingWithdrawals` (pull-payment, guarded by `ReentrancyGuard`). After the auction `DURATION` passes, the highest bidder can `mint()` the NFT and the owner can `recoverFunds()`. |

The three drop "types" are therefore: **random** (`DPDrop.randomMint`),
**fixed-ID / known** (`DPDrop.knownMint`), and **auction** (`DPAuction`).

## Requirements

- Node.js 16+
- npm

## Install

```bash
npm install
```

## Compile

```bash
npm run compile
# or: npx hardhat compile
```

## Test

```bash
npm test
# or: npx hardhat test
```

## Environment

Copy `.env.example` to `.env` and fill in the values you need (only required for
deploying to a live network — local compile/test works without it):

```
ALCHEMY_API_KEY=
DEPLOYER_MNEMONIC=
ETHERSCAN_API_KEY=
COIN_MARKET_CAP_KEY=
```

`.env` is git-ignored and must never be committed.

## Deploy

`scripts/deploy.js` deploys both contracts. Note that `DPDrop`'s constructor now
requires an explicit `admin` address and a future `revealDate` (Unix timestamp):

```bash
# Local node
npx hardhat run scripts/deploy.js

# A configured network (requires .env)
npx hardhat run scripts/deploy.js --network ropsten
```

## Security limitations

These contracts are provided for educational purposes and have **not** been
audited. Known limitations:

- **The on-chain randomness is insecure and manipulable.** In `DPDrop`,
  `reveal()` derives the metadata `shuffleOffset` from `lastBlockHash`, which is
  computed in `randomMint()` as
  `keccak256(block.difficulty, block.timestamp)`. Both inputs are predictable
  and can be influenced by the block proposer (miner/validator), so the "random"
  reveal offset can be **computed or biased in advance**. This defeats the
  purpose of a fair random drop. A production system **must** use a verifiable
  randomness source such as **[Chainlink VRF](https://docs.chain.link/vrf)**.
  VRF integration is intentionally **out of scope** for this repo and is **not**
  included here.
- The `DPDrop` admin role grants control over `setBaseURI`, `reveal`, and
  `recoverFunds`. Set it to a trusted address (ideally a multisig).
- In `DPAuction`, funds owed to outbid bidders remain in `pendingWithdrawals`
  until each bidder calls `withdraw()` — there is no admin sweep of unclaimed
  balances.

## License

[MIT](./LICENSE)
