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

interface MoreMenuProps {
  variant?: "medium" | "large";
}

export default function MoreMenu({ variant = "large" }: MoreMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const mediumItems = [
    { url: "/stake", label: "Stake", icon: Coins },
    { url: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { url: "/auctions", label: "Auctions", icon: Gavel },
    { url: "/create-vault", label: "Create Vault", icon: Plus },
    { url: "/leverage-calculator", label: "Calculator", icon: Calculator },
  ];

  const largeItems = [
    { url: "/create-vault", label: "Create Vault", icon: Plus },
    { url: "/leverage-calculator", label: "Calculator", icon: Calculator },
  ];

  const items = variant === "medium" ? mediumItems : largeItems;
  
  const isActiveInDropdown = items.some(item => pathname === item.url);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className={cn(
        "flex items-center gap-1 whitespace-nowrap cursor-pointer rounded-md px-2 py-1",
        "hover:text-foreground text-foreground/50 outline-none transition-all duration-200",
        "hover:bg-accent/50",
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
            <DropdownMenuItem key={item.url} asChild>
              <Link
                href={item.url}
                className={cn(
                  "flex items-center gap-2 w-full cursor-pointer text-foreground/60 hover:text-foreground",
                  pathname === item.url && "text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}