import React from "react";
import { Info } from "lucide-react";
import HoverPopup from "@/components/ui/hover-popup";
import buildData from "@/../public/build-data.json";

const BASE_FEE = buildData.systemParams.baseFee;

interface FeeExplanationProps {
  leverageTier?: string;
  compact?: boolean;
}

export function FeeExplanation({
  leverageTier,
  compact = false,
}: FeeExplanationProps) {
  // Calculate actual leverage from tier: leverage = 1 + 2^leverageTier
  // Negative tiers give lower leverage (e.g., tier -1 = 1.5x, tier 0 = 2x, tier 1 = 3x)
  const tierValue = leverageTier ? parseFloat(leverageTier) : 1;
  const leverageRatio = 1 + Math.pow(2, tierValue);

  // Calculate fee percentage based on leverage tier
  // This matches the calculateApeVaultFee function from calculations.ts
  const b = Math.pow(1 + (leverageRatio - 1) * BASE_FEE, 2);
  const a = 1 / b;
  const feeDecimal = (1 * 10 - a * 10) / 10;
  const feePercentage = Math.round(feeDecimal * 100);

  // Calculate gains at different price levels (after fees)
  const gainNeg80 = Math.round(
    (100 - feePercentage) * Math.pow(0.2, leverageRatio) - 100,
  );
  const gainNeg50 = Math.round(
    (100 - feePercentage) * Math.pow(0.5, leverageRatio) - 100,
  );
  const gain0 = -feePercentage; // 0% price increase
  const gain50 = Math.round(
    (100 - feePercentage) * Math.pow(1.5, leverageRatio) - 100,
  );
  const gain100 = Math.round(
    (100 - feePercentage) * Math.pow(2, leverageRatio) - 100,
  );
  const gain400 = Math.round(
    (100 - feePercentage) * Math.pow(5, leverageRatio) - 100,
  );

  if (!compact) {
    return null; // Full version not currently used
  }

  // Custom inline tooltip with better visibility
  const triggerElement = (
    <div className="inline-flex cursor-pointer items-center justify-center align-middle text-foreground">
      <Info size={14} strokeWidth={2} />
    </div>
  );

  const content = (
    <div className="space-y-3">
      <div className="font-semibold">Why this fee?</div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <span>•</span>
          <div>
            <div className="font-medium">One-time only</div>
            <div className="text-xs opacity-80">
              No daily funding fees that drain your position over time
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span>•</span>
          <div>
            <div className="font-medium">Zero liquidation risk</div>
            <div className="text-xs opacity-80">
              Your position can never be forcibly closed, even in extreme
              volatility
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span>•</span>
          <div>
            <div className="font-medium">No volatility decay*</div>
            <div className="text-xs opacity-80">
              No decay even in choppy/sideways markets
            </div>
            <div className="text-[10px] opacity-60 italic mt-0.5">
              *May occur if price exceeds saturation price (depends on liquidity)
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span>•</span>
          <div>
            <div className="font-medium">
              Exponential gains* (^{leverageRatio})
            </div>
            <div className="space-y-0.5 text-xs opacity-80">
              <div>-50% price change = {gainNeg50}% gain</div>
              <div>0% price change = {gain0}% gain</div>
              <div>+50% price change = {gain50}% gain</div>
              <div>+100% price change = {gain100}% gain</div>
              <div>+400% price change = {gain400}% gain</div>
            </div>
            <div className="text-[10px] opacity-60 italic mt-0.5">
              *Assumes sufficient vault liquidity
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-2 dark:border-black/10">
        <div className="text-xs opacity-70">
          Margin trading, perps, leveraged ETFs: Daily fees + liquidations + linear gains or volatility decay
        </div>
        <div className="mt-1 text-xs font-medium">
          SIR: One-time fee + no decay + exponential gains + no liquidation
        </div>
      </div>
    </div>
  );

  return (
    <HoverPopup size="300" trigger={triggerElement}>
      {content}
    </HoverPopup>
  );
}
