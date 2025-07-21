# Enhanced Token Logo System with Assets.json Fallback

## Overview

The enhanced token logo system provides better image coverage by using a multi-tier fallback approach:

1. **Primary**: Trust Wallet assets repository (existing behavior)
2. **Secondary**: logoURI from assets.json (new fallback)
3. **Final**: Unknown token icon

**Special SIR Token Handling**: The SIR token is handled dynamically based on `NEXT_PUBLIC_SIR_ADDRESS` environment variable and is automatically included in the tokenlist without being hardcoded in assets.json.

## Migration Guide

### Option 1: Use the TokenImage Component (Recommended)

**Before:**
```tsx
import { getLogoAsset } from "@/lib/assets";
import ImageWithFallback from "@/components/shared/ImageWithFallback";

<ImageWithFallback
  src={getLogoAsset(tokenAddress as `0x${string}`)}
  width={28}
  height={28}
  alt=""
/>
```

**After:**
```tsx
import { TokenImage } from "@/components/shared/TokenImage";

<TokenImage
  address={tokenAddress as `0x${string}`}
  width={28}
  height={28}
  alt="Token logo"
/>
```

### Option 2: Use the Enhanced Hook

**Before:**
```tsx
import { getLogoAsset } from "@/lib/assets";

const logoSrc = getLogoAsset(tokenAddress as `0x${string}`);
```

**After:**
```tsx
import { useTokenLogo } from "@/hooks/useTokenLogo";

const { primary, fallback } = useTokenLogo(tokenAddress as `0x${string}`);

// Then use with ImageWithFallback:
<ImageWithFallback
  src={primary}
  secondaryFallbackUrl={fallback}
  width={28}
  height={28}
  alt="Token logo"
/>
```

### Option 3: Use the Utility Function

**Before:**
```tsx
import { getLogoAsset } from "@/lib/assets";

const logoSrc = getLogoAsset(tokenAddress as `0x${string}`);
```

**After:**
```tsx
import { getLogoAssetWithFallback } from "@/lib/assets";
import { useTokenlistContext } from "@/contexts/tokenListProvider";

const { tokenlist } = useTokenlistContext();
const { primary, fallback } = getLogoAssetWithFallback(
  tokenAddress as `0x${string}`, 
  tokenlist
);
```

## Benefits

- **Better Coverage**: Tokens not in Trust Wallet repo can still have logos from assets.json
- **Dynamic SIR Token**: SIR token metadata is based on environment variables, not hardcoded
- **Backward Compatible**: Existing `getLogoAsset()` calls continue to work
- **Graceful Degradation**: Falls back through multiple sources before showing unknown icon
- **Easy Migration**: Simple component swap in most cases

## SIR Token Handling

The SIR token is now handled dynamically:

- **Removed from assets.json**: No longer hardcoded in the static file
- **Environment-based**: Uses `NEXT_PUBLIC_SIR_ADDRESS` for address matching
- **Auto-injected**: Automatically added to tokenlist context for search functionality
- **Consistent metadata**: Uses `getSirTokenMetadata()` utility for consistent data

## Components to Update

Priority components that would benefit from this enhancement:

1. ✅ `searchTokensModal.tsx` - Token selection dropdown
2. ✅ `vaultTableRow.tsx` - Vault table token logos  
3. `transactionSuccess.tsx` - Transaction result display
4. `burnTableRow.tsx` - Portfolio burn table
5. `dropDown.tsx` - Token dropdown components
6. `transactionInfoCreateVault.tsx` - Vault creation UI

## Assets.json Structure

The system uses the existing `logoURI` field from assets.json. **Note**: SIR token is no longer included in assets.json as it's handled dynamically.

```json
{
  "name": "Token Name",
  "address": "0x...",
  "symbol": "SYMBOL", 
  "logoURI": "https://example.com/token-logo.png"
}
```

## Environment Variables Required

- `NEXT_PUBLIC_SIR_ADDRESS`: The address of the SIR token contract
- `NEXT_PUBLIC_CHAIN_ID`: The chain ID for the current environment
