# Claude Development Guidelines

## App Overview

SIR is a DeFi protocol frontend for leveraged trading without liquidation risk. Built with Next.js 14, TypeScript, Wagmi/Viem, and TRPC.

### Architecture

- **Next.js App Router** with server components
- **TRPC** for type-safe API communication
- **Wagmi/Viem** for blockchain interactions
- **React Context** for global state (eliminates duplicate API calls)
- **Tailwind CSS** for styling with dark/light themes

### Key Context Providers

1. **VaultDataContext**: Centralizes vault data (single fetch, shared everywhere)
2. **StakingContext**: Staking balances, APR, TVL
3. **ClaimableBalancesContext**: Dividends/rewards with notification thresholds
4. **TokenlistContextProvider**: Available tokens (provides `tokenlist` array and `tokenMap` for O(1) lookups)
5. **SirPriceContext**: Centralized SIR price fetching (1-minute cache)

### Multi-Chain Support

- Ethereum mainnet (chainId: 1)
- Sepolia testnet (chainId: 11155111)
- HyperEVM mainnet (chainId: 998)
- HyperEVM testnet (chainId: 999)

**Visual differentiation**: HyperEVM versions have gradient logos and distinct branding.

**Notifications**: Golden dots for SIR rewards (≥100k), green dots for dividends (≥0.01 ETH/1 HYPE).

**Automatic Network Switching**:
- App uses `NEXT_PUBLIC_CHAIN_ID` on load
- When user switches wallet network, app automatically redirects to corresponding deployment URL
- Configuration: `src/config/chains.json` - add `deploymentUrl` field per chain
- Implementation: `src/hooks/useNetworkRedirect.ts` listens to `window.ethereum.on('chainChanged')`
- Console errors during redirect (React #423, WebSocket closed) are expected and harmless

---

## Core Development Principles

### Build Philosophy

**Fail fast, fix root causes:**
- Let TypeScript compilation errors fail the build
- No error suppression in build scripts
- Scripts should fail immediately if something is wrong
- Build-time validation (e.g., incentive validation) prevents runtime failures

**Runtime**: App handles errors gracefully for better UX.

### Transaction Execution Pattern

**CRITICAL**: Use direct contract calls without explicit pre-simulation.

**Core Principle:**
```typescript
// ✅ CORRECT: Direct contract call
const confirmTransaction = () => {
  if (tokenId) {
    writeContract({
      ...ContractConfig,
      functionName: "someFunction",
      args: [tokenId as Address],
    });
  }
};
```

**Why:**
- Wagmi handles simulation internally
- Better UX - no waiting for simulations
- Prevents false failures from gas estimation issues
- Enable buttons as soon as data is ready (wallet connected, form valid)

**❌ ANTI-PATTERN:**
```typescript
// DON'T block on simulation or disable buttons based on simulation state
const { request, isLoading } = useSimulateContract({...});
<Button disabled={isSimulating || !request}>Confirm</Button>
```

### Error Handling in Transactions

**Always show `writeContract` errors, but filter user rejections:**

```typescript
const { writeContract, error: writeError } = useWriteContract();

// Show error (after TransactionStatus component)
{writeError && !isConfirming && !isConfirmed && (() => {
  const errorMessage = writeError.message || "";
  const isUserRejection = errorMessage.toLowerCase().includes("user rejected") ||
                         errorMessage.toLowerCase().includes("user denied");

  if (!isUserRejection) {
    return (
      <div className="mt-3">
        <p className="text-xs text-center" style={{ color: "#ef4444" }}>
          Transaction simulation failed. Please check your inputs and try again.
        </p>
      </div>
    );
  }
})()}
```

**Show errors for**: Insufficient balance, contract reverts, etc.
**Don't show for**: User wallet rejections, during confirmation, after success.

---

## Transaction Modal Patterns

### Two-Step Pattern (Approve + Main Transaction)

**Used for**: Minting APE/TEA tokens (requires ERC20 approval first).

**Key implementation**: Single modal with dynamic content, seamless transitions without flashing.

**Critical state tracking to prevent modal flashing:**
```typescript
const [approvalWasConfirmed, setApprovalWasConfirmed] = useState(false);

useEffect(() => {
  if (isConfirmed && needsApproval) {
    setApprovalWasConfirmed(true); // Prevent showing approval form again
  }
  if (!needsApproval) {
    setApprovalWasConfirmed(false);
  }
}, [isConfirmed, needsApproval]);

// Extended loading state during transition
<TransactionStatus
  showLoading={isConfirming || userBalanceFetching || approvalWasConfirmed}
  action={!needsApproval ? "Mint" : "Approve"}
/>

// Hide disclaimers during transition
{needsApproval && !approvalWasConfirmed && (
  <TransactionModal.Disclaimer>Approve Funds to Mint.</TransactionModal.Disclaimer>
)}
```

**Reference**: `src/components/leverage-liquidity/mintForm/`

### Nested Modal Pattern (Single Transaction with Input)

**Used for**: Stake, unstake, burn, transfer (user inputs amount, single transaction).

**Structure**: Outer modal (form) → Inner modal (transaction confirmation/status).

**Critical implementation**:
```typescript
const [open, setOpen] = useState(false);

// Wrapper that closes BOTH modals
const handleSetOpen = (value: boolean) => {
  setOpen(value);
  if (!value) closeOuterModal();
};

// Use wrapper for ALL modal state changes
<TransactionModal.Root setOpen={handleSetOpen} open={open}>
  <TransactionModal.Close setOpen={handleSetOpen} />
  {/* Modal content */}
</TransactionModal.Root>
```

**Why**: Ensures X button, Close button, and click-outside all close both modals together.

**❌ DON'T**: Use setTimeout delays or call close functions separately (causes race conditions).

**Reference**: `src/components/portfolio/unstakeForm.tsx`, `burnForm.tsx`, `transferForm.tsx`

---

## Data Patterns

### Token Decimals Architecture

**CRITICAL RULE**: APE and TEA tokens always match collateral token decimals.

**Decimal relationships:**
- APE decimals = Collateral decimals (always equal)
- TEA decimals = Collateral decimals (always equal)
- Debt decimals = Independent

**Best practices:**
```typescript
// Vault TVL, reserves, quoteBurn results - use collateralToken.decimals
formatUnits(vault.totalValue, vault.collateralToken.decimals)

// Debt token amounts - MUST use debtToken.decimals
formatUnits(debtTokenTotal, vault.debtToken.decimals)

// APE/TEA balances - either works (prefer collateralToken for clarity)
formatUnits(balance, vault.ape.decimals) // OK
formatUnits(balance, vault.collateralToken.decimals) // Better
```

### Token Asset Handling

**ALWAYS use centralized asset functions** from `@/lib/assets`:

```typescript
import { getLogoAssetWithFallback } from "@/lib/assets";

const { tokenMap } = useTokenlistContext();
const logos = getLogoAssetWithFallback(tokenAddress, tokenMap);
const logoUrl = logos.fallback ?? logos.primary;
```

**Why**: Special SIR handling, chain-aware, O(1) lookups, centralized updates.

**❌ DON'T** create custom logo resolution logic with `.find()`.

**Available functions:**
- `getLogoAssetWithFallback(address, tokenMap, chainId?)` - Logo URLs with fallbacks
- `getSirSymbol(chainId?)` - "SIR" or "HyperSIR"
- `getSirLogo(chainId?)` - Chain-appropriate logo
- `getSirTokenMetadata()` - Complete SIR metadata
- `getNativeTokenLogo(tokenMap)` - Native token (ETH/HYPE) logo from CoinGecko
- `getNativeTokenInfo(tokenMap)` - Native token metadata

**Image fallback chain**: Trust Wallet → CoinGecko (logoURI) → Unknown token placeholder

**Native Token Handling:**
Native tokens (ETH, HYPE) are stored in `assets.json` with a special address (`0xEeee...EEeE`) and `isNative: true` flag. Logos are retrieved from CoinGecko at build time via `scripts/fetch-token-lists.ts`.

When users toggle "Use ETH" / "Use HYPE":
- The `Dropdown` component uses React Context to pass `useNativeToken` state to nested `Dropdown.Item` components
- Logos and symbols swap from WETH/WHYPE to ETH/HYPE within the same structure
- Default is always wrapped token unless wrapped balance is 0 and native balance > 0
- Auto-reset on modal open/token change to ensure consistent defaults

Constants: `WRAPPED_NATIVE_TOKEN_ADDRESS`, `NATIVE_TOKEN_ADDRESS` from `@/data/constants`

### Price Functions API

**Price fetching mechanisms:**

1. **`api.vault.getBatchCollateralPrices`**: **PREFERRED for batch operations**
   - Uses Multicall3 to batch ALL Uniswap V3 pool queries into single RPC call
   - Queries TOKEN/wrapped-native-token pairs across all fee tiers (0.01%, 0.05%, 0.3%, 1%)
   - Single external API call for wrapped native token price (WETH on Ethereum, WHYPE on HyperEVM)
   - Returns `Record<address, usdPrice>` for all requested tokens
   - **Use case**: Popular Vaults table, any bulk price display
   - **Performance**: 95-98% reduction in network requests vs individual calls

2. **`api.quote.getMostLiquidPoolPrice`**: Uniswap V3 oracle (same as smart contracts use)
   - Finds most liquid pool across fee tiers
   - **Use case**: Single token price queries, on-chain price verification

3. **`api.price.getSirPriceInUsd`**: SIR price (1-minute cache)

4. **`api.price.getTokenPrice`**: Alchemy (Ethereum chains)
   - **Use case**: Individual token lookups with external API support

5. **`api.price.getCoinGeckoPrice`**: CoinGecko (HyperEVM chains)
   - **Use case**: Individual token lookups on HyperEVM

6. **`api.price.getTokenPriceWithFallback`**: Multi-tier fallback
   - External APIs → Uniswap V3 wrapped-native pairs → USDC pairs
   - Handles exotic tokens automatically
   - **Use case**: Fallback when primary APIs fail

7. **`useTokenUsdPrice` hook**: Auto-selects API based on chain
   - **Use case**: Individual token price in components (prefer batch endpoint when possible)

**Batch price fetching pattern:**
```typescript
// Extract unique collateral tokens from current page
const { collateralTokens, decimalsMap } = useMemo(() => {
  const uniqueTokens = new Set<string>();
  const decimals: Record<string, number> = {};

  vaults.forEach((vault) => {
    uniqueTokens.add(vault.collateralToken.id);
    decimals[vault.collateralToken.id] = vault.collateralToken.decimals;
  });

  return { collateralTokens: Array.from(uniqueTokens), decimalsMap: decimals };
}, [vaults]);

// Single batch query
const { data: prices } = api.vault.getBatchCollateralPrices.useQuery(
  { collateralTokens, decimals: decimalsMap },
  { staleTime: 60000 } // 1-minute cache
);

// Use prices: prices[tokenAddress.toLowerCase()]
```

**Important vault concepts:**
- Vaults ONLY hold collateral tokens
- TVL = total collateral amount
- Debt tokens are accounting units, not held in vaults

### Vault Pagination Strategy

**Client-side pagination** with 300-vault limit:
- Single GraphQL fetch serves all components
- `vaults.slice((page - 1) * 10, page * 10)` for instant page changes
- ~300KB memory usage
- No loading delays, no server/client sync issues

**Why client-side**: Instant UX, fewer API calls, supports calculator filtering.

**Key files**: `src/lib/getVaults.ts`, `src/components/providers/vaultProvider.tsx`

---

## Feature-Specific Implementations

### LP Staking

**Key components:**
- `LpStakingArea.tsx` - Main UI (unstaked/staked/rewards cards)
- `useUserLpPositions.ts` - Fetches from wallet AND UniswapV3Staker contract
- `LpStakeModal.tsx`/`LpUnstakeModal.tsx` - Multicall pattern for batching

**Single-transaction multicall pattern:**
```typescript
const calls: `0x${string}`[] = [];

// Add approvals if needed
positions.forEach((pos, i) => {
  if (needsApproval[i]) {
    calls.push(encodeFunctionData({ abi, functionName: "approve", args: [...] }));
  }
});

// Add main operations
positions.forEach(pos => {
  calls.push(encodeFunctionData({ abi, functionName: "safeTransferFrom", args: [...] }));
});

executeMulticall({ functionName: "multicall", args: [calls] });
```

**Build-time validation**: Incentives in `src/data/uniswapIncentives.ts` are verified on-chain during build. Build fails if incentives don't exist.

**Data refetching**: 2-second delay after transactions ensures blockchain state is updated.

### Multicall3 Batching Pattern

**CRITICAL**: Always batch multiple read-only contract calls into a single RPC request using Multicall3.

**When to use:**
- Reading data from multiple pools/contracts simultaneously
- Fetching balances, allowances, or metadata for multiple tokens
- Any scenario requiring 3+ contract reads

**Implementation pattern:**

```typescript
import { multicall } from "@/lib/viemClient";

// 1. Build contracts array
const contracts = tokens.map(token => ({
  address: token.address as Address,
  abi: erc20Abi,
  functionName: "balanceOf",
  args: [userAddress],
}));

// 2. Execute single multicall
const results = await multicall({
  contracts,
  allowFailure: true, // Handles failures gracefully
});

// 3. Process results
results.forEach((result, i) => {
  if (result.status === "success") {
    const balance = result.result as bigint;
    // Use balance...
  }
});
```

**Real-world example (Batch Collateral Prices):**

```typescript
// Query ALL Uniswap pools (10 tokens × 4 fee tiers × 3 queries = 120 calls → 1 RPC)
const multicallContracts = collateralTokens.flatMap(tokenAddress =>
  FEE_TIERS.flatMap(fee => {
    const poolAddress = computePoolAddress(tokenAddress, wrappedNativeAddress, fee);
    return [
      { address: poolAddress, abi: UniswapV3PoolABI, functionName: "slot0" },
      { address: poolAddress, abi: UniswapV3PoolABI, functionName: "liquidity" },
      { address: poolAddress, abi: UniswapV3PoolABI, functionName: "token0" },
    ];
  })
);

const results = await multicall({ contracts: multicallContracts, allowFailure: true });
```

**Benefits:**
- Single RPC call vs potentially hundreds
- Atomic data fetch (all or nothing)
- Automatic failure handling per contract
- Massive performance improvement (95%+ reduction in network requests)

**Contract address:** Multicall3 at `0xcA11bde05977b3631167028862bE2a173976CA11` (deployed on all chains)

**Reference:** `src/lib/viemClient.ts`, `src/server/api/routers/vault.ts` (getBatchCollateralPrices)

---

## UI Component Guidelines

### Button Component

**Centralized Button** (`src/components/ui/button.tsx`) with CVA variants:

1. **`default`** - Primary actions (most common)
2. **`outline`** - Secondary actions
3. **`submit`** - Full-width gold form buttons
4. **`modal`** - Modal actions

**Sizes**: `sm`, `default`, `lg`, `icon`

**Best practices:**
- Default variant is preferred
- No custom shape modifiers (e.g., `rounded-full`)
- Icon spacing: `gap-1.5`
- Icon sizes: `h-3.5 w-3.5` (default), `h-4 w-4`

**Links:**
```tsx
// Button as link
<Button asChild><a href="...">Link</a></Button>

// Plain text link (no button styling)
<a className="text-primary hover:text-primary/80 inline-flex items-center gap-1.5">
  Link <ExternalLink className="h-3.5 w-3.5" />
</a>
```

### DisplayFormattedNumber

**Consistent number formatting** with intelligent handling:
- Large numbers: Comma separators (1,234,567)
- Small numbers (<0.001): HTML subscript (0.0₃456)
- Configurable significant digits (default: 3)

```tsx
<DisplayFormattedNumber num={1234.567} significant={4} />
```

**Use for**: Token amounts, PnL, TVL, APR, metrics.

**For plain text** (tweets, etc.): Use `formatNumber` from `@/lib/utils`.

### Tooltip Architecture

**IMPORTANT**: All tooltips use a unified component system. DO NOT create separate mobile/desktop tooltip components.

**Two components only:**

1. **`HoverPopup`** (`src/components/ui/hover-popup.tsx`) - Universal popup component
   - Automatically detects hover capability using `(hover: hover)` media query
   - Uses HoverCard for desktop, Popover for mobile/touch devices
   - Centralized styling - update in ONE place only

2. **`ToolTip`** (`src/components/ui/tooltip.tsx`) - Simple wrapper that adds Info icon
   - Uses HoverPopup internally
   - Only purpose: add the Info icon trigger

**Usage patterns:**

```tsx
// With Info icon (most common)
<ToolTip iconSize={16} size="300">Content</ToolTip>

// Custom trigger element
<HoverPopup
  size="200"
  trigger={<button className="cursor-pointer">Hover</button>}
>
  <span className="text-[13px] font-medium">Content</span>
</HoverPopup>
```

**Component features:**
- Portal rendering - prevents parent style bleed
- High z-index (`z-[9999]`)
- Flat color background: `bg-black dark:bg-white`
- Match icon size to text: `iconSize={16}` for normal, `14` for small
- Width: `size="200"` (narrow), `"250"` (default), `"300"` (wide)

**Cursor convention**: ALWAYS use `cursor-pointer`, NEVER `cursor-help`.

**DO NOT**:
- Create separate "mobile" vs "desktop" tooltip components
- Duplicate tooltip logic or styling
- Add manual device detection (HoverPopup handles this)
- Style tooltips inline (update HoverPopup component instead)

### Theme-Based Image Switching

**CSS-based switching** for instant theme transitions:

```tsx
<>
  {/* Dark mode */}
  <Image src="/image_dark.png" className="hidden dark:block" {...props} />
  {/* Light mode */}
  <Image src="/image_light.png" className="block dark:hidden" {...props} />
</>
```

**Why**: Zero lag, no flicker, both images preload.

**Current theme images:**
- **/leverage**: Monkey images (top-right of vault table on desktop, minting form on mobile)
- **/liquidity**: Gorilla images (same positioning)
- **/stake**: Frog images (bottom-right of rewards card)

**Always use Next.js `Image` component**, not `<img>` tags.

### Canvas Rendering with Next.js Fonts

**CRITICAL**: Next.js Google Fonts generates hashed font-family names, not literal strings.

**Problem**: Canvas can't find fonts by literal names like `"Open Sans"` - they're registered as `"__Open_Sans_abc123"`.

**Solution Pattern**:

```typescript
// 1. Create shared font config (src/lib/fonts.ts)
export const openSans = Open_Sans({ subsets: ["latin"], ... });
export const ebGaramond = EB_Garamond({ subsets: ["latin"], ... });

// 2. Import in canvas component
import { openSans, ebGaramond } from "@/lib/fonts";

// 3. Extract real font-family names
const sansFont = openSans.style.fontFamily;
const serifFont = ebGaramond.style.fontFamily;

// 4. Preload fonts before rendering
await document.fonts.ready;
await Promise.all([
  document.fonts.load(`500 52px ${sansFont}`),
  document.fonts.load(`400 240px ${serifFont}`),
]);

// 5. Use in canvas
ctx.font = `500 52px ${sansFont}`; // ✅ Uses hashed name
ctx.font = "500 52px 'Open Sans'"; // ❌ Font not found, defaults to Times New Roman
```

**Key principles:**
- Use `fontObject.style.fontFamily` to get actual registered name
- Preload all font weights/sizes before drawing
- No fallback fonts if you want guaranteed consistency
- Share font config between layout and canvas components

**Reference**: `src/lib/fonts.ts`, `src/components/portfolio/burnTable/ImageCardGenerator.tsx`

---

## Key File References

### Transaction Patterns
- Two-step approval: `src/components/leverage-liquidity/mintForm/`
- Nested modal: `src/components/portfolio/{unstakeForm,burnForm,transferForm}.tsx`
- Other modals: `src/components/auction/AuctionBidModal.tsx`, `src/components/shared/SirClaimModal.tsx`

### Data Management
- Asset functions: `src/lib/assets.ts`
- Token logos: `public/images/sir-logo{,-hyperevm}.svg`
- Vault data: `src/lib/getVaults.ts`, `src/components/providers/vaultProvider.tsx`
- Batch price fetching: `src/server/api/routers/vault.ts` (getBatchCollateralPrices), `src/components/leverage-liquidity/vaultTable/vaultTable.tsx`
- LP staking: `src/components/stake/LpStakingArea.tsx`, `src/hooks/useUserLpPositions.ts`
- Incentive validation: `scripts/generate-build-data.ts`, `src/lib/buildTimeData.ts`
- Multicall utilities: `src/lib/viemClient.ts`

### UI Components
- Button: `src/components/ui/button.tsx`
- Number formatting: `src/components/shared/displayFormattedNumber.tsx`
- Tooltips: `src/components/ui/hover-popup.tsx` (universal), `src/components/ui/tooltip.tsx` (Info icon wrapper)
- Fonts config: `src/lib/fonts.ts` (shared font config for canvas rendering)
- Canvas gains cards: `src/components/portfolio/burnTable/ImageCardGenerator.tsx`
