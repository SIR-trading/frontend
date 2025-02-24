import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center text-black justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background" +
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring px-2" +
    " focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 ",
  {
    variants: {
      variant: {
        default: "bg-gold hover:bg-gold text-black/90 font-bold",
        accent: "bg-accent hover:bg-accent/60 text-[#FBDED0] py-2 px-4",
        brown: "bg-brown-700 text-brown-100 hover:bg-brown-800 py-2 px-4",
        card: "bg-primary  text-white",
        outline:
          "bg-transparent text-muted-foreground border-2 rounded-md px-4 py-2 text-[14px] font-semibold hover:bg-primary",
        submit:
          "md:w-[450px] w-[280px] rounded-md bg-gold py-2 text-xl font-semibold text-black/90 hover:bg-gold/90",
        modal:
          "md:w-[300px] w-[280px] bg-gold rounded-lg font-bold  py-2 text-xl text-black/90 hover:bg-gold/90",
      },
      state: {
        default: "",
        loading: "disabled:opacity-100 bg-white text-black hover:bg-white",
      },
    },
    defaultVariants: {
      variant: "default",
      state: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, state, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, state, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
