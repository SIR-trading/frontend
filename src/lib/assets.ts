import { ASSET_REPO } from "@/data/constants";
import { env } from "@/env";
import sirIcon from "../../public/images/white-logo.svg";
import type { StaticImageData } from "next/image";
import { getAddress } from "viem";
import type { TAddressString } from "./types";
import { assetSchema } from "./schemas";

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
