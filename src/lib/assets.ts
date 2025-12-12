import { ASSET_REPO, NATIVE_TOKEN_ADDRESS } from "@/data/constants";
import { env } from "@/env";
import buildData from "@/../public/build-data.json";

const SIR_ADDRESS = buildData.contractAddresses.sir as TAddressString;
import type { StaticImageData } from "next/image";
import sirIcon from "../../public/images/sir-logo.svg";
import sirIconHyperEVM from "../../public/images/sir-logo-hyperevm.svg";
import { getAddress } from "viem";
import type { TAddressString } from "./types";
import { assetSchema } from "./schemas";

/**
 * Get SIR token symbol based on chain ID
 */
export function getSirSymbol(chainId?: string | number): string {
  const id =
    typeof chainId === "string"
      ? parseInt(chainId)
      : chainId ?? parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  if (id === 999 || id === 998) return "HyperSIR";
  if (id === 6343) return "MegaSIR";
  return "SIR";
}

/**
 * Get SIR logo based on chain ID
 */
export function getSirLogo(chainId?: string | number): StaticImageData {
  const id =
    typeof chainId === "string"
      ? parseInt(chainId)
      : chainId ?? parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  return id === 999 || id === 998
    ? (sirIconHyperEVM as StaticImageData)
    : (sirIcon as StaticImageData);
}

/**
 * Get native token logo from tokenMap (retrieved from assets.json)
 */
export function getNativeTokenLogo(
  tokenMap?: Map<string, { address: string; logoURI?: string; isNative?: boolean }>,
): string | undefined {
  const nativeToken = tokenMap?.get(NATIVE_TOKEN_ADDRESS.toLowerCase());
  return nativeToken?.logoURI;
}

/**
 * Get native token info from tokenMap
 */
export function getNativeTokenInfo(
  tokenMap?: Map<string, { address: string; symbol?: string; name?: string; logoURI?: string; isNative?: boolean }>,
): { symbol?: string; name?: string; logoURI?: string } | undefined {
  const nativeToken = tokenMap?.get(NATIVE_TOKEN_ADDRESS.toLowerCase());
  if (!nativeToken) return undefined;
  return {
    symbol: nativeToken.symbol,
    name: nativeToken.name,
    logoURI: nativeToken.logoURI,
  };
}

/**
 * Get SIR token metadata dynamically based on build-time data
 */
export function getSirTokenMetadata() {
  const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  const isHyperEVM = chainId === 999 || chainId === 998;
  return {
    name: "Synthetics Implemented Right",
    address: SIR_ADDRESS,
    symbol: getSirSymbol(chainId),
    decimals: 12,
    chainId,
    logoURI: isHyperEVM
      ? "https://app.sir.trading/images/sir-logo-hyperevm.svg"
      : "https://app.sir.trading/images/sir-logo.svg",
  };
}

/**
 * Enhanced logo asset function that falls back to assets.json logoURI
 * if Trust Wallet asset is not available
 */
export function getLogoAssetWithFallback(
  address: TAddressString | undefined,
  tokenMap?: Map<string, { address: string; logoURI?: string }>,
  chainId?: string,
): { primary: string | StaticImageData; fallback?: string } {
  if (!address) {
    return { primary: "" };
  }

  // Handle SIR token dynamically based on build-time data
  if (address.toLowerCase() === SIR_ADDRESS.toLowerCase()) {
    const chainIdNum = chainId ? parseInt(chainId) : parseInt(env.NEXT_PUBLIC_CHAIN_ID);
    const isHyperEVM = chainIdNum === 999 || chainIdNum === 998;
    return {
      primary: getSirLogo(chainIdNum),
      fallback: isHyperEVM
        ? "https://app.sir.trading/images/sir-logo-hyperevm.svg"
        : "https://app.sir.trading/images/sir-logo.svg",
    };
  }

  // Determine current chain
  let chainIdEnv = env.NEXT_PUBLIC_CHAIN_ID;
  if (chainId !== undefined) {
    chainIdEnv = chainId;
  }

  // O(1) lookup using Map (performance optimization)
  const token = tokenMap?.get(address.toLowerCase());

  // Build Trust Wallet logo URL based on chain
  // Note: Trust Wallet may not have assets for all chains (e.g., HyperEVM)
  // In those cases, the ImageWithFallback component will automatically fall back to logoURI from assets.json
  const getChainName = () => {
    if (chainIdEnv === "1") {
      return "ethereum";
    }
    if (chainIdEnv === "11155111") {
      return "sepolia";
    }
    if (chainIdEnv === "17000") {
      return "holesky";
    }
    if (chainIdEnv === "998" || chainIdEnv === "999") {
      return "hyperevm"; // Will likely not exist in Trust Wallet, will fall back to logoURI
    }
    // Default to ethereum for unknown chains
    return "ethereum";
  };

  const chainName = getChainName();
  let primaryLogo: string | StaticImageData = "";

  try {
    const checksummedAddress = getAddress(address);
    primaryLogo = `${ASSET_REPO}/blockchains/${chainName}/assets/${checksummedAddress}/logo.png`;
  } catch {
    primaryLogo = "";
  }

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
    if (chainId === "998" || chainId === "999") {
      return "ethereum"; // Use ethereum assets for HyperEVM
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
