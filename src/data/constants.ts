import { env } from "@/env";
import type { TAddressString } from "@/lib/types";
import { LeverageTier } from "@/lib/types";
import { getWrappedNativeTokenAddress } from "@/config/chains";

export const RPC_URL = "";
export const WRAPPED_NATIVE_TOKEN_ADDRESS = getWrappedNativeTokenAddress(parseInt(env.NEXT_PUBLIC_CHAIN_ID)).toLowerCase() as TAddressString;
// Special address to represent native tokens (ETH, HYPE) in assets.json
export const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE".toLowerCase() as TAddressString;
export const ASSET_REPO =
  "https://raw.githubusercontent.com/trustwallet/assets/master";

// ❌ DEPRECATED: BASE_FEE and L_FEE have been removed
// ✅ Use simple static imports instead:
// import { BASE_FEE, VAULT_ADDRESS } from '@/lib/buildData';

export const LeverageTiers = {
  [LeverageTier.one]: -1,
  [LeverageTier.two]: -2,
  [LeverageTier.three]: -3,
  [LeverageTier.four]: -4,
};

//redeploy
