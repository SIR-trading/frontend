"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
        className={cn(navItemVariants({ theme, className }))}
        onClick={onClick}
        href={url}
      >
        {children}
      </Link>
    </li>
  );
}
