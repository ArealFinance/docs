# Areal Finance Documentation

Official documentation for [Areal Finance](https://areal.finance) — a full-stack onchain protocol for launching, owning, and participating in real-world assets on Solana.

## Structure

```
docs/
  get-started/        # Introduction
  areal/              # Problem, Solution, Vision
  architecture/       # Protocol architecture
  economics/          # Token economics (RWT, OT, ARL, Treasury)
  security/           # Legal architecture, risk disclosure, disclaimer
  contracts/          # Smart contract specifications
  bots/               # Off-chain service specifications
  changelog/          # Protocol changes and updates
  ru/                 # Russian translation (full mirror)
  images/             # Logos and favicons
  custom.css          # Custom theme styles
  docs.json           # Mintlify navigation config
```

## Architecture Pages

| Page | Description |
|------|-------------|
| [Overview](architecture/overview.mdx) | Three pillars of Areal — governance, liquidity, yield |
| [Governance & Futarchy](architecture/governance-and-futarchy.mdx) | Market-driven governance for RWA projects |
| [Liquidity & Native DEX](architecture/liquidity-and-native-dex.mdx) | Specialized AMM for yield-bearing tokens |
| [Liquidity Nexus (Layer 9)](architecture/layer9-liquidity-nexus.mdx) | Protocol-owned liquidity with atomic principal-floor accounting |
| [Layer 10 Bootstrap](architecture/layer10-bootstrap.mdx) | 8-phase devnet dress rehearsal of the mainnet bootstrap |
| [Yield & Reward Distribution](architecture/yield-and-reward-distribution.mdx) | Merkle-based per-second yield accrual |

## Smart Contracts

| Contract | Description |
|----------|-------------|
| [Ownership Token (OT)](contracts/ownership-token.mdx) | Per-project tokenized ownership with revenue collection |
| [RWT Engine](contracts/rwt-engine.mdx) | NAV-anchored yield aggregation token |
| [Yield Distribution](contracts/yield-distribution.mdx) | Merkle-based reward distribution with vesting |
| [Native DEX](contracts/native-dex.mdx) | AMM with standard curve and concentrated liquidity |
| [Futarchy](contracts/futarchy.mdx) | Market-driven governance for DAOs |

## Local Development

```bash
# Install Mintlify CLI
npm i -g mintlify

# Start local preview
mintlify dev
```

Preview available at `http://localhost:3000`.

## Languages

- **English** (default)
- **Russian** (`/ru/` prefix)

## License

[MIT](LICENSE)
