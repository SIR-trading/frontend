"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils/index";

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
  icon?: LucideIcon;
  hasNotification?: boolean;
  hasRewardsNotification?: boolean;
  hasDividendsNotification?: boolean;
  hasActiveAuctionsNotification?: boolean;
}
export default function NavItem({
  url,
  children,
  main,
  onClick,
  theme,
  className,
  icon: Icon,
  hasNotification,
  hasRewardsNotification,
  hasDividendsNotification,
  hasActiveAuctionsNotification,
}: Props) {
  const [active, setActive] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // This effect will run on the client after hydration
    setActive(pathname === url);
  }, [pathname, url]);

  return (
    <li className="relative inline-flex items-center">
      <Link
        data-active={active ? "true" : "false"}
        data-main={main ? "true" : "false"}
        className={cn(navItemVariants({ theme, className }), "inline-flex items-center gap-1.5 align-baseline")}
        onClick={onClick}
        href={url}
      >
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {children}
        {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
        {(hasRewardsNotification || hasDividendsNotification || hasActiveAuctionsNotification) && (
          <span className="ml-1.5 inline-flex flex-col gap-1">
            {hasRewardsNotification && (
              <span
                className="inline-block rounded-full animate-pulse"
                style={{
                  width: '4px',
                  height: '4px',
                  backgroundColor: '#c6a85b',
                  minWidth: '4px',
                  minHeight: '4px'
                }}
              />
            )}
            {hasDividendsNotification && (
              <span
                className="inline-block rounded-full animate-pulse"
                style={{
                  width: '4px',
                  height: '4px',
                  backgroundColor: '#22c55e',
                  minWidth: '4px',
                  minHeight: '4px',
                  marginTop: hasRewardsNotification ? '0' : '0'
                }}
              />
            )}
            {hasActiveAuctionsNotification && (
              <span
                className="inline-block rounded-full animate-pulse"
                style={{
                  width: '4px',
                  height: '4px',
                  backgroundColor: '#3b82f6',
                  minWidth: '4px',
                  minHeight: '4px'
                }}
              />
            )}
            {hasNotification && !hasRewardsNotification && !hasDividendsNotification && !hasActiveAuctionsNotification && (
              <span
                className="inline-block rounded-full animate-pulse"
                style={{
                  width: '5px',
                  height: '5px',
                  backgroundColor: '#22c55e',
                  minWidth: '5px',
                  minHeight: '5px'
                }}
              />
            )}
          </span>
        )}
      </Link>
    </li>
  );
}
