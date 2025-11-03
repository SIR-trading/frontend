"use client";
import { Info } from "lucide-react";
import type { FC } from "react";
import React from "react";
import HoverPopup from "./hover-popup";

interface TooltipsProps {
  children: React.ReactNode;
  iconSize?: number;
  size?: "200" | "250" | "300";
}

const ToolTip: FC<TooltipsProps> = ({ children, iconSize, size = "200" }) => {
  const triggerElement = (
    <div className="text-foreground/60 cursor-pointer hover:text-foreground/80 transition-colors">
      <Info size={iconSize ?? 16} />
    </div>
  );

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
