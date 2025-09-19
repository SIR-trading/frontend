import * as React from "react";
import { cn } from "@/lib/utils/index";
import * as classVarianceAuthority from "class-variance-authority";
import { formatUnits } from "viem";
import DisplayFormattedNumber from "../shared/displayFormattedNumber";

const AmountVariants = classVarianceAuthority.cva("", {
  variants: {
    amountSize: {
      small: "",
      medium: "text-lg",
      large: "text-xl",
    },
  },
  defaultVariants: { amountSize: "large" },
});

export type InputProps = React.HTMLAttributes<HTMLHeadElement> &
  classVarianceAuthority.VariantProps<typeof AmountVariants> & {
    decimals?: number;
    amount: bigint | undefined;
    unitLabel: string;
    round?: number;
    disableRounding?: boolean;
  };
const TokenDisplay = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      amount,
      round = 3,
      decimals,
      amountSize,
      unitLabel,
      disableRounding,
      ...props
    },
    ref,
  ) => {
    const tokenAmount = formatUnits(amount ?? 0n, decimals ?? 18);
    return (
      <h3
        ref={ref}
        className={cn(AmountVariants({ amountSize, className }))}
        {...props}
      >
        <DisplayFormattedNumber
          num={tokenAmount}
          significant={disableRounding ? undefined : round}
        />
        <span className={cn("text-muted-foreground", amountSize === "large" ? "text-base" : "")}> {unitLabel}</span>
      </h3>
    );
  },
);
TokenDisplay.displayName = "TokenDisplay";

export { TokenDisplay };
