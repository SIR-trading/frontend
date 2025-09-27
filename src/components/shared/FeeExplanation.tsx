import React from "react";
import { Info } from "lucide-react";
import HoverPopup from "@/components/ui/hover-popup";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { PopoverArrow } from "@radix-ui/react-popover";
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
  // Hooks must be called unconditionally at the top level
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    setIsMobile("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

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

  if (compact) {
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
              <div className="font-medium">No volatility decay</div>
              <div className="text-xs opacity-80">
                No decay even in choppy/sideways markets
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
                <div className="pt-1 text-xs italic opacity-60">
                  *Assumes sufficient vault liquidity
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-2 dark:border-black/10">
          <div className="text-xs opacity-70">
            Traditional leveraged ETFs: Daily fees + volatility decay + linear
            gains
          </div>
          <div className="mt-1 text-xs font-medium">
            SIR: One-time fee + no decay + exponential gains + no liquidation
          </div>
        </div>
      </div>
    );

    // Use Popover for mobile/touch devices
    if (isMobile) {
      return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>{triggerElement}</PopoverTrigger>
          <PopoverContent
            side="top"
            align="center"
            className="max-w-[300px] rounded-md border border-black/20 bg-black/90 px-3 py-3 text-left text-xs text-white shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-white/90 dark:text-black"
          >
            {content}
            <PopoverArrow
              className="fill-black/90 dark:fill-white/90"
              height={15}
              width={10}
            />
          </PopoverContent>
        </Popover>
      );
    }

    // Use HoverPopup for desktop
    return (
      <HoverPopup size="300" trigger={triggerElement}>
        {content}
      </HoverPopup>
    );
  }

  // Full version for dedicated sections
  return (
    <div className="bg-card space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center gap-2">
        <Info className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Understanding the fee structure</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-primary">SIR Protocol</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>One-time fee only</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Zero liquidation risk</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>No volatility decay</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Exponential gains* (^{leverageRatio} leverage)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Hold indefinitely</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Traditional Leverage
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              <span>Daily funding fees (0.01-0.3%)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              <span>Liquidation at margin call</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              <span>Volatility decay in choppy markets</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              <span>Linear gains only</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              <span>Time decay from fees</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-md bg-primary/10 p-3 text-sm">
        <strong>
          Example with {leverageRatio}x leverage (after {feePercentage}% fee):
        </strong>
        <div className="mt-2 space-y-1">
          <div>• -80% price change = {gainNeg80}% gain</div>
          <div>• -50% price change = {gainNeg50}% gain</div>
          <div>• 0% price change = {gain0}% gain</div>
          <div>• +50% price change = {gain50}% gain</div>
          <div>• +100% price change = {gain100}% gain</div>
          <div>• +400% price change = {gain400}% gain</div>
          <div className="pt-2 text-xs italic opacity-70">
            *Assumes sufficient vault liquidity
          </div>
        </div>
      </div>
    </div>
  );
}
