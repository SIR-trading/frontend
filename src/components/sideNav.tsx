"use client";
import {
  Menu,
  TrendingUp,
  Droplets,
  Briefcase,
  Coins,
  LineChart,
  Trophy,
  Gavel,
  Plus,
  Calculator,
  ChevronDown,
  Settings,
} from "lucide-react";
import React, { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/index";
import NetworkBadge from "./networkBadge";
import { useClaimableBalances } from "@/hooks/useClaimableBalances";
import { useActiveAuctions } from "@/hooks/useActiveAuctions";
import { useIsSystemControlOwner } from "@/hooks/useIsSystemControlOwner";
import { CHAIN_CONFIGS, type ChainConfig } from "@/config/chains";
import { env } from "@/env";
import Image from "next/image";

// Helper function to get logo URL for any network's native token
function getNetworkLogoUrl(chain: ChainConfig): string {
  // MegaETH uses its own logo, not ETH
  if (chain.chainId === 6343) {
    return "https://coin-images.coingecko.com/coins/images/69995/large/ICON.png?1760337992";
  }
  const symbol = chain.nativeCurrency.symbol;
  if (symbol === "ETH") {
    return "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501628";
  }
  if (symbol === "HYPE") {
    return "https://coin-images.coingecko.com/coins/images/50882/large/hyperliquid.jpg?1729431300";
  }
  return "";
}

export default function SideNav() {
  const [openModal, setOpen] = useState(false);
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
  const pathname = usePathname();
  const currentChainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  const currentChain = CHAIN_CONFIGS[currentChainId];

  const {
    hasDividendsAboveThreshold,
    hasContributorRewardsAboveThreshold,
    hasVaultRewardsAboveThreshold,
    hasLpStakingRewardsAboveThreshold
  } = useClaimableBalances();
  const { hasActiveAuctions } = useActiveAuctions();
  const isOwner = useIsSystemControlOwner();

  // Get all available networks with deployment URLs
  const availableNetworks = useMemo(() => {
    return Object.values(CHAIN_CONFIGS).filter(
      (chain) =>
        chain.deploymentUrl &&
        chain.deploymentUrl.trim() !== ""
    );
  }, []);

  const handleNetworkSwitch = (deploymentUrl: string) => {
    window.location.href = deploymentUrl;
  };

  const menuItems = [
    {
      section: "Trading",
      items: [
        { url: "/", label: "Leverage", icon: TrendingUp },
        { url: "/liquidity", label: "Liquidity", icon: Droplets },
        { url: "/portfolio", label: "Portfolio", icon: Briefcase },
      ],
    },
    {
      section: "Features",
      items: [
        { url: "/stake", label: "Stake", icon: Coins },
        { url: "/leaderboard", label: "Leaderboard", icon: Trophy },
        { url: "/auctions", label: "Auctions", icon: Gavel },
      ],
    },
    {
      section: "Tools",
      items: [
        { url: "/market", label: "Market", icon: LineChart },
        { url: "/create-vault", label: "Create Vault", icon: Plus },
        { url: "/leverage-calculator", label: "Calculator", icon: Calculator },
        ...(isOwner ? [{ url: "/admin", label: "Admin", icon: Settings }] : []),
      ],
    },
  ];

  return (
    <div className="flex items-center nav:hidden">
      <Sheet open={openModal} onOpenChange={setOpen}>
        <SheetTrigger className="rounded-md p-1.5 transition-colors hover:bg-accent">
          <Menu className="cursor-pointer" size={24} />
        </SheetTrigger>
        <SheetContent side="right" className="w-[180px]">
          {/* Network Switcher - only shown below 450px */}
          <div className="network:hidden mt-8 mb-4 pb-4 border-b border-foreground/10">
            <DropdownMenu open={networkDropdownOpen} onOpenChange={setNetworkDropdownOpen}>
              <DropdownMenuTrigger
                className={cn(
                  "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-all w-full",
                  "hover:bg-gold hover:text-white",
                  "outline-none cursor-pointer"
                )}
              >
                {(() => {
                  const logoUrl = currentChain ? getNetworkLogoUrl(currentChain) : "";
                  return logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={currentChain?.nativeCurrency.symbol ?? "Network"}
                      width={16}
                      height={16}
                      className={cn(
                        "rounded-full flex-shrink-0",
                        currentChainId === 6343 && "bg-white"
                      )}
                    />
                  ) : null;
                })()}
                <span className="truncate flex-1 text-left">
                  {currentChain?.name.replace(" Mainnet", "").replace(" Testnet", "")}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200 flex-shrink-0",
                    networkDropdownOpen && "rotate-180"
                  )}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[164px] bg-background/95 backdrop-blur-md border border-border"
              >
                {availableNetworks.map((network) => {
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
                        {logoUrl && (
                          <Image
                            src={logoUrl}
                            alt={network.nativeCurrency.symbol}
                            width={16}
                            height={16}
                            className={cn(
                              "rounded-full flex-shrink-0",
                              network.chainId === 6343 && "bg-white"
                            )}
                          />
                        )}
                        <span className={cn(
                          "text-sm truncate",
                          isCurrentNetwork ? "text-foreground font-medium" : "text-foreground/60 hover:text-foreground"
                        )}>
                          {network.name.replace(" Mainnet", "").replace(" Testnet", "")}
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
          </div>
          <nav className="network:mt-8 mt-4 space-y-6">
            {menuItems.map((section) => (
              <div key={section.section}>
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
                  {section.section}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.url;
                    return (
                      <li key={item.url} className="relative">
                        <Link
                          href={item.url}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            isActive &&
                              "bg-accent font-medium text-accent-foreground",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                          {item.url === "/portfolio" && hasVaultRewardsAboveThreshold && (
                            <span
                              className="ml-auto inline-block rounded-full animate-pulse"
                              style={{
                                width: '6px',
                                height: '6px',
                                backgroundColor: '#c6a85b',
                                minWidth: '6px',
                                minHeight: '6px'
                              }}
                            />
                          )}
                          {item.url === "/stake" && (hasContributorRewardsAboveThreshold || hasLpStakingRewardsAboveThreshold) && (
                            <span
                              className="ml-auto inline-block rounded-full animate-pulse"
                              style={{
                                width: '6px',
                                height: '6px',
                                backgroundColor: '#c6a85b',
                                minWidth: '6px',
                                minHeight: '6px'
                              }}
                            />
                          )}
                          {item.url === "/stake" && hasDividendsAboveThreshold && (
                            <span
                              className="inline-block rounded-full animate-pulse"
                              style={{
                                width: '6px',
                                height: '6px',
                                backgroundColor: '#22c55e',
                                minWidth: '6px',
                                minHeight: '6px',
                                marginLeft: (hasContributorRewardsAboveThreshold || hasLpStakingRewardsAboveThreshold) ? '4px' : 'auto'
                              }}
                            />
                          )}
                          {item.url === "/auctions" && hasActiveAuctions && (
                            <span
                              className="ml-auto inline-block rounded-full animate-pulse"
                              style={{
                                width: '6px',
                                height: '6px',
                                backgroundColor: '#3b82f6',
                                minWidth: '6px',
                                minHeight: '6px'
                              }}
                            />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Network Badge at the bottom of mobile menu */}
          <div className="mt-8 border-t border-foreground/10 pt-6">
            <div className="flex justify-center">
              <NetworkBadge variant="full" className="w-full max-w-[200px]" />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
