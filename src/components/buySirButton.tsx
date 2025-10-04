"use client";
import { ExternalLink } from "lucide-react";
import { env } from "@/env";
import { useMemo } from "react";
import buildData from "@/../public/build-data.json";

export function BuySirButton() {
  const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  const sirAddress = buildData.contractAddresses.sir;

  const { dexName, dexUrl } = useMemo(() => {
    // HyperEVM chains (998 testnet, 999 mainnet)
    if (chainId === 998 || chainId === 999) {
      return {
        dexName: "HyperSwap",
        dexUrl: `https://app.hyperswap.exchange/#/swap?inputCurrency=hype&outputCurrency=${sirAddress}`
      };
    }

    // Ethereum mainnet
    if (chainId === 1) {
      return {
        dexName: "Uniswap",
        dexUrl: `https://app.uniswap.org/swap?inputCurrency=ETH&outputCurrency=${sirAddress}&chain=mainnet`
      };
    }

    // Sepolia testnet
    if (chainId === 11155111) {
      return {
        dexName: "Uniswap",
        dexUrl: `https://app.uniswap.org/swap?inputCurrency=ETH&outputCurrency=${sirAddress}&chain=sepolia`
      };
    }

    // Default fallback
    return {
      dexName: "DEX",
      dexUrl: "#"
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
      title={`Buy SIR on ${dexName}`}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      Buy SIR on {dexName}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}