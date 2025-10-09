import React from "react";
import { TokenDisplay } from "@/components/ui/token-display";
import { useTokenUsdPrice } from "@/components/leverage-liquidity/mintForm/hooks/useTokenUsdPrice";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { formatUnits } from "viem";

interface TokenDisplayWithUsdProps {
  amount: bigint | undefined;
  decimals: number;
  unitLabel: string;
  tokenAddress: string;
  amountSize?: "small" | "medium" | "large";
  className?: string;
}

export const TokenDisplayWithUsd: React.FC<TokenDisplayWithUsdProps> = ({
  amount,
  decimals,
  unitLabel,
  tokenAddress,
  amountSize = "large",
  className,
}) => {
  // Convert bigint amount to string for the hook
  const amountString = amount ? formatUnits(amount, decimals) : "0";

  // Get USD value
  const { usdValue } = useTokenUsdPrice(tokenAddress, amountString, decimals);

  return (
    <div className="flex flex-col">
      <TokenDisplay
        amount={amount}
        decimals={decimals}
        unitLabel={unitLabel}
        amountSize={amountSize}
        className={className}
      />
      <div className="text-sm text-muted-foreground leading-tight mt-0.5 min-h-[1.25rem]">
        {usdValue !== null && usdValue > 0 && (
          <>
            ≈ $<DisplayFormattedNumber num={usdValue.toString()} />
          </>
        )}
      </div>
    </div>
  );
};