# Claude Development Guidelines

## LP Staking Implementation

### Overview

The LP staking system allows users to stake Uniswap V3 LP NFT positions in the SIR/WETH 1% pool to earn SIR rewards. The implementation uses a single-transaction multicall pattern for efficiency.

### Key Components

1. **`LpStakingArea.tsx`**: Main component displaying LP positions

   - Shows unstaked positions, staked positions, and claimable rewards in separate cards
   - Each card has its own action button (Stake, Unstake, Claim)
   - Buttons remain visible but disabled when no applicable positions

2. **`useUserLpPositions.ts`**: Hook for fetching LP data

   - Fetches positions from both user wallet AND UniswapV3Staker contract
   - Filters for SIR/WETH 1% pool positions only
   - Detects if positions are in-range using current pool tick
   - Provides `refetchAll()` function for manual data refresh

3. **`LpStakeModal.tsx`**: Handles staking multiple positions

   - Uses multicall to batch approve + transfer operations
   - Encodes incentive key for automatic staking via `safeTransferFrom`
   - Single transaction for all positions

4. **`LpUnstakeModal.tsx`**: Handles unstaking multiple positions
   - Uses multicall to batch unstake + withdraw operations
   - Returns all NFTs to user wallet in one transaction

### Technical Patterns

#### Single-Transaction Multicall

```typescript
// Build array of encoded function calls
const calls: `0x${string}`[] = [];

// Add approval calls if needed
positions.forEach((position, index) => {
  if (needsApproval[index]) {
    calls.push(
      encodeFunctionData({
        abi: NonfungiblePositionManagerContract.abi,
        functionName: "approve",
        args: [stakingContract, tokenId],
      }),
    );
  }
});

// Add transfer calls for all positions
positions.forEach((position) => {
  calls.push(
    encodeFunctionData({
      abi: NonfungiblePositionManagerContract.abi,
      functionName: "safeTransferFrom",
      args: [from, to, tokenId, encodedIncentiveData],
    }),
  );
});

// Execute all in one transaction
executeMulticall({ functionName: "multicall", args: [calls] });
```

#### Data Refetching After Transactions

```typescript
// Wait for blockchain state to settle before refetching
onSuccess={async () => {
  setModalOpen(false);
  // 2-second delay ensures blockchain state is updated
  setTimeout(async () => {
    await refetchAll();
  }, 2000);
}}
```

### Incentive Configuration

Active incentives are configured in `src/data/uniswapIncentives.ts`:

- Must have correct `startTime` and `endTime` for current timestamp
- Incentive key is encoded as tuple: `(rewardToken, pool, startTime, endTime, refundee)`
- Used by staker contract to identify reward program

#### Build-Time Incentive Validation

**IMPORTANT**: The build script validates that all configured incentives exist on-chain before deployment:

- Located in `scripts/generate-build-data.ts` and `src/lib/buildTimeData.ts`
- Runs automatically during `pnpm run build` and `pnpm run dev`
- For each incentive in `uniswapIncentives.ts`:
  1. Computes the incentive ID: `keccak256(abi.encode(IncentiveKey))`
  2. Calls `UniswapV3Staker.incentives(incentiveId)` on-chain
  3. Checks if `totalRewardUnclaimed > 0` (indicates incentive exists)
- **Build fails immediately** if any incentive doesn't exist on-chain
- Provides detailed error with incentive parameters and instructions

This prevents deploying with invalid incentive configurations that would cause runtime failures.

**Example validation output:**

```
🔍 Validating incentives on-chain...
✅ Incentive 1 exists on-chain (ID: 0xc6026ca...)
   Total Reward Unclaimed: 9998614530225
   Number of Stakes: 3
✅ All incentives validated successfully!
```

**Error example:**

```
❌ Incentive 2 does NOT exist on-chain!
   Incentive ID: 0xf8a4b4e...
   Start Time: 1760009400
   This incentive needs to be created with createIncentive() before deployment!
```

### Position Detection

The hook checks both:

1. **User's wallet** (`balanceOf(userAddress)`) - for unstaked positions
2. **Staker contract** (`balanceOf(stakerAddress)`) - for all staked positions
   - Then filters by `deposits[tokenId].owner === userAddress`

### In-Range Detection

Positions show a green pulsing indicator when in range:

```typescript
const isInRange = currentTick >= tickLower && currentTick < tickUpper;
```

### SIR Price Context

Added `SirPriceContext` to centralize SIR price fetching:

- **Location**: `src/contexts/SirPriceContext.tsx`
- **Purpose**: Eliminates duplicate API calls for SIR price across components
- **Usage**: Wrap app in `SirPriceProvider`, then use `useSirPrice()` hook
- **Caching**: 1-minute stale time, no refetch on window focus
- **Benefits**: Single API call shared across Stake page components (price card, market cap, LP calculations)

```typescript
// In any component
const { sirPrice, isLoading, error } = useSirPrice();
```

### Important Notes

- All stake/unstake operations work on ALL positions at once (no individual selection)
- Positions with 0 liquidity are filtered out (closed positions)
- Only SIR/WETH 1% pool positions are shown (fee = 10000)
- TVL shows approximate USD value of staked positions (simplified calculation)
- Refetch delay prevents reading stale blockchain data
- Empty state shows "None" instead of suggesting to add liquidity
- SIR price is fetched once and shared via context to prevent duplicate API calls
- **Build-time validation**: All incentives in `uniswapIncentives.ts` are verified on-chain before deployment - builds fail if incentives don't exist

---

## Button Styling Guidelines

### Button Component Overview

The app uses a centralized Button component (`src/components/ui/button.tsx`) built with class-variance-authority (CVA) for consistent styling across the application.

### Available Button Variants

1. **`default`** (Primary actions):

   - Style: `bg-accent/60 hover:bg-accent text-accent-foreground`
   - Use for: Main CTAs, primary actions, navigation buttons
   - Example: Most buttons in the app use this variant

2. **`outline`** (Secondary actions):

   - Style: `border border-border bg-transparent hover:bg-accent/50`
   - Use for: Secondary actions, less prominent buttons
   - Example: Alternative actions, "View More" buttons

3. **`submit`** (Form submissions):

   - Style: `w-full bg-gold hover:bg-gold/90 text-black font-semibold`
   - Use for: Full-width form submit buttons, important actions
   - Example: Mint, Stake, Unstake forms

4. **`modal`** (Modal dialogs):
   - Style: Similar to default but full-width
   - Use for: Actions within modal dialogs

### Button Sizing

- **`sm`**: `h-8 px-3 text-xs` - Compact UI elements
- **`default`**: `h-9 px-4 py-2` - Standard buttons (most common)
- **`lg`**: `h-10 px-8` - Large, prominent actions
- **`icon`**: `h-9 w-9` - Icon-only buttons

### Implementation Best Practices

#### Standard Button

```tsx
<Button onClick={handleClick}>Click Me</Button>
```

#### Button as Link (using asChild)

```tsx
<Button asChild>
  <a href="/path" target="_blank" rel="noopener noreferrer">
    External Link
  </a>
</Button>
```

#### Simple Text Link (no button styling)

```tsx
<a
  href={url}
  target="_blank"
  rel="noopener noreferrer"
  className="text-primary hover:text-primary/80 inline-flex items-center gap-1.5 text-sm transition-colors"
>
  Link Text
  <ExternalLink className="h-3.5 w-3.5" />
</a>
```

### Styling Rules

1. **Default variant is preferred**: Don't specify `variant="outline"` unless needed
2. **Avoid custom styling**: Don't add `rounded-full` or other shape modifiers
3. **Consistent icon spacing**: Use `gap-1.5` for text + icon combinations
4. **Icon sizing convention**:
   - Small buttons: `h-3 w-3`
   - Default buttons: `h-3.5 w-3.5` or `h-4 w-4`
   - Large buttons: `h-4 w-4` or `h-5 w-5`

### When to Use Links vs Buttons

- **Use Button component**: For actions that change state or navigate internally
- **Use plain links**: For simple external navigation where button styling isn't needed
- **Use Button with asChild**: For external links that need button prominence

### Common Patterns

- **Form submissions**: `variant="submit"` for full-width gold buttons
- **External links**: Can use plain anchor tags with appropriate text styling
- **Navigation**: Default variant buttons
- **Secondary actions**: `variant="outline"` for less prominence

---

## Vault Pagination Strategy

### Current Implementation (Client-Side Pagination)

The app uses **client-side pagination** for vault tables with a 300-vault limit for optimal performance:

1. **Data Fetching**:

   - GraphQL fetches up to 300 vaults at once (configured in `src/server/queries/vaults.ts`)
   - Single API call serves both VaultDataContext and paginated tables
   - No duplicate requests between different components

2. **Pagination Logic**:

   - VaultProvider fetches all vaults (up to 300) from the backend
   - VaultTable component slices the array client-side: `vaults.slice((page - 1) * 10, page * 10)`
   - Instant page changes with no network delay

3. **Memory Optimization**:

   - 300 vault limit = ~300KB memory usage (acceptable for all devices)
   - Good balance between performance and functionality
   - Supports current vault count with room for growth

4. **Why Client-Side Over Server-Side**:

   - **Instant UX**: No loading delay when changing pages
   - **Reduced complexity**: No server/client state sync issues
   - **Fewer API calls**: One fetch serves multiple components
   - **Calculator needs**: All vaults available for instant filtering/searching

5. **Components Using This Strategy**:
   - **VaultTable** (`leverage-liquidity/vaultTable`): Displays paginated vaults
   - **VaultProvider**: Manages vault data and pagination state
   - **VaultDataContext**: Provides all vaults globally for filtering/searching

### Future Optimization Path

When vault count exceeds 500:

1. Implement virtual scrolling for large lists
2. Add search/autocomplete API for Calculator
3. Use IndexedDB for client-side caching
4. Progressive loading (first 100, then rest on demand)

### Key Files

- `src/lib/getVaults.ts`: Fetches vault data (up to 300)
- `src/components/providers/vaultProvider.tsx`: Manages pagination state
- `src/components/leverage-liquidity/vaultTable/vaultTable.tsx`: Implements client-side slicing
- `src/server/queries/vaults.ts`: GraphQL query with 300 vault limit

---

## Token Asset Handling

### Proper Logo/Icon Implementation

**Always use the centralized asset functions** from `@/lib/assets` for consistency:

```typescript
import { getLogoAssetWithFallback } from "@/lib/assets";

// Correct way to get token logos
const logos = getLogoAssetWithFallback(tokenAddress, tokenlist);
const logoUrl = logos.fallback ?? logos.primary;
```

**Why use `getLogoAssetWithFallback`:**

1. **Special SIR handling**: Correctly handles SIR token icons for both mainnet and HyperEVM
2. **Consistent fallbacks**: Uses curated token list first, then reliable fallbacks
3. **Chain-aware**: Handles different logos for different chains
4. **Centralized updates**: Changes to logo logic only need to be made in one place

**DO NOT create custom logo resolution logic** like:

```typescript
// ❌ Bad - Don't do this
const getLogoWithFallback = (address: string) => {
  const token = tokenlist?.find(
    (t) => t.address.toLowerCase() === address.toLowerCase(),
  );
  if (token?.logoURI) return token.logoURI;
  return `https://raw.githubusercontent.com/trustwallet/assets/master/...`;
};
```

### Available Asset Functions

- **`getLogoAssetWithFallback(address, tokenlist)`**: Returns logo URLs with primary and fallback options
- **`getSirSymbol(chainId?)`**: Returns "SIR" or "HyperSIR" based on chain
- **`getSirLogo(chainId?)`**: Returns appropriate SIR logo for the chain
- **`getSirTokenMetadata()`**: Returns complete SIR token metadata

### Key Asset Files

- `src/lib/assets.ts`: Centralized asset management functions
- `public/images/sir-logo.svg`: SIR logo for Ethereum chains
- `public/images/sir-logo-hyperevm.svg`: SIR logo for HyperEVM chains

---

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

### 5. Leaderboard Price Handling

The leaderboard (`getActiveApePositions`) uses a smart fallback system for token prices:

1. **Chain-aware primary API selection**:

   - Ethereum chains (mainnet, Sepolia): Uses Alchemy API
   - HyperEVM chains (998, 999): Uses CoinGecko API

2. **Automatic fallback for missing prices**:

   - If a token has no price from the primary API (returns null or "0")
   - Automatically uses `getTokenPriceWithFallback` which:
     - Tries Uniswap V3 pools paired with WETH/WHYPE
     - Falls back to USDC pairs if WETH pair unavailable
     - Converts pool prices to USD using wrapped token USD price

3. **This handles exotic tokens like SIR automatically**:
   - No special-casing needed for specific tokens
   - Works for any token not listed on external price APIs
   - Ensures accurate PnL calculations for all positions

### Usage Notes

- **For PnL calculations**: Use `quoteBurn` for current collateral amount, compare with `row.collateralTotal` from subgraph
- **For debt token PnL**: Use `getMostLiquidPoolPrice` to get current exchange rate and convert collateral to debt token terms
- **For USD values**: Use appropriate price function based on chain (Alchemy for Ethereum, CoinGecko for HyperEVM)
- **For leaderboard/positions**: The system automatically handles price fallbacks for exotic tokens
- All price functions include caching to minimize external API calls

## UI Component Guidelines

### DisplayFormattedNumber Component

The app uses a consistent `DisplayFormattedNumber` component for displaying numerical values with intelligent formatting:

**Features:**

- **Large numbers**: Automatically adds comma separators (e.g., 1,234,567)
- **Very small numbers** (< 0.001): Uses HTML subscript notation (e.g., 0.0<sub>3</sub>456)
- **Significant digits**: Configurable precision (default: 3)
- **Input flexibility**: Accepts number, string, or bigint

**Usage:**

```tsx
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";

// Basic usage
<DisplayFormattedNumber num={1234.567} />
// Output: 1,230

// With custom significant digits
<DisplayFormattedNumber num={position.pnlCollateral} significant={4} />
// Output: 0.03692

// Very small numbers render with subscript
<DisplayFormattedNumber num={0.000456} significant={3} />
// Renders as: 0.0₃456
```

**When to use:**

- Displaying token amounts in tables and forms
- Showing PnL values
- Rendering TVL, APR, and other metrics
- Any place where consistent number formatting is needed

**Note**: For tweet text or other plain text contexts where HTML formatting isn't supported, use the `formatNumber` utility directly from `@/lib/utils`.

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

### HoverPopupMobile Component Usage

The app uses `HoverPopupMobile` for hover tooltips and information popups throughout the interface.

**Component Pattern:**

```tsx
import HoverPopupMobile from "@/components/ui/hover-popup-mobile";

<HoverPopupMobile
  size="200" // Width in pixels: "200", "250", "300"
  trigger={
    <button className="cursor-pointer">Hover me</button> // Always use cursor-pointer, not cursor-help
  }
>
  <span className="text-[13px] font-medium">Popup content here</span>
</HoverPopupMobile>;
```

**Key Features:**

- **Mobile-friendly**: Works on both hover (desktop) and tap (mobile)
- **Customizable width**: Use `size` prop for different content widths
- **Flexible trigger**: Any element can be the trigger
- **Consistent styling**: Automatically styled to match the app's design system

**Important Cursor Style Convention:**

- **Always use `cursor-pointer`** on hover trigger elements - shows the finger pointer cursor
- **Never use `cursor-help`** - the arrow with question mark is not used in this app
- This provides consistent UX where all interactive elements show the same pointer cursor

**Common Use Cases:**

1. **Information tooltips**: Explaining features or showing additional data
2. **Interactive hints**: "Click to share", "Tweet about your gains", etc.
3. **Data breakdowns**: Showing detailed calculations or breakdowns
4. **Contextual help**: Providing help text for complex features

**Example from Portfolio:**

```tsx
<HoverPopupMobile
  size="200"
  trigger={<button className="emoji-button">🚀</button>}
>
  <span className="text-[13px] font-medium">
    Tweet about your 150% WETH gains! 🎉
  </span>
</HoverPopupMobile>
```

### Theme-Based Image Switching

The app uses CSS-based image switching for instant theme transitions without loading lag:

**Implementation Pattern:**

```tsx
{
  /* CSS-based theme switching: Both images loaded, visibility controlled by CSS */
}
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
</>;
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
