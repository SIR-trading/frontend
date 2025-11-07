"use client";
import React, { useRef, useEffect, useState } from "react";
import { formatNumber } from "@/lib/utils";
import { openSans, ebGaramond } from "@/lib/fonts";

interface ImageCardGeneratorProps {
  collateralSymbol: string;
  collateralLogoUrl: string;
  debtSymbol: string;
  debtLogoUrl: string;
  leverageRatio: number;
  percentGainCollateral: number;
  percentGainDebt: number;
  averageEntryPrice: number;
  currentPrice: number;
  vaultLink: string;
  isApe: boolean;
  feesApy?: number;
  sirRewardsApy?: number;
  onImageGenerated?: (canvas: HTMLCanvasElement) => void;
}

export function ImageCardGenerator({
  collateralSymbol,
  collateralLogoUrl,
  debtSymbol,
  debtLogoUrl,
  leverageRatio,
  percentGainCollateral,
  percentGainDebt,
  averageEntryPrice,
  currentPrice,
  vaultLink,
  isApe,
  feesApy,
  sirRewardsApy,
  onImageGenerated,
}: ImageCardGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    const generateImage = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Get the actual font family names from Next.js font objects
      // Next.js generates hashed font names, not literal "Open Sans" or "EB Garamond"
      const sansFont = openSans.style.fontFamily;
      const serifFont = ebGaramond.style.fontFamily;

      // Preload fonts before canvas rendering to ensure consistent metrics across all machines
      await document.fonts.ready;

      // Explicitly load the fonts we'll use in the canvas
      await Promise.all([
        document.fonts.load(`500 28px ${sansFont}`),
        document.fonts.load(`500 32px ${sansFont}`),
        document.fonts.load(`500 36px ${sansFont}`),
        document.fonts.load(`500 38px ${sansFont}`),
        document.fonts.load(`500 52px ${sansFont}`),
        document.fonts.load(`500 70px ${sansFont}`),
        document.fonts.load(`400 80px ${serifFont}`),
        document.fonts.load(`400 150px ${serifFont}`),
        document.fonts.load(`400 210px ${serifFont}`),
      ]);

      // Set canvas size with fixed HiDPI scaling for consistent rendering across zoom levels
      const dpr = 2; // Fixed DPR to prevent zoom-level rendering inconsistencies
      canvas.width = 1520 * dpr;
      canvas.height = 1080 * dpr;
      ctx.scale(dpr, dpr);

      try {
        // Load background image based on position type and gain/loss
        const bgImage = new Image();
        // Don't set crossOrigin for local images - it can cause CORS issues

        await new Promise((resolve, reject) => {
          bgImage.onload = resolve;
          bgImage.onerror = reject;
          // TEA (LP) positions use X_liquidity.jpg, APE uses gains/loss backgrounds
          if (isApe) {
            bgImage.src =
              percentGainCollateral >= 0 ? "/X_gains.jpg" : "/X_loss.jpg";
          } else {
            bgImage.src = "/X_liquidity.jpg";
          }
        });

        // Draw background at logical dimensions (not physical pixels)
        ctx.drawImage(bgImage, 0, 0, 1520, 1080);

        // Load token logos
        const collateralLogo = new Image();
        const debtLogo = new Image();

        // Use CORS proxy for external images (CoinGecko, etc.)
        const getProxiedUrl = (url: string) => {
          // Check if it's an external URL that needs proxying
          if (url.includes("coingecko.com") || url.includes("trustwallet")) {
            return `https://corsproxy.io/?${encodeURIComponent(url)}`;
          }
          return url;
        };

        const loadImage = (img: HTMLImageElement, src: string) =>
          new Promise<void>((resolve, _reject) => {
            const proxiedSrc = getProxiedUrl(src);

            // Set crossOrigin BEFORE src for external images
            if (proxiedSrc !== src) {
              img.crossOrigin = "anonymous";
            }

            img.onload = () => resolve();
            img.onerror = (error) => {
              console.warn("Failed to load image:", src, error);
              resolve(); // Continue even if logo fails to load
            };

            img.src = proxiedSrc;
          });

        await Promise.all([
          loadImage(collateralLogo, collateralLogoUrl),
          loadImage(debtLogo, debtLogoUrl),
        ]);

        // --- Layout calculations for 1520x1080 canvas ---
        const leftAlign = 80; // Left-aligned position
        const startY = 320;

        // Draw vault denomination with both tokens
        const logoSize = 70;
        let currentX = leftAlign;

        // Draw collateral logo (rounded)
        if (collateralLogo.complete && collateralLogo.naturalHeight !== 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(
            currentX + logoSize / 2,
            startY,
            logoSize / 2,
            0,
            Math.PI * 2,
          );
          ctx.clip();
          ctx.drawImage(
            collateralLogo,
            currentX,
            startY - logoSize / 2,
            logoSize,
            logoSize,
          );
          ctx.restore();
        }
        currentX += logoSize + 15;

        // Draw collateral symbol
        ctx.font = `500 52px ${sansFont}`;
        ctx.fillStyle = "#E5E5E5";
        ctx.textAlign = "left";
        ctx.fillText(collateralSymbol, currentX, startY + 18);
        const collateralWidth = ctx.measureText(collateralSymbol).width;
        currentX += collateralWidth + 10;

        // Draw slash separator (larger)
        ctx.font = `500 70px ${sansFont}`;
        ctx.fillText("/", currentX, startY + 18);
        const slashWidth = ctx.measureText("/").width;
        currentX += slashWidth + 10;

        // Restore font size for debt symbol
        ctx.font = `500 52px ${sansFont}`;

        // Draw debt logo (rounded)
        const debtLogoSize = 70;
        if (debtLogo.complete && debtLogo.naturalHeight !== 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(
            currentX + debtLogoSize / 2,
            startY,
            debtLogoSize / 2,
            0,
            Math.PI * 2,
          );
          ctx.clip();
          ctx.drawImage(
            debtLogo,
            currentX,
            startY - debtLogoSize / 2,
            debtLogoSize,
            debtLogoSize,
          );
          ctx.restore();
        }
        currentX += debtLogoSize + 15;

        // Draw debt symbol
        ctx.fillText(debtSymbol, currentX, startY + 18);
        const debtWidth = ctx.measureText(debtSymbol).width;
        currentX += debtWidth + 8;

        // Draw superscript leverage ratio
        const leverageText = leverageRatio.toString();
        ctx.font = `500 36px ${sansFont}`;
        ctx.fillText(leverageText, currentX, startY - 12);

        // Draw % gains in large text with explicit sign
        if (isApe) {
          // APE: Show debt token gain as main percentage
          const signDebt = percentGainDebt >= 0 ? "+" : "-";
          const percentFormattedDebt = formatNumber(
            Math.abs(percentGainDebt),
            3,
          );
          const percentValueDebt =
            typeof percentFormattedDebt === "string"
              ? percentFormattedDebt
              : percentFormattedDebt.sigDigits;
          const gainsTextDebt = `${signDebt}${percentValueDebt}%`;

          // Use serif font for debt gain
          ctx.font = `400 210px ${serifFont}`;
          ctx.fillStyle = percentGainDebt >= 0 ? "#22C55E" : "#EF4444"; // Green for gains, red for losses
          ctx.textAlign = "left";

          // Center vertically using metrics for exact positioning
          const targetCenterY = startY + 200;
          ctx.textBaseline = "alphabetic";
          const m = ctx.measureText(gainsTextDebt);
          const baselineY =
            targetCenterY +
            (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
          ctx.fillText(gainsTextDebt, leftAlign, baselineY);

          // Draw debt token symbol to the right of main percentage
          const debtGainWidth = ctx.measureText(gainsTextDebt).width;
          ctx.font = `500 70px ${sansFont}`;
          ctx.fillStyle = "#E5E5E5";
          ctx.fillText(` ${debtSymbol}`, leftAlign + debtGainWidth, baselineY);

          // Format collateral token gains for smaller display below in parentheses
          const signCollateral = percentGainCollateral >= 0 ? "+" : "-";
          const percentFormattedCollateral = formatNumber(
            Math.abs(percentGainCollateral),
            3,
          );
          const percentValueCollateral =
            typeof percentFormattedCollateral === "string"
              ? percentFormattedCollateral
              : percentFormattedCollateral.sigDigits;
          const percentTextCollateral = `${signCollateral}${percentValueCollateral}%`;

          // Draw collateral token gains below main percentage
          const tokenGainsY = baselineY + 100;

          // Draw opening parenthesis (broken white, same size and font as collateral %)
          ctx.font = `400 80px ${serifFont}`;
          ctx.fillStyle = "#E5E5E5";
          ctx.fillText("(", leftAlign, tokenGainsY);
          const openParenWidth = ctx.measureText("(").width;

          // Draw collateral percentage (serif)
          ctx.fillStyle = percentGainCollateral >= 0 ? "#22C55E" : "#EF4444";
          ctx.fillText(
            percentTextCollateral,
            leftAlign + openParenWidth,
            tokenGainsY,
          );

          // Draw collateral token symbol (smaller sans)
          const collateralPercentWidth = ctx.measureText(
            percentTextCollateral,
          ).width;
          ctx.font = `500 32px ${sansFont}`;
          ctx.fillStyle = "#E5E5E5";
          ctx.fillText(
            ` ${collateralSymbol}`,
            leftAlign + openParenWidth + collateralPercentWidth,
            tokenGainsY,
          );

          // Draw closing parenthesis (broken white, same size and font as collateral %)
          const collateralSymbolWidth = ctx.measureText(
            ` ${collateralSymbol}`,
          ).width;
          ctx.font = `400 80px ${serifFont}`;
          ctx.fillText(
            ")",
            leftAlign +
              openParenWidth +
              collateralPercentWidth +
              collateralSymbolWidth,
            tokenGainsY,
          );

          // Draw entry and current prices at same height as APY in liquidity card
          const priceY = tokenGainsY + 140;
          ctx.textAlign = "left";

          const formatPrice = (price: number): string => {
            const formatted = formatNumber(price, 3);
            if (typeof formatted === "object" && formatted.type === "small") {
              // For very small numbers, create plain text version
              return `0.0${formatted.zeroCount}${formatted.sigDigits}`;
            }
            return formatted as string;
          };

          // Entry price label (grey)
          ctx.font = `500 38px ${sansFont}`;
          ctx.fillStyle = "#A0A0A0";
          ctx.fillText("Entry price:", leftAlign, priceY);

          // Entry price value (broken white)
          const entryLabelWidth = ctx.measureText("Entry price:").width;
          ctx.font = `500 38px ${sansFont}`;
          ctx.fillStyle = "#E5E5E5";
          ctx.fillText(
            `${formatPrice(averageEntryPrice)} ${debtSymbol}`,
            leftAlign + entryLabelWidth + 15,
            priceY,
          );

          // Current price label (grey)
          const currentPriceY = priceY + 55;
          ctx.font = `500 38px ${sansFont}`;
          ctx.fillStyle = "#A0A0A0";
          ctx.fillText("Current price:", leftAlign, currentPriceY);

          // Current price value (broken white)
          const currentLabelWidth = ctx.measureText("Current price:").width;
          ctx.font = `500 38px ${sansFont}`;
          ctx.fillStyle = "#E5E5E5";
          ctx.fillText(
            `${formatPrice(currentPrice)} ${debtSymbol}`,
            leftAlign + currentLabelWidth + 15,
            currentPriceY,
          );
        } else {
          // TEA: Show both collateral and debt gains
          const signCollateral = percentGainCollateral >= 0 ? "+" : "-";
          const percentFormattedCollateral = formatNumber(
            Math.abs(percentGainCollateral),
            3,
          );
          const percentValueCollateral =
            typeof percentFormattedCollateral === "string"
              ? percentFormattedCollateral
              : percentFormattedCollateral.sigDigits;
          const percentTextCollateral = `${signCollateral}${percentValueCollateral}%`;

          const signDebt = percentGainDebt >= 0 ? "+" : "-";
          const percentFormattedDebt = formatNumber(
            Math.abs(percentGainDebt),
            3,
          );
          const percentValueDebt =
            typeof percentFormattedDebt === "string"
              ? percentFormattedDebt
              : percentFormattedDebt.sigDigits;
          const percentTextDebt = `${signDebt}${percentValueDebt}%`;

          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";

          // Draw collateral gain on first line (more distance from vault)
          const firstLineY = startY + 220;

          // Draw percentage in Garamond with gain/loss color (larger)
          ctx.font = `400 150px ${serifFont}`;
          ctx.fillStyle = percentGainCollateral >= 0 ? "#22C55E" : "#EF4444";
          ctx.fillText(percentTextCollateral, leftAlign, firstLineY);

          // Draw token symbol in Lucida with broken white color
          const percentWidthCollateral = ctx.measureText(
            percentTextCollateral,
          ).width;
          ctx.font = `500 52px ${sansFont}`;
          ctx.fillStyle = "#E5E5E5";
          ctx.fillText(
            ` ${collateralSymbol}`,
            leftAlign + percentWidthCollateral,
            firstLineY,
          );

          // Draw debt gain on second line with approximate equal sign (more spacing)
          const secondLineY = firstLineY + 160;

          // Draw approximate equal sign in grey
          ctx.font = `500 52px ${sansFont}`;
          ctx.fillStyle = "#E5E5E5";
          ctx.fillText("≈ ", leftAlign, secondLineY);
          const approxWidth = ctx.measureText("≈ ").width;

          // Draw percentage in Garamond with gain/loss color (larger)
          ctx.font = `400 150px ${serifFont}`;
          ctx.fillStyle = percentGainDebt >= 0 ? "#22C55E" : "#EF4444";
          ctx.fillText(percentTextDebt, leftAlign + approxWidth, secondLineY);

          // Draw token symbol in Lucida with broken white color
          const percentWidthDebt = ctx.measureText(percentTextDebt).width;
          ctx.font = `500 52px ${sansFont}`;
          ctx.fillStyle = "#E5E5E5";
          ctx.fillText(
            ` ${debtSymbol}`,
            leftAlign + approxWidth + percentWidthDebt,
            secondLineY,
          );

          // Draw APY components below the gains if available (more distance)
          if (feesApy !== undefined || sirRewardsApy !== undefined) {
            let currentY = secondLineY + 140;

            // Draw fees APY
            if (feesApy !== undefined) {
              ctx.font = `500 38px ${sansFont}`;
              ctx.fillStyle = "#A0A0A0";
              ctx.fillText("APY (fees): ", leftAlign, currentY);

              const feesLabelWidth = ctx.measureText("APY (fees): ").width;
              ctx.fillStyle = "#E5E5E5";
              const feesFormatted = formatNumber(feesApy, 3);
              const feesText =
                typeof feesFormatted === "string"
                  ? feesFormatted
                  : feesFormatted.sigDigits;
              ctx.fillText(
                `${feesText}%`,
                leftAlign + feesLabelWidth,
                currentY,
              );

              currentY += 55; // Move to next line
            }

            // Draw SIR rewards APY
            if (sirRewardsApy !== undefined) {
              ctx.font = `500 38px ${sansFont}`;
              ctx.fillStyle = "#A0A0A0";
              ctx.fillText("SIR Rewards: ", leftAlign, currentY);

              const sirLabelWidth = ctx.measureText("SIR Rewards: ").width;
              ctx.fillStyle = "#E5E5E5";
              const sirFormatted = formatNumber(sirRewardsApy, 3);
              const sirText =
                typeof sirFormatted === "string"
                  ? sirFormatted
                  : sirFormatted.sigDigits;
              ctx.fillText(`${sirText}%`, leftAlign + sirLabelWidth, currentY);
            }
          }
        }

        // Draw protocol features and link at bottom (left-aligned)
        const linkY = 1080 - 90;

        // Draw feature description
        ctx.font = `400 28px ${sansFont}`;
        ctx.fillStyle = "#A0A0A0";
        ctx.textAlign = "left";
        const featureText = isApe
          ? "Leveraged trading without liquidations or funding fees:"
          : "Provide liquidity and earn fees:";
        ctx.fillText(featureText, leftAlign, linkY);

        // Draw link below
        ctx.font = `400 28px ${sansFont}`;
        ctx.fillStyle = "#E5E5E5";
        ctx.fillText(`https://${vaultLink}`, leftAlign, linkY + 40);

        onImageGenerated?.(canvas);
      } catch (error) {
        console.error("Error generating image:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    void generateImage();
  }, [
    collateralSymbol,
    collateralLogoUrl,
    debtSymbol,
    debtLogoUrl,
    leverageRatio,
    percentGainCollateral,
    percentGainDebt,
    averageEntryPrice,
    currentPrice,
    vaultLink,
    isApe,
    feesApy,
    sirRewardsApy,
    onImageGenerated,
  ]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto rounded-lg border border-foreground/10"
        style={{ display: isGenerating ? "none" : "block" }}
      />
      {isGenerating && (
        <div className="flex h-[355px] items-center justify-center rounded-lg border border-foreground/10 bg-secondary">
          <div className="text-sm text-muted-foreground">
            Generating card...
          </div>
        </div>
      )}
    </div>
  );
}
