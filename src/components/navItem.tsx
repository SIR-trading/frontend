"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const navItemVariants = cva(
  "whitespace-nowrap cursor-pointer rounded-md px-2 py-1 hover:text-foreground text-foreground/50 data-[active=true]:text-foreground",
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
  const path = usePathname();
  const active = url === path;
  return (
    <li className="mb-1">
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
