import { env } from "@/env";
import type { TAddressString } from "@/lib/types";
import { LeverageTier } from "@/lib/types";
export const RPC_URL = "";
export const WETH_ADDRESS = (
  env.NEXT_PUBLIC_CHAIN_ID === "1"
    ? "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2".toLowerCase()
    : "0xfff9976782d46cc05630d1f6ebab18b2324d6b14".toLowerCase()
) as TAddressString;
export const SIR_USD_PRICE = "0.00008271298";
export const ASSET_REPO =
  "https://raw.githubusercontent.com/SIR-trading/assets/master";
export const BASE_FEE = parseFloat(env.NEXT_PUBLIC_BASE_FEE);
export const L_FEE = parseFloat(env.NEXT_PUBLIC_MINTING_FEE);

export const LeverageTiers = {
  [LeverageTier.one]: -1,
  [LeverageTier.two]: -2,
  [LeverageTier.three]: -3,
  [LeverageTier.four]: -4,
};

//redeploy
