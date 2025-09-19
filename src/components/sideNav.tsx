"use client";
import { Menu, TrendingUp, Droplets, Briefcase, Coins, Trophy, Gavel, Plus, Calculator } from "lucide-react";
import React, { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader } from "./ui/sheet";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/index";
import { env } from "@/env";
import NetworkBadge from "./networkBadge";

export default function SideNav() {
  const [openModal, setOpen] = useState(false);
  const pathname = usePathname();

  // Determine if we're on a HyperEVM chain
  const isHyperEVM = useMemo(() => {
    const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
    return chainId === 998 || chainId === 999;
  }, []);

  // Determine which logos to use based on chain
  const logos = useMemo(() => {
    if (isHyperEVM) {
      return {
        dark: "/SIR+HyperLiquid_outline_white.svg",
        light: "/SIR+HyperLiquid_outline_black.svg"
      };
    }
    return {
      dark: "/SIR_outline_white.svg",
      light: "/SIR_outline_black.svg"
    };
  }, [isHyperEVM]);

  const menuItems = [
    { 
      section: "Trading",
      items: [
        { url: "/", label: "Leverage", icon: TrendingUp },
        { url: "/liquidity", label: "Liquidity", icon: Droplets },
        { url: "/portfolio", label: "Portfolio", icon: Briefcase },
      ]
    },
    {
      section: "Features",
      items: [
        { url: "/stake", label: "Stake", icon: Coins },
        { url: "/leaderboard", label: "Leaderboard", icon: Trophy },
        { url: "/auctions", label: "Auctions", icon: Gavel },
      ]
    },
    {
      section: "Tools",
      items: [
        { url: "/create-vault", label: "Create Vault", icon: Plus },
        { url: "/leverage-calculator", label: "Calculator", icon: Calculator },
      ]
    }
  ];

  return (
    <div className="flex items-center md:hidden">
      <Sheet open={openModal} onOpenChange={setOpen}>
        <SheetTrigger className="rounded-md p-1.5 hover:bg-accent transition-colors">
          <Menu className="cursor-pointer" size={24} />
        </SheetTrigger>
        <SheetContent side="right" className="w-[220px] sm:w-[260px]">
          <nav className="space-y-6 mt-8">
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
                      <li key={item.url}>
                        <Link
                          href={item.url}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            isActive && "bg-accent text-accent-foreground font-medium"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Network Badge at the bottom of mobile menu */}
          <div className="mt-8 pt-6 border-t border-foreground/10">
            <div className="flex justify-center">
              <NetworkBadge variant="full" className="w-full max-w-[200px]" />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
