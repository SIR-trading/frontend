"use client";
import type { FC } from "react";
import React from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "./hover-card";
import { HoverCardArrow } from "@radix-ui/react-hover-card";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

const hoverPopupVariants = cva(
  "rounded-md bg-black/90 dark:bg-white/90 backdrop-blur-sm px-2 py-2 text-white dark:text-black text-left text-xs border border-black/20 dark:border-white/10 shadow-lg",
  {
    variants: {
      size: {
        "200": "max-w-[200px]",
        "250": "max-w-[250px]",
        "300": "max-w-[300px]"
      },
    },
    defaultVariants: { size: "250" },
  },
);

interface HoverPopupProps extends VariantProps<typeof hoverPopupVariants> {
  trigger: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  alignOffset?: number;
  openDelay?: number;
  closeDelay?: number;
  asChild?: boolean;
}

const HoverPopup: FC<HoverPopupProps> = ({ 
  trigger, 
  children, 
  size,
  side = "top",
  alignOffset = 10,
  openDelay = 0,
  closeDelay = 20,
  asChild = false
}) => {
  return (
    <HoverCard
      openDelay={openDelay}
      closeDelay={closeDelay}
    >
      <HoverCardTrigger asChild={asChild}>
        {trigger}
      </HoverCardTrigger>
      <HoverCardContent side={side} alignOffset={alignOffset}>
        <div className={hoverPopupVariants({ size })}>{children}</div>
        <HoverCardArrow
          className="fill-black/90 dark:fill-white/90"
          height={15}
          width={14}
        />
      </HoverCardContent>
    </HoverCard>
  );
};

export default HoverPopup;