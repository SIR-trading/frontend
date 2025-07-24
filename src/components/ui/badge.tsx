import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/index";

const badgeVariants = cva(
  "inline-flex items-center w-[64px] gap-x-[2px] rounded-md border flex justify-center py-0.2 md:py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-accent hover:bg-accent-100 text-accent-foreground",
        yellow: "border-transparent bg-[#FDBA3D] hover:bg-[#F29E02] text-accent-foreground",
        green:
          "border-transparent bg-accent hover:bg-accent-200 text-accent-foreground",
        red: "border-transparent bg-red text-white hover:bg-red-200 ",
        destructive:
          "border-transparent bg-destructive hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
