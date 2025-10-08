# Uniswap V3 LP Staking Implementation

## Current Status (January 2025)
✅ **UI Implementation Complete** - LP staking interface matches existing SIR staking design
✅ **Contract Integration Ready** - Staking, claiming, and unstaking handlers implemented
⚠️ **Configuration Required** - Pool address and incentive keys need to be added

## Overview
This document describes the implementation of Uniswap V3 LP position staking functionality on the `/stake` page. The feature allows users to stake their Uniswap V3 SIR/WETH 1% LP positions (NFTs) to earn SIR rewards through the Uniswap V3 Staker contract.

## Quick Setup Guide

### Step 1: Run Build Script
Generate the SIR/WETH pool address automatically:
```bash
npm run generate:build-data
```
This will compute the pool address deterministically and save it to `public/build-data.json`.

### Step 2: Add Active Incentives
Edit `src/data/uniswapIncentives.ts` and add incentives for your chain:
```typescript
export const INCENTIVES_BY_CHAIN: Record<number, IncentiveKey[]> = {
  // Ethereum Mainnet
  1: [
    {
      rewardToken: SIR_ADDRESS, // Automatically uses correct SIR address
      pool: SIR_WETH_POOL_1_PERCENT, // Automatically uses computed pool address
      startTime: 1234567890n, // Unix timestamp
      endTime: 9999999999n,   // Unix timestamp
      refundee: "0xYOUR_REFUNDEE_ADDRESS",
    },
  ],
  // ... other chains
};
```

### Step 3: (Optional) Update Staker Address
If your chain uses a different Uniswap V3 Staker address, update it in `src/config/chains.json`:
```json
{
  "1": {
    "contracts": {
      "uniswapV3Staker": "0xe34139463bA50bD61336E0c446Bd8C0867c6fE65"
      // ... other contracts
    }
  }
}
```
Then regenerate build data: `npm run generate:build-data`

---

## ✅ Completed Implementation (Updated)

### 1. Build System Integration

**Files Modified:**
- `.env.example` - Added `NEXT_PUBLIC_UNIV3_STAKER_ADDRESS` variable
- `src/lib/buildTimeData.ts` - Added logic to fetch NFT Position Manager address
- `scripts/generate-build-data.ts` - Updated to log new contract addresses
- `public/build-data.json` - Manually added placeholder addresses

**What It Does:**
- Fetches the NFT Position Manager address from the Uniswap V3 Staker contract at build time
- Stores both `uniswapV3Staker` and `nftPositionManager` addresses in `build-data.json`
- Makes addresses available throughout the app via the build data import

**Note:** You need to add `NEXT_PUBLIC_UNIV3_STAKER_ADDRESS=0x1f98407aaB862CdDeF78Ed252D6f557aA5b0f00d` to your `.env` file and run `npm run generate:build-data` to fetch the actual NFT Position Manager address.

---

### 2. Data Layer

**Files Created:**

#### `src/data/uniswapIncentives.ts`
- Defines `IncentiveKey` interface (matches Uniswap V3 Staker struct)
- Exports `ACTIVE_INCENTIVES` array for managing incentive programs
- Helper functions:
  - `getCurrentActiveIncentives()` - Filters by current timestamp
  - `hasActiveIncentives()` - Checks if any are active
  - `getActiveIncentivesCount()` - Returns count

**What Remains:**
- Add actual incentive keys to `ACTIVE_INCENTIVES` array
- Add SIR/WETH 1% pool address constant

---

#### `src/contracts/uniswapV3Staker.ts`
**Exports:**
- `UniswapV3StakerContract` - Full ABI for Uniswap V3 Staker
  - Functions: `stakeToken`, `unstakeToken`, `claimReward`, `withdrawToken`, `getRewardInfo`, `multicall`
  - View functions: `stakes`, `deposits`, `rewards`
- `NonfungiblePositionManagerContract` - Full ABI for Position Manager
  - Functions: `approve`, `safeTransferFrom`, `positions`, `balanceOf`, `tokenOfOwnerByIndex`

**What It Does:**
- Provides type-safe contract interaction via wagmi hooks
- Addresses are automatically loaded from `build-data.json`

---

### 3. TypeScript Types

**File:** `src/components/stake/lpStaking/types.ts`

```typescript
export interface LpPosition {
  tokenId: bigint;
  owner: string;
  token0: string;
  token1: string;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  isStaked: boolean;
  numberOfStakes: number;
  valueUsd: number;
  rewardsSir: bigint;
}
```

---

### 4. UI Components

**Component Hierarchy:**
```
src/components/stake/
├── lpStaking/
│   ├── types.ts                    # TypeScript interfaces
│   ├── LpMetrics.tsx               # TVL + APR display
│   ├── LpStakingArea.tsx           # Main container component
│   ├── LpPositionCard.tsx          # Individual position card (NEW)
│   └── hooks/
│       └── useUserLpPositions.ts   # Position fetching hook (IMPLEMENTED)
└── sirStaking/
    ├── SirStakingArea.tsx          # SIR staking container
    └── SirMetrics.tsx              # Staked Supply + APR metrics
```

#### `LpMetrics.tsx`
- Displays Total Value Locked (in USD)
- Displays Staking APR (currently shows "TBD")
- 2-column grid layout matching SirMetrics style

#### `LpPositionCard.tsx` (NEW)
- Individual position card matching SirCard design
- Shows position ID and USD value
- For unstaked: "Subscribe" button
- For staked: "Claim" and "Unstake" buttons
- Uses same styling as SIR staking cards (`bg-primary/5 dark:bg-primary`)

#### `LpStakingArea.tsx`
- Main container matching SirStakingArea layout
- Uses StakeCardWrapper for consistent styling
- Vertically stacked sections for unstaked and staked positions
- Fully implemented action handlers (subscribe, claim, unstake)
- Toast notifications for user feedback

#### `SirStakingArea.tsx`
- Refactored SIR staking into its own component
- Includes metrics at top (Staked Supply + APR)
- Vertically stacks: Unstaked Balance → Your Stake → Dividends

#### `SirMetrics.tsx`
- Displays Staked Supply (with % of total)
- Displays Staking APR
- 2-column grid layout matching LP metrics

---

### 5. Page Layout Updates

**File:** `src/components/stake/stakePage.tsx`

**New Layout:**
```
┌────────────────────────────────────────────────────┐
│              Explainer                             │
└────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────────────────────┐
│  SIR STAKING     │  UNISWAP V3 LP STAKING          │
│  - Metrics       │  - Metrics (TVL, APR)           │
│  - Balance       │  - Unstaked Positions           │
│  - Stake         │  - Staked Positions             │
│  - Dividends     │                                  │
└──────────────────┴──────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  Contributor Rewards (if any)                      │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  SIR Price │ Market Cap │ Price Chart             │
└────────────────────────────────────────────────────┘
```

**Responsive Behavior:**
- **Desktop (lg+)**: Two-column grid (`lg:grid-cols-2`)
- **Mobile**: Vertically stacked

**Changes:**
- Removed old "Your Position" card
- Removed old "Claimable Rewards" card with frog image
- Moved contributor rewards to separate section (only shows if balance > 0)
- Reorganized price data into 3-column grid at bottom

---

## 🚧 What Remains To Be Configured

### 1. Get the SIR/WETH Pool Address

**Option A: Compute Deterministically**
The pool address can be computed using:
- Token0: SIR address (alphabetically lower)
- Token1: WETH address (alphabetically higher)
- Fee: 10000 (1%)
- Uniswap V3 Factory: `0x1F98431c8aD98523631AE4a59f267346ea31F984`

**Option B: Query from Subgraph**
```graphql
{
  pools(where: {
    token0: "0x4da4fb565dcd5d5c5db495205c109ba983a8aba2",
    token1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    feeTier: "10000"
  }) {
    id
  }
}
```

### 2. Add Incentive Configuration

**File:** `src/data/uniswapIncentives.ts`

**TODO:**
1. Add SIR/WETH 1% pool address:
```typescript
// Add at top of file
export const SIR_WETH_POOL_1_PERCENT = "0x..." as const;
```

2. Populate `ACTIVE_INCENTIVES` array with actual incentive keys:
```typescript
export const ACTIVE_INCENTIVES: IncentiveKey[] = [
  {
    rewardToken: "0x4Da4fb565Dcd5D5C5dB495205c109bA983A8ABa2", // SIR
    pool: SIR_WETH_POOL_1_PERCENT,
    startTime: 1234567890n, // Unix timestamp
    endTime: 1234567890n,   // Unix timestamp
    refundee: "0x...",       // Address that can reclaim unclaimed rewards
  },
  // Add more incentives as needed
];
```

**How to get incentive keys:**
- Check the transaction that called `createIncentive` on the Uniswap V3 Staker
- Extract the incentive parameters from the event logs
- Or query the subgraph for active incentives

---

### 3. Calculate Position USD Values (Optional Enhancement)

**File:** `src/components/stake/lpStaking/hooks/useUserLpPositions.ts`

**Current State:** Position fetching works but USD values are hardcoded to 0

**What Needs Implementation:**

```typescript
export function useUserLpPositions() {
  const { address } = useAccount();

  // Step 1: Get user's NFT balance
  const { data: balance } = useReadContract({
    ...NonfungiblePositionManagerContract,
    functionName: 'balanceOf',
    args: [address],
  });

  // Step 2: Get all token IDs owned by user
  // Use multicall to fetch tokenOfOwnerByIndex for each index from 0 to balance-1

  // Step 3: For each token ID, fetch position details
  // Use multicall to fetch positions(tokenId) for each token

  // Step 4: Filter for SIR/WETH 1% positions only
  // Check: token0/token1 match SIR/WETH addresses (either order)
  // Check: fee === 10000 (1% fee tier)

  // Step 5: Check staking status for each position
  // Use multicall to fetch deposits(tokenId) from UniswapV3Staker
  // If deposit.owner === UniswapV3Staker address, it's deposited
  // If deposit.numberOfStakes > 0, it's staked

  // Step 6: Calculate USD value for each position
  // Use position.liquidity and current pool price
  // Convert to USD using SIR and WETH prices

  // Step 7: Get accumulated rewards for staked positions
  // Use multicall to fetch rewards(SIR_ADDRESS, userAddress) from staker

  // Step 8: Separate into unstaked vs staked arrays

  return {
    unstakedPositions,
    stakedPositions,
    isLoading,
    totalValueLockedUsd,
  };
}
```

**Suggested Approach:**
- Use `wagmi`'s `useReadContracts` for multicall operations
- Cache with `staleTime` to reduce RPC calls
- Consider pagination if users have many positions

---

### 4. Implement Action Handlers

**File:** `src/components/stake/lpStaking/LpStakingArea.tsx`

#### **A. Subscribe Action**

```typescript
const handleSubscribe = async (tokenId: bigint) => {
  setSubscribingTokenId(tokenId);
  try {
    // Step 1: Check if NFT is approved for staker contract
    const approved = await readContract({
      ...NonfungiblePositionManagerContract,
      functionName: 'getApproved',
      args: [tokenId],
    });

    // Step 2: If not approved, request approval
    if (approved.toLowerCase() !== UniswapV3StakerContract.address.toLowerCase()) {
      await writeContract({
        ...NonfungiblePositionManagerContract,
        functionName: 'approve',
        args: [UniswapV3StakerContract.address, tokenId],
      });
      // Wait for approval transaction to confirm
    }

    // Step 3: Transfer NFT to staker (this deposits it)
    await writeContract({
      ...NonfungiblePositionManagerContract,
      functionName: 'safeTransferFrom',
      args: [address, UniswapV3StakerContract.address, tokenId],
    });
    // Wait for transfer transaction to confirm

    // Step 4: Stake in all active incentives using multicall
    const incentives = getCurrentActiveIncentives();
    const stakeCalls = incentives.map(incentive =>
      encodeFunctionData({
        abi: UniswapV3StakerContract.abi,
        functionName: 'stakeToken',
        args: [incentive, tokenId],
      })
    );

    await writeContract({
      ...UniswapV3StakerContract,
      functionName: 'multicall',
      args: [stakeCalls],
    });

    // Refresh positions
  } catch (error) {
    console.error('Subscribe failed:', error);
  } finally {
    setSubscribingTokenId(null);
  }
};
```

#### **B. Claim Action**

```typescript
const handleClaim = async (tokenId: bigint) => {
  setClaimingTokenId(tokenId);
  try {
    // Get accumulated rewards amount
    const rewardsAmount = await readContract({
      ...UniswapV3StakerContract,
      functionName: 'rewards',
      args: [SIR_ADDRESS, address],
    });

    // Claim all rewards (pass 0 for max amount)
    await writeContract({
      ...UniswapV3StakerContract,
      functionName: 'claimReward',
      args: [
        SIR_ADDRESS,     // rewardToken
        address,         // to
        0n,              // amountRequested (0 = claim all)
      ],
    });

    // Refresh positions
  } catch (error) {
    console.error('Claim failed:', error);
  } finally {
    setClaimingTokenId(null);
  }
};
```

#### **C. Unstake & Withdraw Action**

```typescript
const handleUnstake = async (tokenId: bigint) => {
  setUnstakingTokenId(tokenId);
  try {
    // Step 1: Unstake from all active incentives using multicall
    const incentives = getCurrentActiveIncentives();
    const unstakeCalls = incentives.map(incentive =>
      encodeFunctionData({
        abi: UniswapV3StakerContract.abi,
        functionName: 'unstakeToken',
        args: [incentive, tokenId],
      })
    );

    await writeContract({
      ...UniswapV3StakerContract,
      functionName: 'multicall',
      args: [unstakeCalls],
    });
    // Wait for unstake transaction to confirm

    // Step 2: Withdraw NFT to user's wallet
    await writeContract({
      ...UniswapV3StakerContract,
      functionName: 'withdrawToken',
      args: [
        tokenId,
        address,  // to
        '0x',     // data (empty bytes)
      ],
    });

    // Refresh positions
  } catch (error) {
    console.error('Unstake failed:', error);
  } finally {
    setUnstakingTokenId(null);
  }
};
```

**Notes:**
- Use `useWriteContract` and `useWaitForTransactionReceipt` from wagmi
- Show toast notifications for transaction status
- Invalidate/refetch position queries after successful transactions
- Handle transaction errors gracefully

---

### 5. Calculate APR

**Location:** Either in `useUserLpPositions` hook or separate hook

**Logic:**
```typescript
// Get total SIR rewards per second for the pool
const rewardRate = incentive.rewardAmount / (incentive.endTime - incentive.startTime);

// Get total liquidity staked in the incentive
const totalLiquidity = /* query from staker contract or subgraph */;

// Calculate APR
const secondsPerYear = 365 * 24 * 60 * 60;
const annualRewards = rewardRate * secondsPerYear;
const sirPrice = /* fetch from price API */;
const tvlUsd = /* calculate from total liquidity */;
const apr = (annualRewards * sirPrice / tvlUsd) * 100;
```

**Update:** `LpMetrics.tsx` to use calculated APR instead of `null`

---

## 📁 File Structure

```
src/
├── data/
│   └── uniswapIncentives.ts          ✅ Created (needs configuration)
├── contracts/
│   └── uniswapV3Staker.ts            ✅ Created
├── lib/
│   └── buildTimeData.ts              ✅ Modified
├── components/
│   └── stake/
│       ├── stakePage.tsx             ✅ Updated
│       ├── lpStaking/
│       │   ├── types.ts              ✅ Created
│       │   ├── LpMetrics.tsx         ✅ Created
│       │   ├── LpStakingArea.tsx     ✅ Created (needs actions)
│       │   ├── UnstakedPositionsList.tsx   ✅ Created
│       │   ├── StakedPositionsList.tsx     ✅ Created
│       │   └── hooks/
│       │       └── useUserLpPositions.ts   ⚠️ Stub (needs implementation)
│       └── sirStaking/
│           ├── SirStakingArea.tsx    ✅ Created
│           └── SirMetrics.tsx        ✅ Created
├── scripts/
│   └── generate-build-data.ts        ✅ Updated
└── public/
    └── build-data.json               ✅ Updated (needs regen)
```

---

## 🎯 Implementation Checklist

### Immediate Next Steps:
- [ ] Add `NEXT_PUBLIC_UNIV3_STAKER_ADDRESS` to `.env`
- [ ] Run `npm run generate:build-data`
- [ ] Add SIR/WETH 1% pool address to `uniswapIncentives.ts`
- [ ] Add actual incentive keys to `ACTIVE_INCENTIVES`

### Core Functionality:
- [ ] Implement `useUserLpPositions` hook
  - [ ] Fetch user's NFT balance
  - [ ] Fetch all token IDs
  - [ ] Fetch position details for each token
  - [ ] Filter for SIR/WETH 1% positions
  - [ ] Check staking status
  - [ ] Calculate USD values
  - [ ] Fetch accumulated rewards
- [ ] Implement Subscribe action handler
  - [ ] Check approval
  - [ ] Request approval if needed
  - [ ] Transfer NFT to staker
  - [ ] Stake in all active incentives (multicall)
- [ ] Implement Claim action handler
  - [ ] Fetch rewards amount
  - [ ] Call claimReward
- [ ] Implement Unstake action handler
  - [ ] Unstake from all incentives (multicall)
  - [ ] Withdraw NFT to wallet

### Polish:
- [ ] Calculate and display actual APR
- [ ] Add transaction notifications (toasts)
- [ ] Add error handling and user feedback
- [ ] Test with multiple positions
- [ ] Test with no positions
- [ ] Test all action flows end-to-end

---

## 🔍 Testing Guide

### Manual Testing Scenarios:

1. **No Positions**
   - Connect wallet with no LP positions
   - Should show "No unstaked positions" and "No staked positions"

2. **Unstaked Positions**
   - Connect wallet with SIR/WETH 1% LP NFTs in wallet
   - Should list positions with ID and USD value
   - "Subscribe" button should be enabled

3. **Subscribe Flow**
   - Click "Subscribe" on unstaked position
   - Should request NFT approval (if not approved)
   - Should transfer NFT to staker
   - Should stake in all active incentives
   - Position should move to staked list

4. **Staked Positions**
   - Should show position ID, USD value, and SIR rewards
   - Both "Claim" and "Unstake" buttons visible

5. **Claim Flow**
   - Click "Claim" on staked position
   - Should claim SIR rewards to wallet
   - Rewards value should reset to 0

6. **Unstake Flow**
   - Click "Unstake" on staked position
   - Should unstake from all incentives
   - Should withdraw NFT to wallet
   - Position should move to unstaked list

7. **No Active Incentives**
   - If `ACTIVE_INCENTIVES` is empty
   - "Subscribe" button should be disabled
   - Tooltip: "No active incentives available"

---

## 📚 Reference Links

- [Uniswap V3 Staker Docs](https://docs.uniswap.org/contracts/v3/reference/periphery/staker/UniswapV3Staker)
- [Uniswap V3 Staker Contract](https://github.com/Uniswap/v3-staker/blob/main/contracts/UniswapV3Staker.sol)
- [Medium Guide](https://medium.com/@msvstj/how-to-stake-in-uniswap-v3-part-i-b3846fe688d6)

---

## 💡 Design Decisions

1. **Why "Subscribe" instead of "Stake"?**
   - Staking in Uniswap V3 involves subscribing to specific incentive programs
   - "Subscribe" implies joining all available programs at once
   - Clearer distinction from SIR staking

2. **Why show only ID and USD value?**
   - All positions are SIR/WETH 1% (filter applied)
   - No need to show token pair or fee tier
   - Price range not relevant for staking decisions
   - Cleaner, simpler UI

3. **Why no "deposit" step?**
   - Combined deposit+stake into single "Subscribe" action
   - Better UX - fewer clicks
   - Uses multicall for atomic operation

4. **Why both Claim and Unstake buttons?**
   - Users may want to claim rewards without unstaking
   - Unstake automatically withdraws NFT to wallet
   - Gives users more control

---

## ⚠️ Important Notes

1. **Multicall for Efficiency**
   - Always use `multicall` when staking/unstaking multiple incentives
   - Reduces gas costs and improves UX (one transaction vs many)

2. **NFT Approval**
   - Users must approve Uniswap V3 Staker to transfer their NFT
   - Handle this automatically in the Subscribe flow
   - Use `getApproved` to check current approval status

3. **Position Filtering**
   - Only show SIR/WETH 1% positions
   - Filter by checking `token0`, `token1`, and `fee` from `positions(tokenId)`
   - Handle both token orderings (SIR/WETH or WETH/SIR)

4. **Reward Calculation**
   - `rewards(rewardToken, owner)` returns total accumulated rewards
   - This is across all staked positions for that user
   - To show per-position rewards, you may need to call `getRewardInfo(incentiveKey, tokenId)`

5. **Error Handling**
   - Always wrap contract calls in try-catch
   - Provide clear error messages to users
   - Revert UI state on transaction failure

---

## 🚀 Future Enhancements (Optional)

- Add subgraph queries for historical staking data
- Show projected rewards based on APR
- Add "Stake All" button for multiple unstaked positions
- Show in-range status and suggest when to adjust ranges
- Add "Compound" action (claim + re-stake)
- Display individual incentive details (not just aggregated)
- Add analytics: total rewards earned, time staked, etc.
