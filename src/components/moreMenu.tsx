"use client";
import { ChevronDown, Coins, Trophy, Gavel, Plus, Calculator } from "lucide-react";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/index";
import { useClaimableBalances } from "@/hooks/useClaimableBalances";

interface MoreMenuProps {
  variant?: "medium" | "large";
}

interface MenuItem {
  url: string;
  label: string;
  icon: typeof Coins;
  hasContributorRewards?: boolean;
  hasDividends?: boolean;
}

export default function MoreMenu({ variant = "large" }: MoreMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { hasDividendsAboveThreshold, hasContributorRewardsAboveThreshold } = useClaimableBalances();

  const mediumItems: MenuItem[] = [
    {
      url: "/stake",
      label: "Stake",
      icon: Coins,
      hasContributorRewards: hasContributorRewardsAboveThreshold,
      hasDividends: hasDividendsAboveThreshold
    },
    { url: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { url: "/auctions", label: "Auctions", icon: Gavel },
    { url: "/create-vault", label: "Create Vault", icon: Plus },
    { url: "/leverage-calculator", label: "Calculator", icon: Calculator },
  ];

  const largeItems: MenuItem[] = [
    { url: "/create-vault", label: "Create Vault", icon: Plus },
    { url: "/leverage-calculator", label: "Calculator", icon: Calculator },
  ];

  const items = variant === "medium" ? mediumItems : largeItems;
  
  const isActiveInDropdown = items.some(item => pathname === item.url);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className={cn(
        "flex items-center gap-1 whitespace-nowrap cursor-pointer rounded-md px-2 py-1",
        "hover:text-foreground text-foreground/50 outline-none",
        isActiveInDropdown && "text-foreground"
      )}>
        More
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform duration-200",
          open && "rotate-180"
        )} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-md border border-border">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.url} asChild className="focus:bg-transparent">
              <Link
                href={item.url}
                className={cn(
                  "flex items-center gap-2 w-full cursor-pointer text-foreground/60",
                  "hover:text-foreground dark:hover:text-white",
                  pathname === item.url && "text-foreground dark:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.hasContributorRewards && (
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
                {item.hasDividends && (
                  <span
                    className="ml-auto inline-block rounded-full animate-pulse"
                    style={{
                      width: '6px',
                      height: '6px',
                      backgroundColor: '#22c55e',
                      minWidth: '6px',
                      minHeight: '6px',
                      marginLeft: item.hasContributorRewards ? '4px' : 'auto'
                    }}
                  />
                )}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}