# dp_NFT_drop

Smart contracts for three styles of NFT drop — **regular/fixed-ID**, **random**, and **auctioned** — built with Hardhat, OpenZeppelin and Waffle.

> ⚠️ **Educational / unaudited.** These contracts have not been audited, and the "random" drop is **not** cryptographically secure (the on-chain randomness is predictable and manipulable). Do **not** use them in production as-is — see the Security limitations section in the project README.

## Project layout

All the code lives in [`smart_contracts/`](./smart_contracts):

- `smart_contracts/contracts/` — `DPDrop` (random + fixed-ID mint) and `DPAuction` (1-of-1 auction)
- `smart_contracts/test/` — Hardhat + Waffle tests
- `smart_contracts/scripts/` — deployment scripts

## Quick start

```bash
cd smart_contracts
npm install
npx hardhat compile
npx hardhat test
```

See **[`smart_contracts/README.md`](./smart_contracts/README.md)** for full documentation: the three drop types, environment setup, deployment, and the security limitations (including why the random drop needs Chainlink VRF before any real use).

## License

[MIT](./smart_contracts/LICENSE)
