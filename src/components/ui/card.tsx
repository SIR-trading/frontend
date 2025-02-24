import React, { type ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export interface CardProps
  extends React.HtmlHTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: ReactNode;
}
// rounded-md border-2 border-secondary-600/50 bg-secondary-600/40 p-2 text-2xl
const cardVariants = cva("rounded-[6px] p-[12px] md:p-[20px]", {
  variants: {
    variant: {
      default: "bg-secondary nav-shadow",
      secondary: "bg-secondary-600/40 md:p-3 text-2xl",
      transparent: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          cardVariants({
            variant,
            className,
          }),
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = "Card";

export { Card };
