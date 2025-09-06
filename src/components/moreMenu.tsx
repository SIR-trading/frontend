"use client";
import { ChevronDown } from "lucide-react";
import React from "react";
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

  const mediumItems = [
    { url: "/stake", label: "Stake" },
    { url: "/leaderboard", label: "Leaderboard" },
    { url: "/auctions", label: "Auctions" },
    { url: "/create-vault", label: "Create Vault" },
    { url: "/leverage-calculator", label: "Calculator" },
  ];

  const largeItems = [
    { url: "/create-vault", label: "Create Vault" },
    { url: "/leverage-calculator", label: "Calculator" },
  ];

  const items = variant === "medium" ? mediumItems : largeItems;
  
  const isActiveInDropdown = items.some(item => pathname === item.url);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(
        "flex items-center gap-1 whitespace-nowrap cursor-pointer rounded-md px-2 hover:text-foreground text-foreground/50 outline-none",
        isActiveInDropdown && "text-foreground"
      )}>
        More
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-background border border-border">
        {items.map((item) => (
          <DropdownMenuItem key={item.url} asChild>
            <Link
              href={item.url}
              className={cn(
                "w-full cursor-pointer",
                pathname === item.url && "font-semibold"
              )}
            >
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}