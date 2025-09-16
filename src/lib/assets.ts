import { ASSET_REPO } from "@/data/constants";
import { env } from "@/env";
import buildData from "@/../public/build-data.json";

const SIR_ADDRESS = buildData.contractAddresses.sir as TAddressString;
import sirIcon from "../../public/images/white-logo.svg";
import type { StaticImageData } from "next/image";
import { getAddress } from "viem";
import type { TAddressString } from "./types";
import { assetSchema } from "./schemas";

/**
 * Get SIR token symbol based on chain ID
 */
export function getSirSymbol(chainId?: string | number): string {
  const id = typeof chainId === 'string' ? parseInt(chainId) : (chainId ?? parseInt(env.NEXT_PUBLIC_CHAIN_ID));
  return id === 999 || id === 998 ? "HyperSIR" : "SIR";
}

/**
 * Get SIR token metadata dynamically based on build-time data
 */
export function getSirTokenMetadata() {
  const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  return {
    name: "Synthetics Implemented Right",
    address: SIR_ADDRESS,
    symbol: getSirSymbol(chainId),
    decimals: 12,
    chainId,
    logoURI: "https://app.sir.trading/images/white-logo.svg",
  };
}

/**
 * Enhanced logo asset function that falls back to assets.json logoURI
 * if Trust Wallet asset is not available
 */
export function getLogoAssetWithFallback(
  address: TAddressString | undefined,
  tokenList?: Array<{ address: string; logoURI?: string }>,
  chainId?: string,
): { primary: string | StaticImageData; fallback?: string } {
  if (!address) {
    return { primary: "" };
  }
  
  // Handle SIR token dynamically based on build-time data
  if (address.toLowerCase() === SIR_ADDRESS.toLowerCase()) {
    return {
      primary: sirIcon as StaticImageData,
      fallback: "https://app.sir.trading/images/white-logo.svg",
    };
  }
  
  // Build Trust Wallet logo URL
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
  
  const chainName = getChainName();
  let primaryLogo: string | StaticImageData = "";
  
  try {
    primaryLogo = `${ASSET_REPO}/blockchains/${chainName}/assets/${getAddress(address)}/logo.png`;
  } catch {
    primaryLogo = "";
  }
  
  // Find fallback from tokenlist
  const token = tokenList?.find(
    (t) => t.address.toLowerCase() === address.toLowerCase()
  );
  
  return {
    primary: primaryLogo,
    fallback: token?.logoURI,
  };
}

/**
 * Simple wrapper that returns the primary logo URL for backward compatibility
 * with components that expect a simple string/StaticImageData
 */
export function getLogoAssetWithFallbackSimple(
  address: TAddressString | undefined,
  chainId?: string,
): string | StaticImageData {
  const result = getLogoAssetWithFallback(address, undefined, chainId);
  return result.primary;
}

export function getLogoJson(address: TAddressString | undefined) {
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
