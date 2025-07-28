import { env } from "@/env";
import type { TAddressString } from "@/lib/types";
import { LeverageTier } from "@/lib/types";

export const RPC_URL = "";
export const WETH_ADDRESS = (
  env.NEXT_PUBLIC_CHAIN_ID === "1"
    ? "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2".toLowerCase()
    : "0xfff9976782d46cc05630d1f6ebab18b2324d6b14".toLowerCase()
) as TAddressString;
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
