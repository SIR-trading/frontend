"use client";
import { Info } from "lucide-react";
import type { FC } from "react";
import React, { useState } from "react";
import { HoverCard } from "./hover-card";
import {
  HoverCardArrow,
  HoverCardContent,
  HoverCardTrigger,
} from "@radix-ui/react-hover-card";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

const tooltipVariants = cva(
  "max-w-[200px] rounded-md bg-primary/5 dark:bg-primary  backdrop-blur-xl px-2 py-2 text-foreground text-center",
  {
    variants: {
      size: { "200": "max-w-[200px]", "300": "max-w-[300px]" },
    },
    defaultVariants: { size: "200" },
  },
);
interface TooltipsProps extends VariantProps<typeof tooltipVariants> {
  children: React.ReactNode;
  iconSize?: number;
}

const ToolTip: FC<TooltipsProps> = ({ children, iconSize, size }) => {
  const [open, setOpen] = useState(false);
  return (
    <HoverCard
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
      }}
      openDelay={0}
      closeDelay={20}
    >
      <HoverCardTrigger
        onClick={() => setOpen(true)}
        className="text-foreground/60"
      >
        <Info size={iconSize ?? 16} />
      </HoverCardTrigger>
      <HoverCardContent side="top" alignOffset={10}>
        <div className={tooltipVariants({ size })}>{children}</div>
        <HoverCardArrow
          className="fill-primary/5 dark:fill-primary"
          height={15}
          width={14}
        />
      </HoverCardContent>
    </HoverCard>
  );
};

export default ToolTip;
