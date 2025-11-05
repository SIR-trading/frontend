"use client";
import React, { useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TwitterIcon } from "@/components/ui/icons/twitter-icon";
import TransactionModal from "@/components/shared/transactionModal";
import { ImageCardGenerator } from "./ImageCardGenerator";
import { Download, Copy } from "lucide-react";

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
    averageEntryPrice: number;
    currentPrice: number;
    vaultLink: string;
    collateralLogoUrl: string;
    debtLogoUrl: string;
    feesApy?: number;
    sirRewardsApy?: number;
  };
}

export function SharePositionModal({
  isOpen,
  onClose,
  position,
}: SharePositionModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copyStatus, setCopyStatus] = useState<string>("");

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

  const percentGainDebt =
    position.initialDebtTokenValue > 0
      ? (position.pnlDebtToken / position.initialDebtTokenValue) * 100
      : 0;

  const handleDownload = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `sir-gains-${position.collateralSymbol}-${position.debtSymbol}.jpg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, "image/jpeg");
  };

  const handleCopyImage = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    canvas.toBlob((blob) => {
      if (!blob) return;

      void (async () => {
        try {
          // Copy image to clipboard
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);

          setCopyStatus("Image copied to clipboard!");

          // Clear status message after 3 seconds
          setTimeout(() => {
            setCopyStatus("");
          }, 3000);
        } catch (error) {
          console.error("Failed to copy image:", error);
          setCopyStatus("Copy failed. Try downloading instead.");

          // Clear error message after 3 seconds
          setTimeout(() => {
            setCopyStatus("");
          }, 3000);
        }
      })();
    }, "image/png");
  };

  const handleShare = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    canvas.toBlob((blob) => {
      if (!blob) return;

      void (async () => {
        try {
          // Copy image to clipboard
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);

          setCopyStatus("Image copied! Paste it in Twitter with Ctrl+V");

          // Generate tweet text based on position type
          const leverage = getLeverageRatio(position.leverageTier);
          const tweetText = position.isApe
            ? `Trading $${position.collateralSymbol} with perfectly constant ^${leverage} leverage, no liquidations and no funding fees at @leveragesir.`
            : `Providing liquidity to earn fees and SIR rewards while keeping dampened exposure to ${position.collateralSymbol} and ${position.debtSymbol} at @leveragesir.`;

          // Open Twitter compose window with prefilled text
          setTimeout(() => {
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
            window.open(
              twitterUrl,
              "_blank",
              "noopener,noreferrer,width=600,height=400",
            );
          }, 100);

          // Clear status message after 3 seconds
          setTimeout(() => {
            setCopyStatus("");
          }, 3000);
        } catch (error) {
          console.error("Failed to copy image:", error);
          setCopyStatus("Copy failed. Try downloading instead.");

          // Clear error message after 3 seconds
          setTimeout(() => {
            setCopyStatus("");
          }, 3000);
        }
      })();
    }, "image/png");
  };

  const handleImageGenerated = (canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent title="Share Position" className="bg-transparent">
        <div className="nav-shadow relative rounded-xl border border-foreground/10 bg-secondary transition-all duration-700">
          <TransactionModal.Close setOpen={onClose} />

          {/* Header */}
          <div className="px-6 pb-4 pt-6">
            <h1 className="flex items-center justify-center gap-2 text-center font-geist text-2xl">
              Share Your Position
            </h1>
            <p className="mt-2 text-left text-sm text-muted-foreground">
              Click &quot;Post on X&quot; to copy the image and open Twitter,
              then paste with Ctrl+V.
            </p>
          </div>

          {/* Content */}
          <TransactionModal.InfoContainer hash={undefined} isConfirming={false}>
            {/* Image Card Preview */}
            <div>
              <ImageCardGenerator
                collateralSymbol={position.collateralSymbol}
                collateralLogoUrl={position.collateralLogoUrl}
                debtSymbol={position.debtSymbol}
                debtLogoUrl={position.debtLogoUrl}
                leverageRatio={getLeverageRatio(position.leverageTier)}
                percentGainCollateral={percentGainCollateral}
                percentGainDebt={percentGainDebt}
                averageEntryPrice={position.averageEntryPrice}
                currentPrice={position.currentPrice}
                vaultLink={position.vaultLink}
                isApe={position.isApe}
                feesApy={position.feesApy}
                sirRewardsApy={position.sirRewardsApy}
                onImageGenerated={handleImageGenerated}
              />
            </div>
          </TransactionModal.InfoContainer>

          {/* Action Buttons */}
          <TransactionModal.StatSubmitContainer>
            <div className="flex w-full flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  onClick={handleCopyImage}
                  className="flex h-9 flex-1 items-center gap-1.5 text-sm sm:min-w-[140px]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Image
                </Button>
                <Button
                  onClick={handleDownload}
                  className="flex h-9 flex-1 items-center gap-1.5 text-sm sm:min-w-[140px]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
                <Button
                  onClick={handleShare}
                  className="flex h-9 flex-1 items-center gap-1.5 text-sm sm:min-w-[140px]"
                >
                  <TwitterIcon className="h-3.5 w-3.5" />
                  Post on X
                </Button>
              </div>
              {copyStatus && (
                <p className="text-center text-xs text-muted-foreground">
                  {copyStatus}
                </p>
              )}
            </div>
          </TransactionModal.StatSubmitContainer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
