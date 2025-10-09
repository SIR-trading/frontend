"use client";
import { ExternalLink } from "lucide-react";
import { env } from "@/env";
import { useMemo } from "react";
import buildData from "@/../public/build-data.json";

export function ManageDexLiquidityButton() {
  const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  const sirAddress = buildData.contractAddresses.sir;

  // Get the SIR/WETH 1% pool address from build data
  const SIR_WETH_POOL_ADDRESS = buildData.contractAddresses
    .sirWethPool1Percent as `0x${string}`;

  const { dexName, dexUrl } = useMemo(() => {
    // HyperEVM chains (998 testnet, 999 mainnet)
    // TODO: Check for dexUrl link validity
    if (chainId === 998 || chainId === 999) {
      return {
        dexName: "HyperSwap",
        dexUrl: `https://app.hyperswap.exchange/#/add/HYPE/${SIR_WETH_POOL_ADDRESS}`,
      };
    }

    // Ethereum mainnet
    if (chainId === 1) {
      return {
        dexName: "Uniswap",
        dexUrl: `https://app.uniswap.org/explore/pools/ethereum/${SIR_WETH_POOL_ADDRESS}`,
      };
    }

    // Sepolia testnet
    if (chainId === 11155111) {
      return {
        dexName: "Uniswap",
        dexUrl: `https://app.uniswap.org/explore/pools/ethereum_sepolia/${SIR_WETH_POOL_ADDRESS}`,
      };
    }

    // Default fallback
    return {
      dexName: "DEX",
      dexUrl: "#",
    };
  }, [chainId, sirAddress]);

  // Don't render if we don't have a valid URL
  if (dexUrl === "#") {
    return null;
  }

  return (
    <a
      href={dexUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`Add liquidity on ${dexName}`}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      Manage liquidity on {dexName}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}
