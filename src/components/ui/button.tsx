import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background" +
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring px-2" +
    " focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ",
  {
    variants: {
      variant: {
        default: "bg-accent/60 hover:bg-accent text-accent-foreground",
        accent: "bg-accent hover:bg-accent/60 text-[#FBDED0] py-2 px-4",
        brown: "bg-brown-700 text-brown-100 hover:bg-brown-800 py-2 px-4",
        card: "bg-primary  text-white",
        outline:
          "bg-transparent text-muted-foreground border rounded-md px-4 py-2 text-[14px] font-semibold hover:bg-primary",
        submit:
          "w-[450px] rounded-md bg-accent py-2 text-xl font-semibold hover:bg-accent-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
