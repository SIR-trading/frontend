# Claude Development Guidelines

## App Overview

SIR is a DeFi protocol frontend for leveraged trading without liquidation risk. The app is built with Next.js 14, TypeScript, and integrates with blockchain networks (Ethereum mainnet and HyperEVM testnet).

### Core Architecture

- **Next.js App Router** with server components where possible
- **TRPC** for type-safe API communication with backend
- **Wagmi/Viem** for blockchain interactions
- **React Context** for global state management (reduces API calls)
- **Tailwind CSS** for styling with dark/light theme support

### Context Providers (Data Layer)

The app uses several React Context providers to efficiently share data and eliminate duplicate API calls:

1. **VaultDataContext**: Centralizes all vault data (fetches once, shares everywhere)
2. **StakingContext**: Manages staking-related data (balances, APR, TVL)
3. **ClaimableBalancesContext**: Tracks claimable dividends and rewards with notification thresholds
4. **TokenlistContextProvider**: Manages available tokens for trading
5. **VaultProvider**: Handles vault-specific operations

### Pages & Routes

#### Core Pages

- **`/` (Home)**: Shows the `/leverage` page by default - the main trading interface

- **`/leverage`**: Leverage trading interface where users can:

  - Browse all available leverage vaults
  - Filter by collateral token, debt token, or leverage tier
  - Mint new leveraged positions (borrow debt to buy more collateral)
  - View vault stats and available liquidity

- **`/liquidity`**: Liquidity provision interface where users can:

  - Provide liquidity to vaults and earn TEA tokens
  - Burn TEA tokens to withdraw liquidity
  - View vault APY, utilization rates, and TVL
  - Track liquidity provider rewards

- **`/portfolio`**: Personal dashboard showing:

  - APE tokens (leveraged positions representing borrowed funds)
  - TEA tokens (LP positions from providing liquidity to vaults)
  - User's active leveraged positions with P&L
  - Staking dashboard (stake/unstake SIR tokens)
  - Claimable rewards (contributor rewards, staking dividends)
  - Position performance metrics

- **`/stake`**: Dedicated staking page for SIR token holders:

  - Stake SIR to earn protocol fees
  - View staking APR and total value locked
  - Manage locked vs unlocked stakes

- **`/auction`**: Fee conversion auction system:

  - View ongoing auctions to convert protocol fees to dividends
  - Place bids to purchase accumulated protocol fees
  - Proceeds from auctions become dividends for SIR stakers
  - Track auction history and winning bids
  - Create new auctions for fees collected in different tokens

- **`/leaderboard`**: Competition and analytics:

  - Top performing traders by P&L
  - Historical performance tracking
  - Social sharing features

- **`/calculator`**: Position planning tool:
  - Simulate leverage positions before opening
  - Calculate potential returns and risks
  - Compare different leverage tiers
  - Estimate liquidation prices

### Key Features

- **Multi-chain support**:
  - Ethereum mainnet (chainId: 1)
  - Sepolia testnet (chainId: 11155111)
  - HyperEVM mainnet (chainId: 998)
  - HyperEVM testnet (chainId: 999)
- **Visual differentiation**: HyperEVM versions have distinct branding (gradient logos, different colors)
- **Notification system**: Golden dots for SIR rewards (≥100k), green dots for dividends (≥0.01 ETH/1 HYPE)
- **Real-time updates**: Live auction updates, position tracking

## Build Philosophy

When compiling the app and running build scripts, we avoid defensive programming:

- Let TypeScript compilation errors fail the build
- Don't suppress or work around build errors
- Scripts should fail immediately if something is wrong
- No fallback values or error suppression in build scripts
- Fix the root cause when compilation errors appear

This applies specifically to the build/compilation process and scripts. At runtime, the app can handle errors gracefully for better UX.
