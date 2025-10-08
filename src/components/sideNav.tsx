"use client";
import {
  Menu,
  TrendingUp,
  Droplets,
  Briefcase,
  Coins,
  Trophy,
  Gavel,
  Plus,
  Calculator,
} from "lucide-react";
import React, { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/index";
import NetworkBadge from "./networkBadge";
import { useClaimableBalances } from "@/hooks/useClaimableBalances";
import { useActiveAuctions } from "@/hooks/useActiveAuctions";

export default function SideNav() {
  const [openModal, setOpen] = useState(false);
  const pathname = usePathname();
  const {
    hasDividendsAboveThreshold,
    hasContributorRewardsAboveThreshold,
    hasVaultRewardsAboveThreshold,
    hasLpStakingRewardsAboveThreshold
  } = useClaimableBalances();
  const { hasActiveAuctions } = useActiveAuctions();

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
        { url: "/create-vault", label: "Create Vault", icon: Plus },
        { url: "/leverage-calculator", label: "Calculator", icon: Calculator },
      ],
    },
  ];

  return (
    <div className="flex items-center md:hidden">
      <Sheet open={openModal} onOpenChange={setOpen}>
        <SheetTrigger className="rounded-md p-1.5 transition-colors hover:bg-accent">
          <Menu className="cursor-pointer" size={24} />
        </SheetTrigger>
        <SheetContent side="right" className="w-[180px]">
          <nav className="mt-8 space-y-6">
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
