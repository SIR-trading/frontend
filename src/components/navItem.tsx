"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";

import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const navItemVariants = cva(
  "whitespace-nowrap cursor-pointer rounded-md px-2 hover:text-foreground text-foreground/50 data-[active=true]:text-foreground",
  {
    variants: {
      theme: {
        light: "",
        dark: "",
      },
    },
    defaultVariants: {
      theme: "dark",
    },
  },
);
interface Props extends VariantProps<typeof navItemVariants> {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  url: string;
  main?: boolean;
}
export default function NavItem({
  url,
  children,
  main,
  onClick,
  theme,
  className,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  
  useEffect(() => {
    setMounted(true);
    // Get pathname on client side only
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, []);
  
  // Only check for active state after mounting to avoid hydration mismatch
  const active = mounted ? url === currentPath : false;
  return (
    <li>
      <Link
        data-active={active ? "true" : "false"}
        data-main={main ? "true" : "false"}
        className={cn(navItemVariants({ theme, className }))}
        onClick={onClick}
        href={url}
      >
        {children}
      </Link>
    </li>
  );
}
