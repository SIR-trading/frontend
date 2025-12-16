"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  calculateSaturationPrice,
  getLeverageRatio,
} from "@/lib/utils/calculations";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import ToolTip from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

// Default axis bounds
const DEFAULT_X_MIN = -100;
const DEFAULT_X_MAX = 300;

/**
 * Core gain function f(x) for APE positions:
 * - f(x) = x^l if x <= 1 (power zone - convex gains)
 * - f(x) = l*(x-1) + 1 if x >= 1 (saturation zone - linear gains)
 *
 * Where x = price / saturationPrice and l = leverage ratio
 */
function f(x: number, l: number): number {
  if (x <= 1) {
    return Math.pow(x, l);
  } else {
    return l * (x - 1) + 1;
  }
}

/**
 * Calculate APE gain in debt token terms.
 *
 * Formula: G = f(g1) / f(g0) / [1 + (l-1)*fBase]^2
 *
 * Where:
 * - g0 = p0 / pSat (entry price relative to saturation)
 * - g1 = p1 / pSat (exit price relative to saturation)
 * - l = leverage ratio (1 + 2^leverageTier)
 * - fBase = base fee (e.g., 0.025 for 2.5%)
 *
 * The [1 + (l-1)*fBase]^2 accounts for fees on both mint and burn.
 */
function calculateApeGain(
  entryPrice: number,
  exitPrice: number,
  saturationPrice: number,
  leverageRatio: number,
  baseFee: number,
): number {
  if (saturationPrice <= 0 || entryPrice <= 0) return 1;

  const g0 = entryPrice / saturationPrice;
  const g1 = exitPrice / saturationPrice;

  const feeMultiplier = 1 + (leverageRatio - 1) * baseFee;
  const feeFactor = feeMultiplier * feeMultiplier; // squared for mint + burn

  const gain = f(g1, leverageRatio) / f(g0, leverageRatio) / feeFactor;

  return gain;
}

/**
 * Calculate spot-like gain for 0 TVL vaults.
 * When there's no existing liquidity, minting APE is essentially like holding spot.
 * Gain = (exitPrice / entryPrice) / feeFactor
 */
function calculateSpotGain(
  entryPrice: number,
  exitPrice: number,
  leverageRatio: number,
  baseFee: number,
): number {
  if (entryPrice <= 0) return 1;

  const feeMultiplier = 1 + (leverageRatio - 1) * baseFee;
  const feeFactor = feeMultiplier * feeMultiplier; // squared for mint + burn

  // Spot-like: 1:1 with price change, minus fees
  return (exitPrice / entryPrice) / feeFactor;
}

interface ConvexReturnsChartProps {
  leverageTier: number;
  baseFee: number; // decimal, e.g., 0.025 for 2.5%
  apeReserve: bigint;
  teaReserve: bigint;
  currentPrice: number;
  collateralSymbol: string;
  debtSymbol: string;
  depositAmount: number; // user's deposit in collateral terms
  tax: number; // vault tax (0-255)
  collateralDecimals: number;
}

interface ChartPoint {
  priceChange: number; // percentage change from entry
  gain: number; // percentage gain in position value
}

// SVG dimensions and padding - constant, defined outside component
// Width is set high to match typical container aspect ratios and avoid empty space
const CHART_WIDTH = 500;
const CHART_HEIGHT = 300;
const CHART_PADDING = { top: 28, right: 18, bottom: 42, left: 42 };
const INNER_WIDTH = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
const INNER_HEIGHT = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

export default function ConvexReturnsChart({
  leverageTier,
  baseFee,
  apeReserve,
  teaReserve,
  currentPrice,
  collateralSymbol,
  debtSymbol,
  depositAmount,
  tax,
  collateralDecimals,
}: ConvexReturnsChartProps) {
  const leverageRatio = getLeverageRatio(leverageTier);
  const svgRef = useRef<SVGSVGElement>(null);

  // Collapsible state - default to collapsed
  const [isOpen, setIsOpen] = useState(false);

  // Zoom state
  const [zoomBounds, setZoomBounds] = useState<{
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  } | null>(null);

  // Drag selection state
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Reset to default view
  const resetZoom = useCallback(() => {
    setZoomBounds(null);
  }, []);

  // Handle keyboard shortcuts - Escape resets to default view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && zoomBounds) {
        resetZoom();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomBounds, resetZoom]);

  // Get SVG coordinates from mouse event
  const getSvgCoords = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;

    const rect = svg.getBoundingClientRect();
    const scaleX = CHART_WIDTH / rect.width;
    const scaleY = CHART_HEIGHT / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  // Mouse handlers for drag selection
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const coords = getSvgCoords(e);
      if (!coords) return;

      // Only start drag if within the plot area
      if (
        coords.x >= CHART_PADDING.left &&
        coords.x <= CHART_WIDTH - CHART_PADDING.right &&
        coords.y >= CHART_PADDING.top &&
        coords.y <= CHART_PADDING.top + INNER_HEIGHT
      ) {
        setDragStart(coords);
        setDragEnd(coords);
        setIsDragging(true);
      }
    },
    [getSvgCoords],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDragging || !dragStart) return;

      const coords = getSvgCoords(e);
      if (!coords) return;

      // Clamp to plot area
      const clampedX = Math.max(
        CHART_PADDING.left,
        Math.min(CHART_WIDTH - CHART_PADDING.right, coords.x),
      );
      const clampedY = Math.max(
        CHART_PADDING.top,
        Math.min(CHART_PADDING.top + INNER_HEIGHT, coords.y),
      );

      setDragEnd({ x: clampedX, y: clampedY });
    },
    [isDragging, dragStart, getSvgCoords],
  );

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    }
  }, [isDragging]);

  // Calculate adjusted reserves after user's deposit
  // Upon minting: deposit is reduced by 1/(1+(l-1)*fBase)
  // Fee = deposit - depositAfterFee
  // Fee portion (510-tax)/510 goes to tea reserve
  // Deposit after fee goes to ape reserve
  const adjustedReserves = useMemo(() => {
    if (
      !depositAmount ||
      depositAmount <= 0 ||
      !Number.isFinite(depositAmount)
    ) {
      return { apeReserve, teaReserve };
    }

    const feeMultiplier = 1 + (leverageRatio - 1) * baseFee;
    if (feeMultiplier <= 0) {
      return { apeReserve, teaReserve };
    }

    const depositAfterFee = depositAmount / feeMultiplier;
    const feeAmount = depositAmount - depositAfterFee;

    // Fee portion that goes to LP (tea) reserve
    const feeToLp = (feeAmount * (510 - tax)) / 510;

    // Convert to bigint with proper decimals - ensure valid values
    const depositAfterFeeBigInt = BigInt(
      Math.floor(
        Math.max(0, depositAfterFee) * Math.pow(10, collateralDecimals),
      ),
    );
    const feeToLpBigInt = BigInt(
      Math.floor(Math.max(0, feeToLp) * Math.pow(10, collateralDecimals)),
    );

    return {
      apeReserve: apeReserve + depositAfterFeeBigInt,
      teaReserve: teaReserve + feeToLpBigInt,
    };
  }, [
    apeReserve,
    teaReserve,
    depositAmount,
    leverageRatio,
    baseFee,
    tax,
    collateralDecimals,
  ]);

  // Check if this is a 0 TVL vault (no existing liquidity)
  const isZeroTvl = apeReserve === 0n && teaReserve === 0n;

  // Calculate saturation price and the price change % at which saturation occurs
  const saturationData = useMemo(() => {
    if (
      !currentPrice ||
      currentPrice === 0 ||
      adjustedReserves.apeReserve === 0n
    ) {
      return { saturationPrice: 0, saturationPriceChange: Infinity };
    }

    const satPrice = calculateSaturationPrice(
      currentPrice,
      adjustedReserves.apeReserve,
      adjustedReserves.teaReserve,
      leverageRatio,
    );

    const satPriceChange = ((satPrice - currentPrice) / currentPrice) * 100;

    return {
      saturationPrice: satPrice,
      saturationPriceChange: satPriceChange,
    };
  }, [
    currentPrice,
    adjustedReserves.apeReserve,
    adjustedReserves.teaReserve,
    leverageRatio,
  ]);

  // Calculate default Y bounds based on perp line at rightmost key point (7R/8 + xMin)
  // Perp line: gain% = leverageRatio * priceChange%, always above APE curve
  const defaultYBounds = useMemo(() => {
    // Calculate perp gain at rightmost default key point: 7R/8 + xMin
    // For default view: 7*400/8 + (-100) = 250
    const defaultRange = DEFAULT_X_MAX - DEFAULT_X_MIN;
    const rightmostPriceChange = DEFAULT_X_MIN + (7 * defaultRange) / 8;

    // Perp line gain: leverageRatio * priceChange, doubled for headroom
    const rawYMax = Math.max(2 * leverageRatio * rightmostPriceChange, 100);

    const yMin = -100;

    // Calculate step based on range to get nice round tick values
    const rawRange = rawYMax - yMin;
    let step = 100;
    if (rawRange > 2000) step = 500;
    else if (rawRange > 1000) step = 250;
    else if (rawRange > 500) step = 100;
    else if (rawRange > 200) step = 50;
    else step = 25;

    // Round yMax up to the next tick value
    const yMax = Math.ceil(rawYMax / step) * step;
    return { yMin, yMax };
  }, [leverageRatio]);

  // Compute effective bounds (used for chart data generation and scales)
  const effectiveBounds = useMemo(() => {
    return {
      xMin: zoomBounds?.xMin ?? DEFAULT_X_MIN,
      xMax: zoomBounds?.xMax ?? DEFAULT_X_MAX,
      yMin: zoomBounds?.yMin ?? defaultYBounds.yMin,
      yMax: zoomBounds?.yMax ?? defaultYBounds.yMax,
    };
  }, [zoomBounds, defaultYBounds]);

  // Key points to highlight - dynamically positioned based on current view
  // Uses R/8+xMin, R/2+xMin, 7R/8+xMin where R = xMax - xMin
  // This gives -50%, 100%, 250% in the default view (-100 to 300)
  const keyPoints = useMemo(() => {
    const entryPrice = currentPrice;
    const satPrice = saturationData.saturationPrice;

    // For 0 TVL vaults, use spot gain; otherwise need valid saturation price
    if (satPrice <= 0 && !isZeroTvl) return [];

    const range = effectiveBounds.xMax - effectiveBounds.xMin;
    const priceChanges = [
      effectiveBounds.xMin + range / 8,
      effectiveBounds.xMin + range / 2,
      effectiveBounds.xMin + (7 * range) / 8,
    ];

    return priceChanges.map((priceChange) => {
      const exitPrice = entryPrice * (1 + priceChange / 100);

      // For 0 TVL vaults, gains are spot-like (1:1 with price, minus fees)
      const gain = isZeroTvl
        ? calculateSpotGain(entryPrice, exitPrice, leverageRatio, baseFee)
        : calculateApeGain(entryPrice, exitPrice, satPrice, leverageRatio, baseFee);

      const gainPercent = (gain - 1) * 100;

      return {
        priceChange,
        gain: gainPercent,
      };
    });
  }, [currentPrice, leverageRatio, baseFee, saturationData.saturationPrice, isZeroTvl, effectiveBounds]);

  // Generate chart points using the correct gain formula:
  // G = f(g1) / f(g0) / [1 + (l-1)*fBase]^2
  // For 0 TVL vaults: G = (exitPrice / entryPrice) / feeFactor (spot-like)
  // Dynamically generated based on current view bounds
  const chartData = useMemo(() => {
    const points: ChartPoint[] = [];
    const entryPrice = currentPrice;
    const satPrice = saturationData.saturationPrice;

    // For 0 TVL vaults, we still generate chart data using spot gain
    if (satPrice <= 0 && !isZeroTvl) return points;

    // Generate points based on current view with some padding
    // Use ~100 points across the visible range for smooth curves
    const minChange = Math.max(-99, effectiveBounds.xMin - 10);
    const maxChange = effectiveBounds.xMax + 10;
    const range = maxChange - minChange;
    const step = Math.max(1, range / 100);

    for (
      let priceChange = minChange;
      priceChange <= maxChange;
      priceChange += step
    ) {
      const exitPrice = entryPrice * (1 + priceChange / 100);

      if (exitPrice <= 0) continue;

      // For 0 TVL vaults, gains are spot-like (1:1 with price, minus fees)
      const gain = isZeroTvl
        ? calculateSpotGain(entryPrice, exitPrice, leverageRatio, baseFee)
        : calculateApeGain(entryPrice, exitPrice, satPrice, leverageRatio, baseFee);

      // Convert to percentage (0% = break-even, where gain = 1)
      const gainPercent = (gain - 1) * 100;

      points.push({
        priceChange,
        gain: gainPercent,
      });
    }

    return points;
  }, [
    currentPrice,
    leverageRatio,
    baseFee,
    saturationData.saturationPrice,
    effectiveBounds,
  ]);

  // Zoom out - expand from current view center, cap xMin/yMin at -100%
  const zoomOut = useCallback(() => {
    // Get current bounds
    const currentXMin = zoomBounds?.xMin ?? DEFAULT_X_MIN;
    const currentXMax = zoomBounds?.xMax ?? DEFAULT_X_MAX;
    const currentYMin = zoomBounds?.yMin ?? defaultYBounds.yMin;
    const currentYMax = zoomBounds?.yMax ?? defaultYBounds.yMax;

    // Calculate expansion amount (25% of current range on each side)
    const xRange = currentXMax - currentXMin;
    const yRange = currentYMax - currentYMin;

    // Expand from center, but cap minimums at -100%
    const newXMin = Math.max(-100, currentXMin - xRange * 0.25);
    const newXMax = currentXMax + xRange * 0.25;
    const newYMin = Math.max(-100, currentYMin - yRange * 0.25);
    const newYMax = currentYMax + yRange * 0.25;

    setZoomBounds({
      xMin: newXMin,
      xMax: newXMax,
      yMin: newYMin,
      yMax: newYMax,
    });
  }, [zoomBounds, defaultYBounds]);

  // Calculate scales and Y-axis ticks (with zoom support)
  const { xScale, yScale, xMin, xMax, yMin, yMax, yTicks, xTicks } =
    useMemo(() => {
      // Use zoom bounds if set, otherwise use defaults
      const xMin = zoomBounds?.xMin ?? DEFAULT_X_MIN;
      const xMax = zoomBounds?.xMax ?? DEFAULT_X_MAX;
      const yMin = zoomBounds?.yMin ?? defaultYBounds.yMin;
      const yMax = zoomBounds?.yMax ?? defaultYBounds.yMax;

      const xScale = (val: number) =>
        CHART_PADDING.left + ((val - xMin) / (xMax - xMin)) * INNER_WIDTH;
      const yScale = (val: number) =>
        CHART_PADDING.top +
        INNER_HEIGHT -
        ((val - yMin) / (yMax - yMin)) * INNER_HEIGHT;

      // Generate Y-axis ticks
      const yRange = yMax - yMin;
      let yStep = 100;
      if (yRange > 2000) yStep = 500;
      else if (yRange > 1000) yStep = 250;
      else if (yRange > 500) yStep = 100;
      else if (yRange > 200) yStep = 50;
      else if (yRange > 100) yStep = 25;
      else yStep = 10;

      const yTicksArr: number[] = [];
      const yStart = Math.ceil(yMin / yStep) * yStep;
      for (let val = yStart; val <= yMax; val += yStep) {
        yTicksArr.push(val);
      }
      if (yMin <= 0 && yMax >= 0 && !yTicksArr.includes(0)) {
        yTicksArr.push(0);
        yTicksArr.sort((a, b) => a - b);
      }
      const maxYTicks = 6;
      const ySkipFactor = Math.ceil(yTicksArr.length / maxYTicks);
      const yTicks = yTicksArr.filter(
        (_, i) => i % ySkipFactor === 0 || yTicksArr[i] === 0,
      );

      // Generate X-axis ticks
      const xRange = xMax - xMin;
      let xStep = 50;
      if (xRange > 300) xStep = 100;
      else if (xRange > 150) xStep = 50;
      else if (xRange > 80) xStep = 25;
      else xStep = 10;

      const xTicksArr: number[] = [];
      const xStart = Math.ceil(xMin / xStep) * xStep;
      for (let val = xStart; val <= xMax; val += xStep) {
        xTicksArr.push(val);
      }
      if (xMin <= 0 && xMax >= 0 && !xTicksArr.includes(0)) {
        xTicksArr.push(0);
        xTicksArr.sort((a, b) => a - b);
      }
      const maxXTicks = 9;
      const xSkipFactor = Math.ceil(xTicksArr.length / maxXTicks);
      const xTicks = xTicksArr.filter(
        (_, i) => i % xSkipFactor === 0 || xTicksArr[i] === 0,
      );

      return { xScale, yScale, xMin, xMax, yMin, yMax, yTicks, xTicks };
    }, [zoomBounds, defaultYBounds]);

  // Handle mouse up - must be defined after scales so it can use xMin/xMax/yMin/yMax
  const handleMouseUp = useCallback(() => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    // Calculate selection rectangle in data coordinates
    const x1 = Math.min(dragStart.x, dragEnd.x);
    const x2 = Math.max(dragStart.x, dragEnd.x);
    const y1 = Math.min(dragStart.y, dragEnd.y);
    const y2 = Math.max(dragStart.y, dragEnd.y);

    // Minimum selection size (20px) to zoom in
    if (x2 - x1 > 20 && y2 - y1 > 20) {
      // Convert SVG coordinates to data coordinates
      const newXMin =
        xMin + ((x1 - CHART_PADDING.left) / INNER_WIDTH) * (xMax - xMin);
      const newXMax =
        xMin + ((x2 - CHART_PADDING.left) / INNER_WIDTH) * (xMax - xMin);
      // Y is inverted (SVG y increases downward, data y increases upward)
      const newYMax =
        yMax - ((y1 - CHART_PADDING.top) / INNER_HEIGHT) * (yMax - yMin);
      const newYMin =
        yMax - ((y2 - CHART_PADDING.top) / INNER_HEIGHT) * (yMax - yMin);

      setZoomBounds({
        xMin: newXMin,
        xMax: newXMax,
        yMin: newYMin,
        yMax: newYMax,
      });
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, xMin, xMax, yMin, yMax]);

  // Generate SVG path for the curve
  const linePath = useMemo(() => {
    if (chartData.length === 0) return "";

    const pathParts = chartData.map((point, i) => {
      const x = xScale(point.priceChange);
      const y = yScale(point.gain);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    });

    return pathParts.join(" ");
  }, [chartData, xScale, yScale]);

  // Generate spot (1x) holding line - gain equals price change
  const spotLinePath = useMemo(() => {
    // Spot line: gain% = priceChange% (simple 1:1 relationship)
    // Dynamically extend based on current view bounds
    const lineXMin = Math.max(-99, xMin - 10);
    const lineXMax = xMax + 10;

    // The line goes from (xMin, xMin) to (xMax, xMax) but clipped to yMin/yMax
    const startX = Math.max(lineXMin, yMin);
    const endX = Math.min(lineXMax, yMax);

    if (startX >= endX) return "";

    return `M ${xScale(startX)} ${yScale(startX)} L ${xScale(endX)} ${yScale(endX)}`;
  }, [xScale, yScale, xMin, xMax, yMin, yMax]);

  // Generate regular leverage line - gain = l * priceChange (linear, with liquidation risk)
  const regularLeveragePath = useMemo(() => {
    // Regular leverage: gain% = leverageRatio * priceChange%
    // Formula: l*(x-1)+1 where x = exitPrice/entryPrice, so gain% = l * priceChange%
    // Dynamically extend based on current view bounds
    const lineXMin = Math.max(-99, xMin - 10);
    const lineXMax = xMax + 10;

    // Find where the line intersects yMin and yMax
    // y = l * x, so x = y / l
    const xAtYMin = yMin / leverageRatio;
    const xAtYMax = yMax / leverageRatio;

    const startX = Math.max(lineXMin, xAtYMin);
    const endX = Math.min(lineXMax, xAtYMax);

    if (startX >= endX) return "";

    const startY = leverageRatio * startX;
    const endY = leverageRatio * endX;

    return `M ${xScale(startX)} ${yScale(startY)} L ${xScale(endX)} ${yScale(endY)}`;
  }, [xScale, yScale, xMin, xMax, yMin, yMax, leverageRatio]);

  // Don't render if we don't have valid data
  if (!currentPrice || currentPrice === 0 || chartData.length === 0) {
    return null;
  }

  const zeroY = yScale(0);
  // Show saturation line if it falls within the current visible x-axis range
  const saturationX =
    saturationData.saturationPriceChange > xMin &&
    saturationData.saturationPriceChange < xMax
      ? xScale(saturationData.saturationPriceChange)
      : null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="pt-2">
      <div className="flex items-center gap-2">
        <h4 className="text-sm text-foreground">Potential Returns</h4>
        <ToolTip size="300">
          This chart shows your potential profit/loss in {debtSymbol} terms as
          the {collateralSymbol}/{debtSymbol} price changes.
        </ToolTip>
      </div>
      <div className="pt-1"></div>
      <div className="rounded-md bg-primary/5 p-4 dark:bg-primary">
        <CollapsibleTrigger className="flex w-full items-center justify-between">
          {!isOpen ? (
            <span className="text-sm text-on-bg-subdued">
              Click to see chart
            </span>
          ) : (
            <span className="text-sm text-on-bg-subdued">
              Click to hide chart
            </span>
          )}
          <div className="flex items-center gap-2">
            {zoomBounds && isOpen && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetZoom();
                }}
                className="text-[11px] text-on-bg-subdued transition-colors hover:text-foreground"
              >
                Reset zoom
              </button>
            )}
            <ChevronDown
              className={`h-4 w-4 text-on-bg-subdued transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
          <div className="pt-3">
            {/* Legend */}
            <div className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-foreground">
              {/* APE leveraged line legend */}
              <div className="flex items-center gap-1.5">
                <svg width="16" height="4" className="inline-block">
                  <line
                    x1="0"
                    y1="2"
                    x2="16"
                    y2="2"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-accent"
                  />
                </svg>
                <span className="font-medium">
                  APE{" "}
                  <span className="font-normal text-on-bg-subdued">
                    (incl. fees)
                  </span>
                </span>
              </div>
              {/* Regular leverage line legend - dashed */}
              <div className="flex items-center gap-1.5">
                <svg width="16" height="4" className="inline-block">
                  <line
                    x1="0"
                    y1="2"
                    x2="16"
                    y2="2"
                    stroke="#fb923c"
                    strokeWidth="1.5"
                    strokeDasharray="6,4"
                  />
                </svg>
                <span>
                  Perp {leverageRatio}x{" "}
                  <span className="text-on-bg-subdued">(excl. fees)</span>
                </span>
              </div>
              {/* Spot line legend - dashed */}
              <div className="flex items-center gap-1.5">
                <svg width="16" height="4" className="inline-block">
                  <line
                    x1="0"
                    y1="2"
                    x2="16"
                    y2="2"
                    stroke="#a78bfa"
                    strokeWidth="1.5"
                    strokeDasharray="6,4"
                  />
                </svg>
                <span>Spot</span>
              </div>
              {/* Saturation threshold legend - hide for 0 TVL vaults */}
              {!isZeroTvl && (
                <div className="flex items-center gap-1.5">
                  <svg width="16" height="12" className="inline-block">
                    <line
                      x1="8"
                      y1="0"
                      x2="8"
                      y2="12"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="3,2"
                      className="text-foreground/60"
                    />
                  </svg>
                  <span>Saturation</span>
                  <ToolTip iconSize={12} size="300">
                    <div className="space-y-1.5">
                      <div>
                        This threshold marks where returns shift from convex to
                        linear gains.
                      </div>
                      <div>
                        It depends on the vault&apos;s current liquidity and your
                        deposit size. Larger deposits relative to vault liquidity
                        lower this threshold.
                      </div>
                    </div>
                  </ToolTip>
                </div>
              )}
            </div>

            {/* Chart area with lighter background for readability */}
            <div className="rounded bg-background/80 p-2 dark:bg-background/40">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                className="w-full select-none"
                preserveAspectRatio="xMidYMid meet"
                style={{ cursor: isDragging ? "crosshair" : "zoom-out" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onDoubleClick={zoomOut}
              >
                <defs>
                  {/* Clip path to constrain chart lines within the plot area, capped at -100% (can't lose more than 100%) */}
                  <clipPath id="chartClip">
                    <rect
                      x={CHART_PADDING.left}
                      y={CHART_PADDING.top}
                      width={INNER_WIDTH}
                      height={
                        Math.min(
                          yScale(-100),
                          CHART_PADDING.top + INNER_HEIGHT,
                        ) - CHART_PADDING.top
                      }
                    />
                  </clipPath>
                </defs>

                {/* Grid lines */}
                <g>
                  {/* Horizontal grid lines - use same ticks as Y-axis labels */}
                  {yTicks.map((val) => {
                    const y = yScale(val);
                    return (
                      <line
                        key={`h-${val}`}
                        x1={CHART_PADDING.left}
                        y1={y}
                        x2={CHART_WIDTH - CHART_PADDING.right}
                        y2={y}
                        style={{ stroke: "hsla(var(--foreground), 0.12)" }}
                        strokeDasharray="3,3"
                      />
                    );
                  })}
                  {/* Vertical grid lines - extend full chart height */}
                  {xTicks.map((val) => (
                    <line
                      key={`v-${val}`}
                      x1={xScale(val)}
                      y1={CHART_PADDING.top}
                      x2={xScale(val)}
                      y2={CHART_PADDING.top + INNER_HEIGHT}
                      style={{ stroke: "hsla(var(--foreground), 0.12)" }}
                      strokeDasharray="3,3"
                    />
                  ))}
                </g>

                {/* X-axis at 0% gain (break-even line) */}
                <line
                  x1={CHART_PADDING.left}
                  y1={zeroY}
                  x2={CHART_WIDTH - CHART_PADDING.right}
                  y2={zeroY}
                  style={{ stroke: "hsl(var(--foreground))" }}
                  strokeWidth="1"
                />

                {/* Y-axis at 0% price change (entry point) */}
                <line
                  x1={xScale(0)}
                  y1={CHART_PADDING.top}
                  x2={xScale(0)}
                  y2={CHART_PADDING.top + INNER_HEIGHT}
                  style={{ stroke: "hsl(var(--foreground))" }}
                  strokeWidth="1"
                />

                {/* Saturation threshold line */}
                {saturationX &&
                  saturationX > CHART_PADDING.left &&
                  saturationX < CHART_WIDTH - CHART_PADDING.right && (
                    <g>
                      <line
                        x1={saturationX}
                        y1={CHART_PADDING.top}
                        x2={saturationX}
                        y2={CHART_PADDING.top + INNER_HEIGHT}
                        style={{ stroke: "hsla(var(--foreground), 0.6)" }}
                        strokeWidth="1"
                        strokeDasharray="4,3"
                      />
                    </g>
                  )}

                {/* Spot (1x) holding reference line - dashed */}
                {spotLinePath && (
                  <path
                    d={spotLinePath}
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeDasharray="6,4"
                    clipPath="url(#chartClip)"
                  />
                )}

                {/* Regular leverage reference line - dashed */}
                {regularLeveragePath && (
                  <path
                    d={regularLeveragePath}
                    fill="none"
                    stroke="#fb923c"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeDasharray="6,4"
                    clipPath="url(#chartClip)"
                  />
                )}

                {/* Main curve line (leveraged position) */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-accent"
                  clipPath="url(#chartClip)"
                />

                {/* Key points */}
                {keyPoints.map((point, i) => {
                  const x = xScale(point.priceChange);
                  const y = yScale(point.gain);
                  return (
                    <g key={i}>
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill="currentColor"
                        className="text-accent"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r="6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="text-accent/50"
                      />
                    </g>
                  );
                })}

                {/* X-axis labels */}
                <g>
                  {xTicks.map((val) => (
                    <text
                      key={`xl-${val}`}
                      x={xScale(val)}
                      y={CHART_HEIGHT - CHART_PADDING.bottom + 15}
                      textAnchor="middle"
                      className="text-[9px]"
                      style={{ fill: "hsl(var(--foreground))" }}
                    >
                      {val === 0 ? "0" : val > 0 ? `+${val}%` : `${val}%`}
                    </text>
                  ))}
                </g>

                {/* Y-axis labels - uses same ticks as grid lines */}
                <g>
                  {yTicks.map((val) => (
                    <text
                      key={`yl-${val}`}
                      x={CHART_PADDING.left - 5}
                      y={yScale(val) + 3}
                      textAnchor="end"
                      className="text-[9px]"
                      style={{ fill: "hsl(var(--foreground))" }}
                    >
                      {val === 0 ? "0" : val > 0 ? `+${val}%` : `${val}%`}
                    </text>
                  ))}
                </g>

                {/* Axis titles */}
                <text
                  x={4}
                  y={8}
                  textAnchor="start"
                  className="text-[9px]"
                  style={{ fill: "hsl(var(--foreground))" }}
                >
                  Returns
                </text>
                <text
                  x={CHART_WIDTH / 2}
                  y={CHART_HEIGHT - 3}
                  textAnchor="middle"
                  className="text-[9px]"
                  style={{ fill: "hsl(var(--foreground))" }}
                >
                  {collateralSymbol}/{debtSymbol} Price Change
                </text>

                {/* Selection rectangle during drag */}
                {isDragging && dragStart && dragEnd && (
                  <rect
                    x={Math.min(dragStart.x, dragEnd.x)}
                    y={Math.min(dragStart.y, dragEnd.y)}
                    width={Math.abs(dragEnd.x - dragStart.x)}
                    height={Math.abs(dragEnd.y - dragStart.y)}
                    fill="hsla(var(--accent), 0.15)"
                    stroke="hsla(var(--accent), 0.5)"
                    strokeWidth="1"
                    strokeDasharray="4,2"
                  />
                )}
              </svg>
            </div>

            {/* Key points summary */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              {keyPoints.map((point, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center rounded bg-background/60 px-2 py-1.5 dark:bg-background/30"
                >
                  <span className="text-[11px] text-foreground/70">
                    {point.priceChange >= 0 ? "+" : ""}
                    <DisplayFormattedNumber num={point.priceChange} significant={3} />%
                  </span>
                  <span
                    className={
                      point.gain >= 0
                        ? "font-semibold text-accent"
                        : "font-semibold text-red"
                    }
                  >
                    {point.gain >= 0 ? "+" : ""}
                    <DisplayFormattedNumber num={point.gain} significant={3} />%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
