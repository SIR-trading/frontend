import { ASSET_REPO } from "@/data/constants";
import { env } from "@/env";
import sirIcon from "../../public/images/white-logo.svg";
import type { StaticImageData } from "next/image";
import { getAddress } from "viem";
import type { TAddressString } from "./types";
import { assetSchema } from "./schemas";

/**
 * Get SIR token metadata dynamically based on environment
 */
export function getSirTokenMetadata() {
  return {
    name: "Synthetics Implemented Right",
    address: env.NEXT_PUBLIC_SIR_ADDRESS,
    symbol: "SIR",
    decimals: 12,
    chainId: parseInt(env.NEXT_PUBLIC_CHAIN_ID),
    logoURI: "https://app.sir.trading/images/white-logo.svg",
  };
}

export function getLogoAsset(
  address: `0x${string}` | undefined,
  chainId?: string,
) {
  if (!address) {
    return "";
  }
  const getChainName = () => {
    let chainIdEnv = env.NEXT_PUBLIC_CHAIN_ID;
    if (chainId !== undefined) {
      chainIdEnv = chainId;
    }
    if (chainIdEnv === "1") {
      return "ethereum";
    }
    if (chainIdEnv === "11155111") {
      return "sepolia";
    }
    if (chainIdEnv === "17000") {
      return "holesky";
    }
  };
  if (address.toLowerCase() === env.NEXT_PUBLIC_SIR_ADDRESS.toLowerCase()) {
    return sirIcon as StaticImageData;
  }
  const chainName = getChainName();
  try {
    const asset = `${ASSET_REPO}/blockchains/${chainName}/assets/${getAddress(address)}/logo.png`;
    return asset;
  } catch {
    return "";
  }
}

/**
 * Enhanced logo asset function that falls back to assets.json logoURI
 * if Trust Wallet asset is not available
 */
export function getLogoAssetWithFallback(
  address: `0x${string}` | undefined,
  tokenList?: Array<{ address: string; logoURI: string }>,
  chainId?: string,
): { primary: string | StaticImageData; fallback?: string } {
  if (!address) {
    return { primary: "" };
  }
  
  // Handle SIR token dynamically based on environment
  if (address.toLowerCase() === env.NEXT_PUBLIC_SIR_ADDRESS.toLowerCase()) {
    return {
      primary: sirIcon as StaticImageData,
      fallback: "https://app.sir.trading/images/white-logo.svg",
    };
  }
  
  // First try the standard Trust Wallet approach
  const primaryLogo = getLogoAsset(address, chainId);
  
  // Find fallback from tokenlist
  const token = tokenList?.find(
    (t) => t.address.toLowerCase() === address.toLowerCase()
  );
  
  return {
    primary: primaryLogo,
    fallback: token?.logoURI,
  };
}

export function getLogoJson(address: `0x${string}` | undefined) {
  if (!address) {
    return "";
  }
  const getChainName = () => {
    const chainId = env.NEXT_PUBLIC_CHAIN_ID;
    if (chainId === "1") {
      return "ethereum";
    }
    if (chainId === "11155111") {
      return "sepolia";
    }
    if (chainId === "17000") {
      return "holesky";
    }
  };

  const chainName = getChainName();
  return `${ASSET_REPO}/blockchains/${chainName}/assets/${getAddress(address)}/info.json`;
}
export async function getAssetInfo(address: TAddressString | undefined) {
  if (!address) {
    throw Error("No address provided.");
  }
  const result: unknown = await fetch(
    `${ASSET_REPO}/blockchains/ethereum/assets/${getAddress(address)}/info.json`,
  ).then((r) => r.json());
  return assetSchema.safeParse(result);
}
