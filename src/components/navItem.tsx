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
  "whitespace-nowrap cursor-pointer rounded-md px-2 py-1 hover:text-foreground text-foreground/50 data-[active=true]:text-foreground transition-all duration-200 hover:bg-accent/50",
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
}
export default function NavItem({
  url,
  children,
  main,
  onClick,
  theme,
  className,
  icon: Icon,
}: Props) {
  const [active, setActive] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // This effect will run on the client after hydration
    setActive(pathname === url);
  }, [pathname, url]);

  return (
    <li>
      <Link
        data-active={active ? "true" : "false"}
        data-main={main ? "true" : "false"}
        className={cn(navItemVariants({ theme, className }), "inline-flex items-center gap-1.5 align-baseline")}
        onClick={onClick}
        href={url}
      >
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {children}
      </Link>
    </li>
  );
}
