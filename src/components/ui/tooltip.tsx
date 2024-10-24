import { Info } from "lucide-react";
import type { FC } from "react";
import React from "react";
import { HoverCard } from "./hover-card";
import {
  HoverCardArrow,
  HoverCardContent,
  HoverCardTrigger,
} from "@radix-ui/react-hover-card";
interface TooltipsProps {
  children: React.ReactNode;
  size?: number;
}

const ToolTip: FC<TooltipsProps> = ({ children, size }) => {
  return (
    <HoverCard openDelay={0} closeDelay={20}>
      <HoverCardTrigger>
        <Info size={size ?? 16} />
      </HoverCardTrigger>
      <HoverCardContent side="top" alignOffset={10}>
        <div className="max-w-[200px] rounded-md bg-white px-2 py-2 text-gray-800">
          {children}
        </div>
        <HoverCardArrow className="fill-white" height={15} width={14} />
      </HoverCardContent>
    </HoverCard>
  );
};

export default ToolTip;
