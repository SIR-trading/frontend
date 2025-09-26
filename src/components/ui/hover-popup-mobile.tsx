"use client";
import type { FC } from "react";
import React, { useState, useEffect } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "./hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { HoverCardArrow } from "@radix-ui/react-hover-card";
import { PopoverArrow } from "@radix-ui/react-popover";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const hoverPopupVariants = cva(
  "rounded-md bg-black/90 dark:bg-white/90 backdrop-blur-sm px-2 py-2 text-white dark:text-black text-left text-xs border border-white/20 dark:border-white/40 shadow-lg",
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

interface HoverPopupMobileProps extends VariantProps<typeof hoverPopupVariants> {
  trigger: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  alignOffset?: number;
  openDelay?: number;
  closeDelay?: number;
  asChild?: boolean;
  className?: string;
}

const HoverPopupMobile: FC<HoverPopupMobileProps> = ({ 
  trigger, 
  children, 
  size,
  side = "top",
  alignOffset = 10,
  openDelay = 0,
  closeDelay = 20,
  asChild = false,
  className
}) => {
  const [hasHover, setHasHover] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if device supports hover
    const checkHover = () => {
      setHasHover(window.matchMedia('(hover: hover)').matches);
    };
    
    checkHover();
    
    const mediaQuery = window.matchMedia('(hover: hover)');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', checkHover);
      return () => mediaQuery.removeEventListener('change', checkHover);
    }
  }, []);

  // Desktop with hover support
  if (hasHover) {
    return (
      <HoverCard
        openDelay={openDelay}
        closeDelay={closeDelay}
      >
        <HoverCardTrigger asChild={asChild} className={className}>
          {trigger}
        </HoverCardTrigger>
        <HoverCardContent
          side={side}
          alignOffset={alignOffset}
          className={hoverPopupVariants({ size })}
        >
          {children}
          <HoverCardArrow
            className="fill-black/90 dark:fill-white/90"
            height={15}
            width={14}
          />
        </HoverCardContent>
      </HoverCard>
    );
  }

  // Mobile without hover support - use Popover for click/tap
  // Wrap trigger to prevent event propagation
  const mobileWrapper = (
    <div 
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
      }}
      className="inline-block"
    >
      {trigger}
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        asChild={true}
        className={cn(className, "touch-underline")}
      >
        {mobileWrapper}
      </PopoverTrigger>
      <PopoverContent
        side={side}
        alignOffset={alignOffset}
        className={hoverPopupVariants({ size })}
      >
        {children}
        <PopoverArrow
          className="fill-black/90 dark:fill-white/90"
          height={15}
          width={14}
        />
      </PopoverContent>
    </Popover>
  );
};

export default HoverPopupMobile;