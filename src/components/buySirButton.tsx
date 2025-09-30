"use client";
import { Button } from "./ui/button";
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
      // HyperSwap URL - using the same interface as Uniswap but on HyperEVM
      // You might need to update this URL to the actual HyperSwap interface
      const baseUrl = "https://app.hyperswap.fi/#/swap";
      return {
        dexName: "HyperSwap",
        dexUrl: `${baseUrl}?outputCurrency=${sirAddress}`
      };
    }

    // Ethereum mainnet
    if (chainId === 1) {
      return {
        dexName: "Uniswap",
        dexUrl: `https://app.uniswap.org/swap?outputCurrency=${sirAddress}&chain=mainnet`
      };
    }

    // Sepolia testnet
    if (chainId === 11155111) {
      return {
        dexName: "Uniswap",
        dexUrl: `https://app.uniswap.org/swap?outputCurrency=${sirAddress}&chain=sepolia`
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
    <Button
      variant="outline"
      className="rounded-full py-1 gap-1.5 text-sm"
      asChild
    >
      <a
        href={dexUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`Buy SIR on ${dexName}`}
      >
        Buy SIR
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </Button>
  );
}