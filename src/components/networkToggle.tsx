"use client";

import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { CHAIN_CONFIGS, type ChainConfig } from "@/config/chains";
import { env } from "@/env";
import { useTokenlistContext } from "@/contexts/tokenListProvider";
import { getNativeTokenLogo } from "@/lib/assets";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils/index";

// Helper function to get logo URL for any network's native token
function getNetworkLogoUrl(chain: ChainConfig): string {
  // MegaETH uses its own logo, not ETH
  if (chain.chainId === 6343) {
    return "https://coin-images.coingecko.com/coins/images/69995/large/ICON.png?1760337992";
  }
  const symbol = chain.nativeCurrency.symbol;
  // Native token logos from CoinGecko
  if (symbol === "ETH") {
    return "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501628";
  }
  if (symbol === "HYPE") {
    return "https://coin-images.coingecko.com/coins/images/50882/large/hyperliquid.jpg?1729431300";
  }
  return "";
}

export default function NetworkToggle() {
  const currentChainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  const currentChain = CHAIN_CONFIGS[currentChainId];
  const { tokenMap } = useTokenlistContext();
  const [open, setOpen] = useState(false);

  // Get native token logo for current chain (fallback to getNetworkLogoUrl if not in tokenMap)
  const nativeLogoUrl = getNativeTokenLogo(tokenMap) ?? (currentChain ? getNetworkLogoUrl(currentChain) : undefined);

  // Get all chains with deployment URLs (including current for display)
  const allNetworks = React.useMemo(() => {
    return Object.values(CHAIN_CONFIGS).filter(
      (chain) =>
        chain.deploymentUrl &&
        chain.deploymentUrl.trim() !== ""
    );
  }, []);

  // If no networks available, don't show the toggle
  if (allNetworks.length === 0) {
    return null;
  }

  const handleNetworkSwitch = (deploymentUrl: string) => {
    // Preserve the current path when switching networks
    const currentPath = window.location.pathname;
    const url = new URL(deploymentUrl);
    url.pathname = currentPath;
    window.location.href = url.toString();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          "mr-2 flex items-center gap-1 rounded-full py-1 px-2",
          "border border-foreground/20",
          "transition-all duration-200 ease-in-out",
          "hover:border-foreground/40 hover:bg-gold hover:text-white",
          "outline-none cursor-pointer"
        )}
      >
        {nativeLogoUrl ? (
          <Image
            src={nativeLogoUrl}
            alt={currentChain?.nativeCurrency.symbol ?? "Network"}
            width={20}
            height={20}
            className={cn(
              "rounded-full",
              currentChainId === 6343 && "bg-[#f5f5dc]"
            )}
          />
        ) : (
          <span className="text-xs font-semibold w-[20px] h-[20px] flex items-center justify-center">
            {currentChain?.nativeCurrency.symbol ?? "ETH"}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
        <span className="sr-only">Switch network</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 bg-background/95 backdrop-blur-md border border-border"
      >
        {allNetworks.map((network) => {
          const isCurrentNetwork = network.chainId === currentChainId;
          const logoUrl = getNetworkLogoUrl(network);
          return (
            <DropdownMenuItem
              key={network.chainId}
              className={cn(
                "focus:bg-transparent cursor-pointer",
                isCurrentNetwork && "opacity-50 cursor-default"
              )}
              onClick={() => !isCurrentNetwork && handleNetworkSwitch(network.deploymentUrl!)}
            >
              <div className="flex items-center gap-2 w-full">
                {logoUrl ? (
                  <div className={cn(
                    "w-5 h-5 rounded-full overflow-hidden flex items-center justify-center",
                    network.chainId === 6343 && "bg-[#f5f5dc]"
                  )}>
                    <Image
                      src={logoUrl}
                      alt={network.nativeCurrency.symbol}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  </div>
                ) : (
                  <div className="w-5 h-5 flex items-center justify-center">
                    <span className="text-xs font-semibold">
                      {network.nativeCurrency.symbol}
                    </span>
                  </div>
                )}
                <span className={cn(
                  "text-sm",
                  isCurrentNetwork ? "text-foreground font-medium" : "text-foreground/60 hover:text-foreground"
                )}>
                  {network.name.replace(" Mainnet", "")}
                </span>
                {isCurrentNetwork && (
                  <span className="ml-auto text-xs text-foreground/40">✓</span>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
