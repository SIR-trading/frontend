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
  percentGainUsd: number;
  percentGainCollateral: number;
  percentGainDebt?: number; // Optional, for TEA positions
  averageEntryPrice: number;
  currentPrice: number;
  vaultLink: string;
  isApe: boolean;
  feesApy?: number;
  sirRewardsApy?: number;
  onImageGenerated?: (canvas: HTMLCanvasElement) => void;
  showVaultInfo?: boolean; // Default true, false for aggregate positions
  userStats?: {
    // For aggregate positions instead of vault info
    percentPnlRank: number;
    pnlRank: number;
    month: string;
    vaults: Array<{
      symbol: string;
      pnlUsd: number;
      collateralToken?: string;
      debtToken?: string;
    }>;
  };
}

export function ImageCardGenerator({
  collateralSymbol,
  collateralLogoUrl,
  debtSymbol,
  debtLogoUrl,
  leverageRatio,
  percentGainUsd,
  percentGainCollateral,
  percentGainDebt = 0,
  averageEntryPrice,
  currentPrice,
  vaultLink,
  isApe,
  feesApy,
  sirRewardsApy,
  onImageGenerated,
  showVaultInfo = true,
  userStats,
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
            bgImage.src = percentGainUsd >= 0 ? "/X_gains.jpg" : "/X_loss.jpg";
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

        if (showVaultInfo) {
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
          ctx.fillText("/", currentX, startY + 24);
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
        } else if (userStats) {
          // Draw user stats for aggregate position - show ranks instead of values
          ctx.font = `500 52px ${sansFont}`;
          ctx.fillStyle = "#E5E5E5";
          ctx.textAlign = "left";

          // Draw: "October 2024 | % PnL Rank: #5 | PnL Rank: #3"
          const line1Y = startY;
          let currentX = leftAlign;

          // Month first
          ctx.fillStyle = "#E5E5E5";
          ctx.fillText(userStats.month, currentX, line1Y);
          currentX += ctx.measureText(userStats.month).width + 30;

          // Separator
          ctx.fillStyle = "#E5E5E5";
          ctx.fillText(" | ", currentX, line1Y);
          currentX += ctx.measureText(" | ").width;

          // % PnL Rank label
          ctx.fillStyle = "#A0A0A0";
          ctx.fillText("% PnL Rank: ", currentX, line1Y);
          currentX += ctx.measureText("% PnL Rank: ").width;

          // % PnL Rank value (white)
          ctx.fillStyle = "#E5E5E5";
          ctx.fillText(`#${userStats.percentPnlRank}`, currentX, line1Y);
          currentX +=
            ctx.measureText(`#${userStats.percentPnlRank}`).width + 30;

          // Separator
          ctx.fillStyle = "#E5E5E5";
          ctx.fillText(" | ", currentX, line1Y);
          currentX += ctx.measureText(" | ").width;

          // PnL Rank label
          ctx.fillStyle = "#A0A0A0";
          ctx.fillText("PnL Rank: ", currentX, line1Y);
          currentX += ctx.measureText("PnL Rank: ").width;

          // PnL Rank value (white)
          ctx.fillStyle = "#E5E5E5";
          ctx.fillText(`#${userStats.pnlRank}`, currentX, line1Y);
        }

        // Draw % gains in large text with explicit sign
        if (isApe) {
          // APE: Show USD % gain as main percentage
          const signUsd = percentGainUsd >= 0 ? "+" : "-";
          const percentFormattedUsd = formatNumber(Math.abs(percentGainUsd), 3);
          const percentValueUsd =
            typeof percentFormattedUsd === "string"
              ? percentFormattedUsd
              : percentFormattedUsd.sigDigits;
          const gainsTextUsd = `${signUsd}${percentValueUsd}%`;

          // Use serif font for USD gain (main display)
          ctx.font = `400 210px ${serifFont}`;
          ctx.fillStyle = percentGainUsd >= 0 ? "#22C55E" : "#EF4444"; // Green for gains, red for losses
          ctx.textAlign = "left";

          // Center vertically using metrics for exact positioning
          const targetCenterY = startY + 200;
          ctx.textBaseline = "alphabetic";
          const m = ctx.measureText(gainsTextUsd);
          const baselineY =
            targetCenterY +
            (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
          ctx.fillText(gainsTextUsd, leftAlign, baselineY);

          // Draw USD label to the right of main percentage
          const usdGainWidth = ctx.measureText(gainsTextUsd).width;
          ctx.font = `500 70px ${sansFont}`;
          ctx.fillStyle = "#E5E5E5";
          ctx.fillText(` USD`, leftAlign + usdGainWidth, baselineY);

          // Only show collateral token gains in parentheses if it's a real token (not USD aggregate)
          let priceY = baselineY + 100; // Default position

          if (collateralSymbol !== "USD") {
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

            priceY = tokenGainsY + 140;
          } else {
            // For USD aggregate positions, place prices closer to main percentage
            priceY = baselineY + 240;
          }

          // For aggregate positions, show vault list. Otherwise show prices.
          if (userStats?.vaults) {
            const maxVaults = 10;
            const vaultsToShow = userStats.vaults.slice(0, maxVaults);
            const hasMore = userStats.vaults.length > maxVaults;

            // Load all vault token logos
            const vaultLogos = await Promise.all(
              vaultsToShow.map(async (vault) => {
                const collateralImg = new Image();
                const debtImg = new Image();

                if (vault.collateralToken) {
                  await loadImage(collateralImg, vault.collateralToken);
                }
                if (vault.debtToken) {
                  await loadImage(debtImg, vault.debtToken);
                }

                return { collateralImg, debtImg };
              }),
            );

            // Draw vaults as a flowing sentence with logos inline
            ctx.textAlign = "left";
            ctx.font = `500 36px ${sansFont}`;
            ctx.fillStyle = "#E5E5E5";

            let currentX = leftAlign;
            let currentY = priceY;
            const logoSize = 50;
            const maxWidth = 1360; // Canvas width minus margins
            const lineHeight = 55;

            // Draw "Traded "
            ctx.fillText("Traded ", currentX, currentY);
            currentX += ctx.measureText("Traded ").width;

            vaultsToShow.forEach((vault, index) => {
              // Parse vault symbol to get collateral/debt and leverage
              // Format: "ETH/USDC 3x" or similar
              const parts = vault.symbol.match(/^(.+?)\/(.+?)(?:\s+(\d+)x)?$/);
              if (!parts) return;

              const [, collateralSym, debtSym, leverage] = parts;
              if (!collateralSym || !debtSym) return; // TypeScript guard

              // Calculate width needed for this vault entry
              ctx.font = `500 36px ${sansFont}`;
              const collateralSymWidth = ctx.measureText(collateralSym).width;
              const slashWidth = ctx.measureText(" / ").width;
              const debtSymWidth = ctx.measureText(debtSym).width;
              const leverageWidth = leverage
                ? ctx.measureText(leverage).width * 0.7
                : 0; // Superscript is smaller
              const separatorWidth =
                index < vaultsToShow.length - 1 || hasMore
                  ? ctx.measureText(", ").width
                  : index === vaultsToShow.length - 1 && !hasMore
                    ? ctx.measureText(".").width
                    : 0;
              const entryWidth =
                logoSize +
                5 +
                collateralSymWidth +
                slashWidth +
                logoSize +
                5 +
                debtSymWidth +
                leverageWidth +
                separatorWidth;

              // Check if we need to wrap to next line
              if (
                currentX + entryWidth > leftAlign + maxWidth &&
                currentX > leftAlign
              ) {
                currentY += lineHeight;
                currentX = leftAlign;
              }

              // Draw collateral logo
              if (
                vaultLogos[index]?.collateralImg.complete &&
                vaultLogos[index]?.collateralImg.naturalHeight !== 0
              ) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(
                  currentX + logoSize / 2,
                  currentY - 15,
                  logoSize / 2,
                  0,
                  Math.PI * 2,
                );
                ctx.clip();
                ctx.drawImage(
                  vaultLogos[index].collateralImg,
                  currentX,
                  currentY - 15 - logoSize / 2,
                  logoSize,
                  logoSize,
                );
                ctx.restore();
              }
              currentX += logoSize + 5;

              // Draw collateral symbol
              ctx.font = `500 36px ${sansFont}`;
              ctx.fillText(collateralSym, currentX, currentY);
              currentX += collateralSymWidth;

              // Draw slash separator
              ctx.fillText(" / ", currentX, currentY);
              currentX += slashWidth;

              // Draw debt logo
              if (
                vaultLogos[index]?.debtImg.complete &&
                vaultLogos[index]?.debtImg.naturalHeight !== 0
              ) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(
                  currentX + logoSize / 2,
                  currentY - 15,
                  logoSize / 2,
                  0,
                  Math.PI * 2,
                );
                ctx.clip();
                ctx.drawImage(
                  vaultLogos[index].debtImg,
                  currentX,
                  currentY - 15 - logoSize / 2,
                  logoSize,
                  logoSize,
                );
                ctx.restore();
              }
              currentX += logoSize + 5;

              // Draw debt symbol
              ctx.fillText(debtSym, currentX, currentY);
              currentX += debtSymWidth;

              // Draw leverage as superscript
              if (leverage) {
                ctx.font = `500 24px ${sansFont}`;
                ctx.fillText(leverage, currentX + 2, currentY - 12);
                currentX += ctx.measureText(leverage).width + 2;
              }

              // Draw separator
              ctx.font = `500 36px ${sansFont}`;
              if (index < vaultsToShow.length - 1) {
                ctx.fillText(", ", currentX, currentY);
                currentX += ctx.measureText(", ").width;
              } else if (index === vaultsToShow.length - 1 && hasMore) {
                ctx.fillText(", ", currentX, currentY);
                currentX += ctx.measureText(", ").width;
              }
            });

            // Draw "and others." if needed
            if (hasMore) {
              const andOthersText = "and others.";
              const andOthersWidth = ctx.measureText(andOthersText).width;

              if (
                currentX + andOthersWidth > leftAlign + maxWidth &&
                currentX > leftAlign
              ) {
                currentY += lineHeight;
                currentX = leftAlign;
              }

              ctx.fillText(andOthersText, currentX, currentY);
            } else {
              // Add final period if no "and others"
              ctx.fillText(".", currentX, currentY);
            }
          } else {
            // Draw entry and exit prices for individual positions
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

            // Exit price label (grey)
            const currentPriceY = priceY + 55;
            ctx.font = `500 38px ${sansFont}`;
            ctx.fillStyle = "#A0A0A0";
            ctx.fillText("Exit price:", leftAlign, currentPriceY);

            // Exit price value (broken white)
            const currentLabelWidth = ctx.measureText("Exit price:").width;
            ctx.font = `500 38px ${sansFont}`;
            ctx.fillStyle = "#E5E5E5";
            ctx.fillText(
              `${formatPrice(currentPrice)} ${debtSymbol}`,
              leftAlign + currentLabelWidth + 15,
              currentPriceY,
            );
          }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    collateralSymbol,
    collateralLogoUrl,
    debtSymbol,
    debtLogoUrl,
    leverageRatio,
    percentGainCollateral,
    percentGainDebt,
    percentGainUsd,
    averageEntryPrice,
    currentPrice,
    vaultLink,
    isApe,
    feesApy,
    sirRewardsApy,
    showVaultInfo,
    userStats,
    // onImageGenerated is intentionally excluded - it's only used to pass the canvas ref back once
  ]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="h-auto max-w-full rounded-lg border border-foreground/10"
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
