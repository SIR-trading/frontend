"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TwitterIcon } from "@/components/ui/icons/twitter-icon";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { Textarea } from "@/components/ui/textarea";
import TransactionModal from "@/components/shared/transactionModal";
import { formatNumber } from "@/lib/utils";

interface SharePositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: {
    isApe: boolean;
    collateralSymbol: string;
    debtSymbol: string;
    leverageTier: string;
    pnlCollateral: number;
    pnlDebtToken: number;
    currentCollateral: number;
    currentDebtTokenValue: number;
    initialCollateral: number;
    initialDebtTokenValue: number;
  };
}

export function SharePositionModal({
  isOpen,
  onClose,
  position,
}: SharePositionModalProps) {
  const getLeverageRatio = (leverageTier: string) => {
    const tier = parseInt(leverageTier);
    const leverage = 1 + Math.pow(2, tier);
    return leverage;
  };

  // Calculate percentage gains
  const percentGainCollateral =
    position.initialCollateral > 0
      ? (position.pnlCollateral / position.initialCollateral) * 100
      : 0;


  // Generate the default tweet text
  const defaultTweet = useMemo(() => {
    // Helper to format numbers for tweet (plain text, no HTML)
    const formatForTweet = (num: number, significant = 3): string => {
      const formatted = formatNumber(num, significant);
      if (typeof formatted === "object" && formatted.type === "small") {
        // For very small numbers, use the subscript format in plain text
        return `${formatted.sign}0.0${formatted.zeroCount}${formatted.sigDigits}`;
      }
      return formatted as string;
    };

    const leverage = getLeverageRatio(position.leverageTier);
    const emoji =
      position.pnlCollateral >= position.initialCollateral * 9
        ? "🚀"
        : position.pnlCollateral >= position.initialCollateral
          ? "💰"
          : "📈";

    // Convert leverage number to superscript
    const superscriptMap: Record<string, string> = {
      "0": "⁰",
      "1": "¹",
      "2": "²",
      "3": "³",
      "4": "⁴",
      "5": "⁵",
      "6": "⁶",
      "7": "⁷",
      "8": "⁸",
      "9": "⁹",
    };
    const leverageSuperscript = leverage
      .toString()
      .split("")
      .map((digit) => superscriptMap[digit] ?? digit)
      .join("");

    // Format the gains nicely - all with 3 significant digits for consistency
    const collateralGain = formatForTweet(position.pnlCollateral, 3);
    const debtValue = formatForTweet(position.pnlDebtToken, 3);

    // Format percentage with commas for thousands
    const formattedPercentGain = Math.round(
      percentGainCollateral,
    ).toLocaleString();

    if (position.isApe) {
      // Add some contextual excitement based on the gain level
      let opener = "";
      if (percentGainCollateral >= 1000) {
        opener = `Turned ${position.collateralSymbol}/${position.debtSymbol}${leverageSuperscript} into a ${formattedPercentGain}% gain`;
      } else if (percentGainCollateral >= 100) {
        opener = `${formattedPercentGain}% return on ${position.collateralSymbol}/${position.debtSymbol}${leverageSuperscript}`;
      } else if (percentGainCollateral >= 50) {
        opener = `Solid ${formattedPercentGain}% gain on ${position.collateralSymbol}/${position.debtSymbol}${leverageSuperscript}`;
      } else {
        opener = `Up ${formattedPercentGain}% on ${position.collateralSymbol}/${position.debtSymbol}${leverageSuperscript}`;
      }

      return `${opener} with @leveragesir ${emoji}

Banked +${collateralGain} ${position.collateralSymbol} (worth ~${debtValue} ${position.debtSymbol})

Zero liquidation risk • No funding fees 🦍`;
    } else {
      // TEA position tweet - all with 3 significant digits for consistency
      const currentCollateral = formatForTweet(position.currentCollateral, 3);
      const currentDebtValue = formatForTweet(
        position.currentDebtTokenValue,
        3,
      );
      const pnlCollateral = formatForTweet(position.pnlCollateral, 3);
      const pnlDebt = formatForTweet(position.pnlDebtToken, 3);

      // Calculate percentage gain for TEA
      const percentGain = Math.round(percentGainCollateral);
      const formattedGain = percentGain.toLocaleString();

      // Add contextual messaging based on performance
      let opener = "";
      if (percentGainCollateral >= 50) {
        opener = `Up ${formattedGain}% providing ${position.collateralSymbol}/${position.debtSymbol} liquidity`;
      } else if (percentGainCollateral >= 20) {
        opener = `${formattedGain}% gain on my ${position.collateralSymbol}/${position.debtSymbol} liquidity position`;
      } else if (percentGainCollateral > 0) {
        opener = `Providing ${position.collateralSymbol}/${position.debtSymbol} liquidity`;
      } else if (percentGainCollateral < -20) {
        opener = `Still providing ${position.collateralSymbol}/${position.debtSymbol} liquidity despite IL`;
      } else {
        opener = `Providing ${position.collateralSymbol}/${position.debtSymbol} liquidity`;
      }

      return `${opener} with @leveragesir 🍵

Position: ${currentCollateral} ${position.collateralSymbol} (worth ~${currentDebtValue} ${position.debtSymbol})
${percentGainCollateral > 0 ? `Earned: +${pnlCollateral} ${position.collateralSymbol} (worth ~${pnlDebt} ${position.debtSymbol})` : ""}

Earning fees from leveraged traders 💰`;
    }
  }, [position, percentGainCollateral]);

  const [tweetText, setTweetText] = useState(defaultTweet);

  // Reset tweet text when modal opens or position changes
  useEffect(() => {
    if (isOpen) {
      setTweetText(defaultTweet);
    }
  }, [isOpen, defaultTweet]);

  const handleShare = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, "_blank", "noopener,noreferrer,width=600,height=400");
    onClose();
  };

  const handleReset = () => {
    setTweetText(defaultTweet);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent title="Share Position" className="bg-transparent">
        <div className="nav-shadow relative rounded-xl border border-foreground/10 bg-secondary transition-all duration-700">
          <TransactionModal.Close setOpen={onClose} />

          {/* Header */}
          <div className="px-6 pb-4 pt-6">
            <h1 className="flex items-center justify-center gap-2 text-center font-geist text-2xl">
              <TwitterIcon className="h-5 w-5" />
              Share Your {position.isApe ? "Gains" : "Position"}
            </h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Customize your tweet or use the suggested text below
            </p>
          </div>

          {/* Content */}
          <TransactionModal.InfoContainer hash={undefined} isConfirming={false}>
            {/* Position Summary */}
            <div className="space-y-2 rounded-lg bg-foreground/7 p-4 dark:bg-foreground/4">
              <div className="text-sm text-muted-foreground">
                Position Summary
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Type:</span>{" "}
                  <span className="font-medium">
                    {position.isApe ? "APE (Leverage)" : "TEA (Liquidity)"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Vault:</span>{" "}
                  <span className="font-medium">
                    {position.collateralSymbol}/{position.debtSymbol}
                    <sup className="ml-0.5 text-[10px] font-semibold">
                      {getLeverageRatio(position.leverageTier)}
                    </sup>
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">P&L:</span>{" "}
                  <span
                    className={`font-medium ${position.pnlCollateral >= 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    {position.pnlCollateral >= 0 ? "+" : ""}
                    <DisplayFormattedNumber
                      num={position.pnlCollateral}
                      significant={3}
                    />{" "}
                    {position.collateralSymbol}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Worth:</span>{" "}
                  <span className="font-medium">
                    ~
                    <DisplayFormattedNumber
                      num={position.pnlDebtToken}
                      significant={3}
                    />{" "}
                    {position.debtSymbol}
                  </span>
                </div>
              </div>
            </div>

            {/* Tweet Text Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Tweet Text</label>
                <button
                  onClick={handleReset}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Reset to default
                </button>
              </div>
              <Textarea
                value={tweetText}
                onChange={(e) => setTweetText(e.target.value)}
                rows={6}
                maxLength={280}
                className="resize-none font-mono text-sm"
              />
              <div className="text-right text-xs text-muted-foreground">
                {tweetText.length}/280 characters
              </div>
            </div>
          </TransactionModal.InfoContainer>

          {/* Action Buttons */}
          <TransactionModal.StatSubmitContainer>
            <div className="flex w-full justify-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="min-w-[100px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleShare}
                className="flex min-w-[140px] items-center gap-2"
                variant="modal"
              >
                <TwitterIcon className="h-4 w-4" />
                Share on 𝕏
              </Button>
            </div>
          </TransactionModal.StatSubmitContainer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
