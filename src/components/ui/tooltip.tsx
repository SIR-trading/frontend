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
  return (
    <HoverPopup
      size={size}
      trigger={
        <div className="text-foreground/60 cursor-default">
          <Info size={iconSize ?? 16} />
        </div>
      }
    >
      {children}
    </HoverPopup>
  );
};

export default ToolTip;
