import React from "react";
import { TokenDisplay } from "@/components/ui/token-display";
import { useTokenUsdPrice } from "@/components/leverage-liquidity/mintForm/hooks/useTokenUsdPrice";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { formatUnits } from "viem";

interface BidDisplayWithDiscountProps {
  bidAmount: bigint;
  bidDecimals: number;
  bidUnitLabel: string;
  bidTokenAddress: string;
  auctionAmount: bigint;
  auctionDecimals: number;
  auctionTokenAddress: string;
  amountSize?: "small" | "medium" | "large";
  className?: string;
}

export const BidDisplayWithDiscount: React.FC<BidDisplayWithDiscountProps> = ({
  bidAmount,
  bidDecimals,
  bidUnitLabel,
  bidTokenAddress,
  auctionAmount,
  auctionDecimals,
  auctionTokenAddress,
  amountSize = "large",
  className,
}) => {
  // Convert amounts to strings for the hook
  const bidAmountString = bidAmount ? formatUnits(bidAmount, bidDecimals) : "0";
  const auctionAmountString = auctionAmount ? formatUnits(auctionAmount, auctionDecimals) : "0";

  // Get USD values
  const { usdValue: bidUsdValue } = useTokenUsdPrice(bidTokenAddress, bidAmountString, bidDecimals);
  const { usdValue: auctionUsdValue } = useTokenUsdPrice(auctionTokenAddress, auctionAmountString, auctionDecimals);

  // Calculate discount percentage
  const discountPercentage = React.useMemo(() => {
    if (!bidUsdValue || !auctionUsdValue || bidUsdValue === 0 || auctionUsdValue === 0) {
      return null;
    }
    const discount = ((auctionUsdValue - bidUsdValue) / auctionUsdValue) * 100;
    return discount > 0 ? discount : null;
  }, [bidUsdValue, auctionUsdValue]);

  return (
    <div className="flex flex-col">
      <TokenDisplay
        amount={bidAmount}
        decimals={bidDecimals}
        unitLabel={bidUnitLabel}
        amountSize={amountSize}
        className={className}
      />
      <div className="text-sm text-muted-foreground leading-tight mt-0.5 min-h-[1.25rem]">
        {bidUsdValue !== null && bidUsdValue > 0 && (
          <>
            ≈ $<DisplayFormattedNumber num={bidUsdValue.toString()} />
            {discountPercentage !== null && (
              <span className="text-green-500 dark:text-green-400">
                {" "}(<DisplayFormattedNumber num={discountPercentage.toString()} significant={2} />% below)
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};