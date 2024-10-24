import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center w-[64px] gap-x-[2px] rounded-md border flex justify-center py-0.2 md:py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent text-white hover:bg-accent-100",
        yellow:
          "border-transparent bg-yellow text-secondary-foreground hover:bg-yellow-200",
        green:
          "border-transparent bg-accent text-secondary-foreground hover:bg-accent-200",
        orange:
          "border-transparent bg-orange text-tertiary-foreground hover:bg-orange-200 ",

        red: "border-transparent bg-red text-tertiary-foreground hover:bg-red-200 ",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
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
