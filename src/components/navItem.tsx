"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const navItemVariants = cva(
  "whitespace-nowrap cursor-pointer shadow-sm rounded-md px-2 py-1 dark:data-[active=true]:text-white  data-[active=true]:text-gray-50 text-gray-50/50",
  {
    variants: {
      theme: {
        light: "text-white hover:text-gold data-[active=true]:text-gold",
        dark: "hover:text-white",
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
        style={{ textShadow: "black 0px 4px" }}
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
