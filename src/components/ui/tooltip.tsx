"use client";
import { Info } from "lucide-react";
import type { FC } from "react";
import React, { useState, useEffect } from "react";
import HoverPopup from "./hover-popup";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { PopoverArrow } from "@radix-ui/react-popover";

interface TooltipsProps {
  children: React.ReactNode;
  iconSize?: number;
  size?: "200" | "250" | "300";
}

const ToolTip: FC<TooltipsProps> = ({ children, iconSize, size = "200" }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if device has touch capability
    const checkMobile = () => {
      setIsMobile(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0
      );
    };

    checkMobile();
    // No need to listen to resize events since we only care about touch capability
  }, []);

  const triggerElement = (
    <div className="text-foreground/60 cursor-pointer hover:text-foreground/80 transition-colors">
      <Info size={iconSize ?? 16} />
    </div>
  );

  const contentClasses = {
    "200": "max-w-[200px]",
    "250": "max-w-[250px]",
    "300": "max-w-[300px]"
  };

  // Use Popover for mobile/touch devices
  if (isMobile) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {triggerElement}
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="center"
          className={`rounded-md bg-zinc-950/80 dark:bg-zinc-950/80 backdrop-blur-xl px-2 py-2 text-foreground text-left text-xs border border-black/20 dark:border-white/10 shadow-lg ${contentClasses[size]}`}
        >
          {children}
          <PopoverArrow
            className="fill-black/20 dark:fill-white/10"
            height={15}
            width={14}
          />
        </PopoverContent>
      </Popover>
    );
  }

  // Use HoverPopup for desktop
  return (
    <HoverPopup
      size={size}
      trigger={triggerElement}
    >
      {children}
    </HoverPopup>
  );
};

export default ToolTip;
