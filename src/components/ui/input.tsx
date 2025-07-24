import * as React from "react";
import { cn } from "@/lib/utils/index";
import * as classVarianceAuthority from "class-variance-authority";

const InputVariants = classVarianceAuthority.cva(
  "flex w-full py-2 pr-2 text-sm ring-offset-background font-geist-mono " +
    "file:border-0 file:bg-transparent file:text-sm file:font-medium " +
    "placeholder:text-muted-foreground   focus-visible:outline-none " +
    " disabled:cursor-not-allowed disabled:opacity-50 text-foreground ",
  {
    variants: {
      background: {
        transparent:
          "bg-transparent placeholder:text-muted-foreground  w-full p-1 rounded-none ",
        primary: "bg-primary/0 dark:bg-primary py-1",
      },
      textSize: { sm: "text-[14px]", md: "text-[18px]", xl: "text-[32px]" },
      height: { sm: "h-5", md: "h-6", lg: "h-8" },
    },
    defaultVariants: { background: "transparent", height: "lg" },
  },
);
export type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  classVarianceAuthority.VariantProps<typeof InputVariants>;
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, height, background, textSize, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          InputVariants({ height, background, textSize, className }),
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
