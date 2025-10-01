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

## Price Functions API

The app provides several price fetching mechanisms to get token prices from different sources:

### 1. Uniswap V3 Oracle Prices

- **`api.quote.getMostLiquidPoolPrice`**: Gets exchange rate between any two tokens using Uniswap V3
  - Parameters: `tokenA`, `tokenB`, `decimalsA`, `decimalsB`
  - Returns: Object with `price` (how many tokenB per 1 tokenA), `liquidity`, `poolAddress`, `fee`
  - Finds the most liquid pool across fee tiers (0.05%, 0.3%, 1%)
  - This is the same oracle the smart contracts use, ensuring price consistency

### 2. USD Price Functions

- **`api.price.getSirPriceInUsd`**: Gets SIR token price in USD
  - Combines Uniswap V3 price (SIR/WETH or SIR/WHYPE) with wrapped token USD price
  - Cached for 1 minute to reduce API calls

- **`api.price.getTokenPrice`**: Alchemy-based price fetching (Ethereum chains)
  - Parameters: `contractAddress`, `chain`
  - Returns token prices from Alchemy's pricing API
  - Used for Ethereum mainnet and Sepolia testnet

- **`api.price.getCoinGeckoPrice`**: CoinGecko API integration (HyperEVM chains)
  - Parameters: `platformId`, `contractAddress`
  - Returns USD price from CoinGecko
  - Used for HyperEVM mainnet and testnet
  - Cached for 1 minute

- **`api.price.getTokenPriceWithFallback`**: Comprehensive price fetching with multi-tier fallback
  - Parameters: `tokenAddress`, `tokenDecimals` (default 18)
  - Tries external APIs first (Alchemy for Ethereum, CoinGecko for HyperEVM)
  - Falls back to Uniswap V3 WETH pairs if external API fails
  - Falls back to USDC pairs if WETH pair not available
  - Returns USD price or null if no price source available
  - Cached for 1 minute to reduce API calls
  - Used automatically by `useTokenUsdPrice` hook when primary sources fail

### 3. Helper Hooks

- **`useTeaAndApePrice`**: React hook for getting position value in USD
  - Takes collateral amount from `quoteBurn`
  - Automatically selects the right price source based on chain and token
  - Returns USD value of the position

- **`useTokenUsdPrice`**: React hook for displaying USD values in forms and UI
  - Parameters: `tokenAddress`, `amount`, `decimals`
  - Automatically selects between Alchemy (Ethereum chains) and CoinGecko (HyperEVM chains)
  - Returns: `{ usdValue, isLoading, pricePerToken }`
  - Used in deposit forms to show real-time USD values

### 4. Vault-Specific Functions

- **`api.vault.quoteBurn`**: Gets collateral amount for burning APE/TEA tokens
  - Parameters: `amount`, `isApe`, `debtToken`, `collateralToken`, `leverageTier`, `decimals`
  - Returns the amount of collateral tokens you'd receive
  - This is the "current value" of a position in collateral terms

### Important Vault Concepts

**Vault TVL (Total Value Locked)**:
- Vaults ONLY hold collateral tokens (e.g., WETH, USDC)
- TVL = total amount of collateral tokens in the vault
- TVL in USD = collateral amount × collateral token USD price

**Debt Tokens**:
- Debt tokens are NOT held in vaults - they're just accounting units
- Used to track how much was borrowed by APE holders
- Used to calculate how to split vault collateral between APE and TEA holders
- The debt token determines what currency APE holders borrowed in (for P&L calculations)

### Usage Notes

- **For PnL calculations**: Use `quoteBurn` for current collateral amount, compare with `row.collateralTotal` from subgraph
- **For debt token PnL**: Use `getMostLiquidPoolPrice` to get current exchange rate and convert collateral to debt token terms
- **For USD values**: Use appropriate price function based on chain (Alchemy for Ethereum, CoinGecko for HyperEVM)
- All price functions include caching to minimize external API calls

## UI Component Guidelines

### Tooltip Component Usage

The app uses a consistent `ToolTip` component throughout. Important implementation notes:

**Component Pattern:**
```tsx
<ToolTip iconSize={16} size="300">
  Content here
</ToolTip>
```

**Key Lessons Learned:**
1. **Always use the existing ToolTip component** - Don't create custom tooltip implementations
2. **Portal rendering is critical** - The HoverCard component must use `HoverCardPrimitive.Portal` to render tooltips outside the DOM hierarchy, preventing parent styles from affecting tooltip appearance
3. **Z-index must be high** - Use `z-[9999]` to ensure tooltips appear above all other elements
4. **Consistent styling** - All tooltips should have the same background (`bg-black/90 dark:bg-white/90`), text color (`text-white dark:text-black`), and border styling
5. **Icon sizing** - Match icon size to surrounding text (e.g., `iconSize={16}` for normal text, `iconSize={14}` for smaller text)
6. **Content formatting** - For longer explanations, wrap in a div with `space-y-1.5` for proper paragraph spacing
7. **Width control** - Use `size="300"` for wider content, `size="250"` (default) for medium, `size="200"` for narrow

**Common Issues and Fixes:**
- **Transparent/affected backgrounds**: Ensure HoverCard uses Portal rendering
- **Text appears as wall of text**: Use div wrappers with proper spacing classes
- **Icon too small/large**: Adjust iconSize to match surrounding text size

### Theme-Based Image Switching

The app uses CSS-based image switching for instant theme transitions without loading lag:

**Implementation Pattern:**
```tsx
{/* CSS-based theme switching: Both images loaded, visibility controlled by CSS */}
<>
  {/* Dark mode image - visible only in dark mode */}
  <Image
    src="/image_dark.png"
    alt="Description"
    width={200}
    height={200}
    className="hidden dark:block"
  />
  {/* Light mode image - visible only in light mode */}
  <Image
    src="/image_light.png"
    alt="Description"
    width={200}
    height={200}
    className="block dark:hidden"
  />
</>
```

**Key Benefits:**
1. **Zero lag** - Both images preload on mount, switching is instant
2. **No flicker** - CSS classes toggle visibility immediately
3. **Better UX** - Smooth theme transitions without image loading delays
4. **Simple maintenance** - No JavaScript theme detection needed

**Important Notes:**
- Always load both images in the DOM
- Use Tailwind's `dark:` variant for theme-specific visibility
- Apply same positioning/sizing to both images
- Always use Next.js `Image` component instead of regular `<img>` tags for better performance
- This pattern is used for all theme-dependent images in the app

**Current Theme-Based Images:**
1. **Leverage Page** (`/leverage`):
   - Monkey images: `/Monkey_drinking_whiskey.png` (dark) and `/Monkey_drinking_whiskey_white.png` (light)
   - Position:
     - Desktop (lg screens): Top-right corner of the vault table card
     - Mobile (< lg screens): Top-right corner of the minting form card

2. **Liquidity Page** (`/liquidity`):
   - Gorilla images: `/Gorilla_drinking_tea.png` (dark) and `/Gorilla_drinking_tea_white.png` (light)
   - Position:
     - Desktop (lg screens): Top-right corner of the vault table card
     - Mobile (< lg screens): Top-right corner of the minting form card

3. **Stake Page** (`/stake`):
   - Frog images: `/Frog_blue.jpg` (dark) and `/Frog_beige.jpg` (light)
   - Position: Bottom-right corner of the claimable rewards card (only visible when no contributor rewards)

**Responsive Positioning Strategy:**
For the monkey and gorilla images on leverage/liquidity pages:
- **Desktop (lg breakpoint)**: Images appear on the "Popular Vaults" card to avoid overlapping form content
- **Mobile (< lg breakpoint)**: Images move to the minting form card since the layout stacks vertically
- This ensures images are always visible and never overlap important content
- Both sets of images (for each position) are loaded in their respective components

**Why This Pattern:**
- Eliminates theme switching lag - both images preload, only CSS visibility changes
- No JavaScript theme detection needed - pure CSS solution
- Prevents image flicker during theme transitions
- Better performance than conditional rendering with JavaScript
- Responsive positioning ensures optimal layout on all screen sizes
