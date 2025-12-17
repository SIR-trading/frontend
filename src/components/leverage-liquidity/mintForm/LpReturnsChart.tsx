"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  calculateSaturationPrice,
  getLeverageRatio,
} from "@/lib/utils/calculations";
import { getSirSymbol } from "@/lib/assets";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import ToolTip from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Search } from "lucide-react";
import { Slider } from "@/components/ui/slider";

// Default axis bounds in log10(ratio) space
// Using 2*log10(2) so key points at 25%/75% land exactly on -50%/+100%
const LOG10_2 = Math.log10(2);
const DEFAULT_LOG_X_MIN = -2 * LOG10_2; // 0.25x (-75%)
const DEFAULT_LOG_X_MAX = 2 * LOG10_2; // 4x (+300%)
const DEFAULT_LOG_Y_MIN = -2 * LOG10_2;
const DEFAULT_LOG_Y_MAX = 2 * LOG10_2;

/**
 * Core gain function f(x) for positions:
 * - f(x) = x^l if x <= 1 (power zone)
 * - f(x) = l*(x-1) + 1 if x >= 1 (saturation zone)
 */
function f(x: number, l: number): number {
  if (x <= 1) {
    return Math.pow(x, l);
  } else {
    return l * (x - 1) + 1;
  }
}

/**
 * Calculate LP gain in debt token terms.
 *
 * Formula: G = [l*g₁ - f(g₁)] / [l*g₀ - f(g₀)] / (1 + fLp)
 *
 * Where:
 * - g₀ = entryPrice / saturationPrice
 * - g₁ = exitPrice / saturationPrice
 * - l = leverage ratio
 * - fLp = LP fee
 */
function calculateLpGainDebt(
  entryPrice: number,
  exitPrice: number,
  saturationPrice: number,
  leverageRatio: number,
  lpFee: number,
): number {
  if (saturationPrice <= 0 || entryPrice <= 0) return 1;

  const g0 = entryPrice / saturationPrice;
  const g1 = exitPrice / saturationPrice;

  const numerator = leverageRatio * g1 - f(g1, leverageRatio);
  const denominator = leverageRatio * g0 - f(g0, leverageRatio);

  if (denominator <= 0) return 1;

  return numerator / denominator / (1 + lpFee);
}

/**
 * Calculate LP gain in collateral token terms.
 *
 * Formula: G_coll = G_debt * entryPrice / exitPrice
 */
function calculateLpGainCollateral(
  gainDebt: number,
  entryPrice: number,
  exitPrice: number,
): number {
  if (exitPrice <= 0) return gainDebt;
  return (gainDebt * entryPrice) / exitPrice;
}

/**
 * Convert percentage change to log10(ratio)
 * Works for both price changes and gain changes:
 * +100% means 2x, log10(2) ≈ 0.301
 * -50% means 0.5x, log10(0.5) ≈ -0.301
 */
function percentToLog(percent: number): number {
  const ratio = 1 + percent / 100;
  if (ratio <= 0) return -Infinity;
  return Math.log10(ratio);
}

/**
 * Convert log10(ratio) to percentage change
 */
function logToPercent(logValue: number): number {
  const ratio = Math.pow(10, logValue);
  return (ratio - 1) * 100;
}

/**
 * Format a log value as a readable axis label
 * Uses percentage for moderate changes, multiplier notation for extreme values
 * Works directly with log values to avoid overflow for extreme zoom levels
 */
function formatLogLabel(logValue: number): string {
  if (Math.abs(logValue) < 0.0001) return "0";

  // For extreme values (beyond what Math.pow can handle cleanly), use exponent notation
  // log10(ratio) > 6 means ratio > 1,000,000x
  if (logValue > 6) {
    return `10^${Math.round(logValue)}`;
  }
  // log10(ratio) < -3 means ratio < 0.001x (less than 0.1% remaining)
  if (logValue < -3) {
    return `10^${Math.round(logValue)}`;
  }

  const ratio = Math.pow(10, logValue);
  const percent = (ratio - 1) * 100;

  // For positive gains up to +900%, show percentage
  if (logValue >= 0 && logValue < 1) {
    return `+${Math.round(percent)}%`;
  }

  // For losses down to -90%, show percentage
  if (logValue >= -1 && logValue < 0) {
    return `${Math.round(percent)}%`;
  }

  // For 10x to 1,000,000x, show multiplier
  if (logValue >= 1 && logValue <= 6) {
    if (ratio >= 1000) {
      return `${Math.round(ratio / 1000)}kx`;
    }
    return `${Math.round(ratio)}x`;
  }

  // For 0.001x to 0.1x (-99.9% to -90%), show percentage of original
  if (logValue >= -3 && logValue < -1) {
    return `-${(100 - ratio * 100).toFixed(0)}%`;
  }

  return `${Math.round(percent)}%`;
}

interface LpReturnsChartProps {
  leverageTier: number;
  lpFee: number; // LP minting fee (flat, not scaled by leverage)
  apeReserve: bigint;
  teaReserve: bigint;
  currentPrice: number;
  collateralSymbol: string;
  debtSymbol: string;
  depositAmount: number;
  collateralDecimals: number;
  apy?: number; // Current APY for the vault
}

interface ChartPoint {
  priceChange: number; // percentage change from entry
  logX: number; // log10(priceRatio) for x positioning
  gainDebt: number; // percentage gain in debt token terms
  gainCollateral: number; // percentage gain in collateral terms
  logYDebt: number; // log10(gainRatio) for y positioning (debt)
  logYCollateral: number; // log10(gainRatio) for y positioning (collateral)
  // Yield-adjusted values (1 year at current APY)
  logYDebtWithYield: number;
  logYCollateralWithYield: number;
}

// SVG dimensions and padding
const CHART_WIDTH = 500;
const CHART_HEIGHT = 300;
const CHART_PADDING = { top: 28, right: 18, bottom: 42, left: 50 };
const INNER_WIDTH = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
const INNER_HEIGHT = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

export default function LpReturnsChart({
  leverageTier,
  lpFee,
  apeReserve,
  teaReserve,
  currentPrice,
  collateralSymbol,
  debtSymbol,
  depositAmount,
  collateralDecimals,
  apy,
}: LpReturnsChartProps) {
  const leverageRatio = getLeverageRatio(leverageTier);
  const svgRef = useRef<SVGSVGElement>(null);

  // Collapsible state
  const [isOpen, setIsOpen] = useState(false);

  // Zoom state (in log space for both axes)
  const [zoomBounds, setZoomBounds] = useState<{
    logXMin: number;
    logXMax: number;
    logYMin: number;
    logYMax: number;
  } | null>(null);

  // Drag selection state
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Ratio slider: controls apeReserve/teaReserve ratio
  // Steps from 0.1x to 10x with 1x in the center
  // Equal number of steps on each side for symmetric slider
  const STEPS_PER_SIDE = 45;
  const RATIO_STEPS = useMemo(() => {
    const steps: number[] = [];
    // Below 1x: 0.1 to ~0.98 (45 steps)
    for (let i = 0; i < STEPS_PER_SIDE; i++) {
      // Linear interpolation from 0.1 to 1 (exclusive)
      const v = 0.1 + (0.9 * i) / STEPS_PER_SIDE;
      steps.push(Math.round(v * 100) / 100);
    }
    // Center: 1x
    steps.push(1);
    // Above 1x: ~1.2 to 10 (45 steps)
    for (let i = 1; i <= STEPS_PER_SIDE; i++) {
      // Linear interpolation from 1 to 10 (exclusive of 1)
      const v = 1 + (9 * i) / STEPS_PER_SIDE;
      steps.push(Math.round(v * 10) / 10);
    }
    return steps;
  }, []);
  const DEFAULT_RATIO_INDEX = STEPS_PER_SIDE; // 1x is at the center
  const [ratioIndex, setRatioIndex] = useState(DEFAULT_RATIO_INDEX);
  const ratioMultiplier = RATIO_STEPS[ratioIndex] ?? 1;

  // Toggle for showing yield-adjusted lines (1 year at current APY)
  const [showYieldLines, setShowYieldLines] = useState(false);
  const yieldMultiplier = apy !== undefined && apy > 0 ? 1 + apy / 100 : 1;

  // Reset to default view
  const resetZoom = useCallback(() => {
    setZoomBounds(null);
  }, []);

  // Handle keyboard shortcuts
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

  // Calculate adjusted reserves for LP deposit and ratio slider
  // For LPs: entire deposit goes to teaReserve (including fee as POL)
  // Ratio slider scales apeReserve to simulate different APE/LP ratios
  const adjustedReserves = useMemo(() => {
    // Apply ratio multiplier to apeReserve
    const scaledApeReserve = BigInt(
      Math.floor(Number(apeReserve) * ratioMultiplier),
    );

    if (
      !depositAmount ||
      depositAmount <= 0 ||
      !Number.isFinite(depositAmount)
    ) {
      return { apeReserve: scaledApeReserve, teaReserve };
    }

    // Convert deposit to bigint
    const depositBigInt = BigInt(
      Math.floor(Math.max(0, depositAmount) * Math.pow(10, collateralDecimals)),
    );

    return {
      apeReserve: scaledApeReserve, // Scaled by ratio multiplier
      teaReserve: teaReserve + depositBigInt, // Deposit goes to LP reserve
    };
  }, [
    apeReserve,
    teaReserve,
    depositAmount,
    collateralDecimals,
    ratioMultiplier,
  ]);

  // Calculate saturation price
  const saturationData = useMemo(() => {
    if (
      !currentPrice ||
      currentPrice === 0 ||
      adjustedReserves.apeReserve === 0n
    ) {
      return { saturationPrice: 0, saturationLogX: Infinity };
    }

    const satPrice = calculateSaturationPrice(
      currentPrice,
      adjustedReserves.apeReserve,
      adjustedReserves.teaReserve,
      leverageRatio,
    );

    const satPriceChange = ((satPrice - currentPrice) / currentPrice) * 100;
    const satLogX = percentToLog(satPriceChange);

    return {
      saturationPrice: satPrice,
      saturationPriceChange: satPriceChange,
      saturationLogX: satLogX,
    };
  }, [
    currentPrice,
    adjustedReserves.apeReserve,
    adjustedReserves.teaReserve,
    leverageRatio,
  ]);

  // Effective bounds (all in log space)
  const effectiveBounds = useMemo(() => {
    return {
      logXMin: zoomBounds?.logXMin ?? DEFAULT_LOG_X_MIN,
      logXMax: zoomBounds?.logXMax ?? DEFAULT_LOG_X_MAX,
      logYMin: zoomBounds?.logYMin ?? DEFAULT_LOG_Y_MIN,
      logYMax: zoomBounds?.logYMax ?? DEFAULT_LOG_Y_MAX,
    };
  }, [zoomBounds]);

  // Generate chart data points
  const chartData = useMemo(() => {
    const points: ChartPoint[] = [];
    const entryPrice = currentPrice;
    const satPrice = saturationData.saturationPrice;

    if (satPrice <= 0) return points;

    // Generate points across log space with margin that scales with visible range
    const logRange = effectiveBounds.logXMax - effectiveBounds.logXMin;
    const margin = Math.max(0.1, logRange * 0.1); // At least 10% of visible range
    const logMin = effectiveBounds.logXMin - margin;
    const logMax = effectiveBounds.logXMax + margin;
    const numPoints = 150;
    const logStep = (logMax - logMin) / numPoints;

    for (let logX = logMin; logX <= logMax; logX += logStep) {
      const priceChange = logToPercent(logX);
      const exitPrice = entryPrice * (1 + priceChange / 100);

      if (exitPrice <= 0) continue;

      const gainDebt = calculateLpGainDebt(
        entryPrice,
        exitPrice,
        satPrice,
        leverageRatio,
        lpFee,
      );
      const gainCollateral = calculateLpGainCollateral(
        gainDebt,
        entryPrice,
        exitPrice,
      );

      const gainDebtPercent = (gainDebt - 1) * 100;
      const gainCollateralPercent = (gainCollateral - 1) * 100;

      // Convert gains to log space for positioning
      // gainDebt is the raw multiplier (e.g., 0.95 for -5% loss)
      const logYDebt = Math.log10(gainDebt);
      const logYCollateral = Math.log10(gainCollateral);

      // Yield-adjusted values (1 year at current APY)
      const gainDebtWithYield = gainDebt * yieldMultiplier;
      const gainCollateralWithYield = gainCollateral * yieldMultiplier;
      const logYDebtWithYield = Math.log10(gainDebtWithYield);
      const logYCollateralWithYield = Math.log10(gainCollateralWithYield);

      points.push({
        priceChange,
        logX,
        gainDebt: gainDebtPercent,
        gainCollateral: gainCollateralPercent,
        logYDebt,
        logYCollateral,
        logYDebtWithYield,
        logYCollateralWithYield,
      });
    }

    return points;
  }, [
    currentPrice,
    leverageRatio,
    lpFee,
    saturationData.saturationPrice,
    effectiveBounds,
    yieldMultiplier,
  ]);

  // Key points at positions based on current zoom bounds
  // Left (25%), center (50%), right (75%) of the visible range
  const keyPoints = useMemo(() => {
    const entryPrice = currentPrice;
    const satPrice = saturationData.saturationPrice;

    if (satPrice <= 0) return [];

    const logXMin = zoomBounds?.logXMin ?? DEFAULT_LOG_X_MIN;
    const logXMax = zoomBounds?.logXMax ?? DEFAULT_LOG_X_MAX;
    const range = logXMax - logXMin;

    // Position at 25% and 75% of the visible range (skip center)
    const logPositions = [
      logXMin + range * 0.25,
      logXMin + range * 0.75,
    ];

    return logPositions.map((logX) => {
      const priceChange = logToPercent(logX);
      const exitPrice = entryPrice * (1 + priceChange / 100);

      const gainDebt = calculateLpGainDebt(
        entryPrice,
        exitPrice,
        satPrice,
        leverageRatio,
        lpFee,
      );
      const gainCollateral = calculateLpGainCollateral(
        gainDebt,
        entryPrice,
        exitPrice,
      );

      // Apply yield multiplier if showing yield-adjusted values
      const adjustedGainDebt = showYieldLines
        ? gainDebt * yieldMultiplier
        : gainDebt;
      const adjustedGainCollateral = showYieldLines
        ? gainCollateral * yieldMultiplier
        : gainCollateral;

      return {
        priceChange,
        logX,
        gainDebt: (adjustedGainDebt - 1) * 100,
        gainCollateral: (adjustedGainCollateral - 1) * 100,
        logYDebt: Math.log10(adjustedGainDebt),
        logYCollateral: Math.log10(adjustedGainCollateral),
      };
    });
  }, [
    currentPrice,
    leverageRatio,
    lpFee,
    saturationData.saturationPrice,
    zoomBounds,
    showYieldLines,
    yieldMultiplier,
  ]);

  // Zoom out - with maximum range limit to prevent extreme zoom
  // Max range of 12 log units = 10^12 = 1 trillion x multiplier
  const MAX_LOG_RANGE = 12;

  const zoomOut = useCallback(() => {
    const currentLogXMin = zoomBounds?.logXMin ?? DEFAULT_LOG_X_MIN;
    const currentLogXMax = zoomBounds?.logXMax ?? DEFAULT_LOG_X_MAX;
    const currentLogYMin = zoomBounds?.logYMin ?? DEFAULT_LOG_Y_MIN;
    const currentLogYMax = zoomBounds?.logYMax ?? DEFAULT_LOG_Y_MAX;

    const logXRange = currentLogXMax - currentLogXMin;
    const logYRange = currentLogYMax - currentLogYMin;

    // Don't zoom out further if already at max range
    if (logXRange >= MAX_LOG_RANGE && logYRange >= MAX_LOG_RANGE) {
      return;
    }

    const newLogXMin = currentLogXMin - logXRange * 0.25;
    const newLogXMax = currentLogXMax + logXRange * 0.25;
    const newLogYMin = currentLogYMin - logYRange * 0.25;
    const newLogYMax = currentLogYMax + logYRange * 0.25;

    // Clamp to maximum range
    const clampedLogXRange = Math.min(newLogXMax - newLogXMin, MAX_LOG_RANGE);
    const clampedLogYRange = Math.min(newLogYMax - newLogYMin, MAX_LOG_RANGE);
    const xCenter = (newLogXMin + newLogXMax) / 2;
    const yCenter = (newLogYMin + newLogYMax) / 2;

    setZoomBounds({
      logXMin: xCenter - clampedLogXRange / 2,
      logXMax: xCenter + clampedLogXRange / 2,
      logYMin: yCenter - clampedLogYRange / 2,
      logYMax: yCenter + clampedLogYRange / 2,
    });
  }, [zoomBounds]);

  // Calculate scales and ticks (both axes in log space)
  const { xScale, yScale, logXMin, logXMax, logYMin, logYMax, yTicks, xTicks } =
    useMemo(() => {
      const logXMin = zoomBounds?.logXMin ?? DEFAULT_LOG_X_MIN;
      const logXMax = zoomBounds?.logXMax ?? DEFAULT_LOG_X_MAX;
      const logYMin = zoomBounds?.logYMin ?? DEFAULT_LOG_Y_MIN;
      const logYMax = zoomBounds?.logYMax ?? DEFAULT_LOG_Y_MAX;

      // X scale uses log space
      const xScale = (logVal: number) =>
        CHART_PADDING.left +
        ((logVal - logXMin) / (logXMax - logXMin)) * INNER_WIDTH;

      // Y scale uses log space
      const yScale = (logVal: number) =>
        CHART_PADDING.top +
        INNER_HEIGHT -
        ((logVal - logYMin) / (logYMax - logYMin)) * INNER_HEIGHT;

      // Generate ticks dynamically based on range (in log space)
      // Uses "nice" step sizes that scale gracefully for any zoom level
      const generateLogTicks = (min: number, max: number, maxTicks: number) => {
        const range = max - min;
        if (range <= 0) return [0];

        // Choose step size based on range - scales to any zoom level
        // For very large ranges, use integer steps (powers of 10)
        let step: number;
        if (range > 20) step = 5; // 100,000x increments
        else if (range > 10) step = 2; // 100x increments
        else if (range > 8) step = 4 * LOG10_2; // 16x increments
        else if (range > 4) step = 2 * LOG10_2; // 4x increments
        else if (range > 2) step = LOG10_2; // 2x increments
        else if (range > 1) step = LOG10_2 / 2;
        else if (range > 0.5) step = LOG10_2 / 4;
        else step = LOG10_2 / 8;

        // Generate ticks at multiples of step
        const ticksArr: number[] = [];
        const start = Math.ceil(min / step) * step;
        for (let val = start; val <= max + step * 0.001; val += step) {
          ticksArr.push(Math.round(val * 10000) / 10000);
        }

        // Always include 0 if in range
        if (min <= 0 && max >= 0 && !ticksArr.some((t) => Math.abs(t) < 0.0001)) {
          ticksArr.push(0);
          ticksArr.sort((a, b) => a - b);
        }

        // Apply skip factor to limit ticks, but always keep 0
        const skipFactor = Math.ceil(ticksArr.length / maxTicks);
        return ticksArr.filter(
          (t, i) => i % skipFactor === 0 || Math.abs(t) < 0.0001,
        );
      };

      // X-axis ticks
      const xTicksArr = generateLogTicks(logXMin, logXMax, 7);

      // Y-axis ticks
      const yTicksArr = generateLogTicks(logYMin, logYMax, 6);

      return {
        xScale,
        yScale,
        logXMin,
        logXMax,
        logYMin,
        logYMax,
        yTicks: yTicksArr,
        xTicks: xTicksArr,
      };
    }, [zoomBounds]);

  // Handle mouse up for zoom
  const handleMouseUp = useCallback(() => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    const x1 = Math.min(dragStart.x, dragEnd.x);
    const x2 = Math.max(dragStart.x, dragEnd.x);
    const y1 = Math.min(dragStart.y, dragEnd.y);
    const y2 = Math.max(dragStart.y, dragEnd.y);

    const dragWidth = x2 - x1;
    const dragHeight = y2 - y1;

    if (dragWidth > 20 && dragHeight > 20) {
      const newLogXMin =
        logXMin +
        ((x1 - CHART_PADDING.left) / INNER_WIDTH) * (logXMax - logXMin);
      const newLogXMax =
        logXMin +
        ((x2 - CHART_PADDING.left) / INNER_WIDTH) * (logXMax - logXMin);
      // Y is inverted (SVG y increases downward)
      const newLogYMax =
        logYMax -
        ((y1 - CHART_PADDING.top) / INNER_HEIGHT) * (logYMax - logYMin);
      const newLogYMin =
        logYMax -
        ((y2 - CHART_PADDING.top) / INNER_HEIGHT) * (logYMax - logYMin);

      setZoomBounds({
        logXMin: newLogXMin,
        logXMax: newLogXMax,
        logYMin: newLogYMin,
        logYMax: newLogYMax,
      });
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, logXMin, logXMax, logYMin, logYMax]);

  // Generate SVG paths (using log Y values, optionally with yield)
  const debtLinePath = useMemo(() => {
    if (chartData.length === 0) return "";

    const pathParts = chartData.map((point, i) => {
      const x = xScale(point.logX);
      const y = yScale(
        showYieldLines ? point.logYDebtWithYield : point.logYDebt,
      );
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    });

    return pathParts.join(" ");
  }, [chartData, xScale, yScale, showYieldLines]);

  const collateralLinePath = useMemo(() => {
    if (chartData.length === 0) return "";

    const pathParts = chartData.map((point, i) => {
      const x = xScale(point.logX);
      const y = yScale(
        showYieldLines ? point.logYCollateralWithYield : point.logYCollateral,
      );
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    });

    return pathParts.join(" ");
  }, [chartData, xScale, yScale, showYieldLines]);

  // Spot collateral line: valued in debt terms, y = x (price change = value change)
  const spotCollateralPath = useMemo(() => {
    const points = chartData.map((point) => ({
      x: xScale(point.logX),
      y: yScale(point.logX), // y = x in log space
    }));
    if (points.length === 0) return "";
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");
  }, [chartData, xScale, yScale]);

  // Spot debt line: valued in collateral terms, y = -x (inverse of price change)
  const spotDebtPath = useMemo(() => {
    const points = chartData.map((point) => ({
      x: xScale(point.logX),
      y: yScale(-point.logX), // y = -x in log space
    }));
    if (points.length === 0) return "";
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");
  }, [chartData, xScale, yScale]);

  // Don't render if we don't have valid data
  if (!currentPrice || currentPrice === 0 || chartData.length === 0) {
    return null;
  }

  // log(1) = 0, so this is the "no change" line for both axes
  const zeroY = yScale(0);
  const zeroX = xScale(0);

  // Saturation line position
  const saturationX =
    saturationData.saturationLogX !== undefined &&
    saturationData.saturationLogX >= logXMin &&
    saturationData.saturationLogX < logXMax
      ? xScale(saturationData.saturationLogX)
      : null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="pt-2">
      <div className="flex items-center gap-2">
        <h4 className="text-sm text-foreground">LP Equity Profile</h4>
        <ToolTip size="300">
          See how {collateralSymbol}/{debtSymbol} price movements affect your LP
          equity, measured in both tokens. Yield accrues regardless of price
          direction.
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
            {isOpen && (
              <div
                className="flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                {zoomBounds ? (
                  <div className="flex items-center rounded-full border border-foreground/20 text-[11px]">
                    <button
                      type="button"
                      onClick={resetZoom}
                      className="rounded-l-full px-2 py-0.5 text-on-bg-subdued transition-colors hover:bg-background/50 hover:text-foreground"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={zoomOut}
                      className="flex items-center gap-1 rounded-r-full border-l border-foreground/20 px-2 py-0.5 text-on-bg-subdued transition-colors hover:bg-background/50 hover:text-foreground"
                      title="Zoom out"
                    >
                      <Search className="h-3 w-3" />
                      <span>-</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={zoomOut}
                    className="flex items-center gap-1 rounded-full border border-foreground/20 px-2 py-0.5 text-[11px] text-on-bg-subdued transition-colors hover:bg-background/50 hover:text-foreground"
                    title="Zoom out"
                  >
                    <Search className="h-3 w-3" />
                    <span>-</span>
                  </button>
                )}
              </div>
            )}
            <ChevronDown
              className={`h-4 w-4 text-on-bg-subdued transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div className="pt-3">
            {/* APY Display with yield toggle */}
            {apy !== undefined && apy > 0 && (
              <div className="mb-3 flex flex-col items-center gap-2 rounded bg-accent/10 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground/70">Current APY:</span>
                  <span className="text-lg font-semibold text-accent">
                    <DisplayFormattedNumber num={apy} significant={3} />%
                  </span>
                  <ToolTip iconSize={14} size="300">
                    This yield comes from fees paid by leveraged traders (APE
                    holders) and {getSirSymbol()} rewards. Price movements affect
                    your position value, but you continuously earn this yield
                    regardless of direction.
                  </ToolTip>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-[11px] text-foreground/70">
                  <input
                    type="checkbox"
                    checked={showYieldLines}
                    onChange={(e) => setShowYieldLines(e.target.checked)}
                    className="h-3.5 w-3.5 cursor-pointer rounded border-foreground/30 accent-accent"
                  />
                  Show value after 1 year yield
                </label>
              </div>
            )}

            {/* Legend */}
            <div className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-foreground">
              {/* Collateral value line */}
              <div className="flex items-center gap-1.5">
                <svg width="16" height="4" className="inline-block">
                  <line
                    x1="0"
                    y1="2"
                    x2="16"
                    y2="2"
                    stroke="#22c55e"
                    strokeWidth="2"
                  />
                </svg>
                <span className="font-medium">Value in {collateralSymbol}</span>
              </div>
              {/* Spot debt line legend - dashed (also valued in collateral) */}
              <div className="flex items-center gap-1.5">
                <svg width="16" height="4" className="inline-block">
                  <line
                    x1="0"
                    y1="2"
                    x2="16"
                    y2="2"
                    stroke="#86efac"
                    strokeWidth="1.5"
                    strokeDasharray="6,4"
                  />
                </svg>
                <span>
                  Spot {debtSymbol}{" "}
                  <span className="text-foreground/60">
                    (in {collateralSymbol})
                  </span>
                </span>
              </div>
              {/* Debt token value line */}
              <div className="flex items-center gap-1.5">
                <svg width="16" height="4" className="inline-block">
                  <line
                    x1="0"
                    y1="2"
                    x2="16"
                    y2="2"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                </svg>
                <span className="font-medium">Value in {debtSymbol}</span>
              </div>
              {/* Spot collateral line legend - dashed (also valued in debt) */}
              <div className="flex items-center gap-1.5">
                <svg width="16" height="4" className="inline-block">
                  <line
                    x1="0"
                    y1="2"
                    x2="16"
                    y2="2"
                    stroke="#93c5fd"
                    strokeWidth="1.5"
                    strokeDasharray="6,4"
                  />
                </svg>
                <span>
                  Spot {collateralSymbol}{" "}
                  <span className="text-foreground/60">(in {debtSymbol})</span>
                </span>
              </div>
              {/* Saturation threshold */}
              <div className="flex items-center gap-1.5">
                <svg width="20" height="12" className="inline-block">
                  <defs>
                    <linearGradient
                      id="lpLegendSatGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop
                        offset="0%"
                        stopColor="#f59e0b"
                        stopOpacity="0.15"
                      />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <rect
                    x="8"
                    y="0"
                    width="12"
                    height="12"
                    fill="url(#lpLegendSatGradient)"
                  />
                  <line
                    x1="8"
                    y1="0"
                    x2="8"
                    y2="12"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="6,3"
                    className="text-foreground"
                  />
                </svg>
                <span>Saturation</span>
                <ToolTip iconSize={14} size="250">
                  In the saturation zone, LP equity is fully denominated in{" "}
                  {debtSymbol}.
                </ToolTip>
              </div>
            </div>

            {/* APE/LP Ratio Slider - hide for 0 TVL vaults */}
            {apeReserve > 0n && (
              <div className="mb-3 px-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 whitespace-nowrap text-[11px] text-foreground/70">
                    APE/LP Ratio:
                    <ToolTip iconSize={12} size="300">
                      Adjust the ratio between APE reserve and LP reserve to see
                      how impermanent loss affects LPers. Higher ratio means
                      saturation is reached at smaller price movements.
                    </ToolTip>
                  </span>
                  <Slider
                    value={[ratioIndex]}
                    onValueChange={(values) =>
                      setRatioIndex(values[0] ?? DEFAULT_RATIO_INDEX)
                    }
                    min={0}
                    max={RATIO_STEPS.length - 1}
                    step={1}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setRatioIndex(DEFAULT_RATIO_INDEX)}
                    className={`text-right text-[11px] font-medium ${
                      ratioIndex !== DEFAULT_RATIO_INDEX
                        ? "cursor-pointer text-foreground underline hover:text-foreground/70"
                        : "cursor-default text-foreground"
                    }`}
                    title={
                      ratioIndex !== DEFAULT_RATIO_INDEX
                        ? "Click to reset to current"
                        : undefined
                    }
                  >
                    {ratioIndex === DEFAULT_RATIO_INDEX
                      ? "Current"
                      : ratioMultiplier < 1
                        ? `${ratioMultiplier.toFixed(2)}x`
                        : ratioMultiplier === 10
                          ? "10x"
                          : `${ratioMultiplier.toFixed(1)}x`}
                  </button>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="rounded bg-background/80 p-2 dark:bg-background/40">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                className="w-full select-none"
                preserveAspectRatio="xMidYMid meet"
                style={{ cursor: isDragging ? "crosshair" : "default" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
              >
                <defs>
                  <clipPath id="lpChartClip">
                    <rect
                      x={CHART_PADDING.left}
                      y={CHART_PADDING.top}
                      width={INNER_WIDTH}
                      height={INNER_HEIGHT}
                    />
                  </clipPath>
                  <linearGradient
                    id="lpSaturationGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                <g>
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
                  {xTicks.map((logVal) => (
                    <line
                      key={`v-${logVal}`}
                      x1={xScale(logVal)}
                      y1={CHART_PADDING.top}
                      x2={xScale(logVal)}
                      y2={CHART_PADDING.top + INNER_HEIGHT}
                      style={{ stroke: "hsla(var(--foreground), 0.12)" }}
                      strokeDasharray="3,3"
                    />
                  ))}
                </g>

                {/* X-axis at 0% gain */}
                <line
                  x1={CHART_PADDING.left}
                  y1={zeroY}
                  x2={CHART_WIDTH - CHART_PADDING.right}
                  y2={zeroY}
                  style={{ stroke: "hsl(var(--foreground))" }}
                  strokeWidth="1"
                />

                {/* Y-axis at 0% price change (log=0, ratio=1) */}
                {zeroX >= CHART_PADDING.left &&
                  zeroX <= CHART_WIDTH - CHART_PADDING.right && (
                    <line
                      x1={zeroX}
                      y1={CHART_PADDING.top}
                      x2={zeroX}
                      y2={CHART_PADDING.top + INNER_HEIGHT}
                      style={{ stroke: "hsl(var(--foreground))" }}
                      strokeWidth="1"
                    />
                  )}

                {/* Saturation zone gradient */}
                {saturationX &&
                  saturationX >= CHART_PADDING.left &&
                  saturationX < CHART_WIDTH - CHART_PADDING.right && (
                    <rect
                      x={saturationX}
                      y={CHART_PADDING.top}
                      width={CHART_WIDTH - CHART_PADDING.right - saturationX}
                      height={INNER_HEIGHT}
                      fill="url(#lpSaturationGradient)"
                    />
                  )}

                {/* Saturation threshold line */}
                {saturationX &&
                  saturationX >= CHART_PADDING.left &&
                  saturationX < CHART_WIDTH - CHART_PADDING.right && (
                    <line
                      x1={saturationX}
                      y1={CHART_PADDING.top}
                      x2={saturationX}
                      y2={CHART_PADDING.top + INNER_HEIGHT}
                      style={{ stroke: "hsl(var(--foreground))" }}
                      strokeWidth="1"
                      strokeDasharray="6,3"
                    />
                  )}

                {/* Spot collateral line - dashed muted blue (valued in debt) */}
                {spotCollateralPath && (
                  <path
                    d={spotCollateralPath}
                    fill="none"
                    stroke="#93c5fd"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeDasharray="6,4"
                    clipPath="url(#lpChartClip)"
                  />
                )}

                {/* Spot debt line - dashed muted green (valued in collateral) */}
                {spotDebtPath && (
                  <path
                    d={spotDebtPath}
                    fill="none"
                    stroke="#86efac"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeDasharray="6,4"
                    clipPath="url(#lpChartClip)"
                  />
                )}

                {/* Debt token value line (blue) */}
                <path
                  d={debtLinePath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  clipPath="url(#lpChartClip)"
                />

                {/* Collateral value line (green) */}
                <path
                  d={collateralLinePath}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  clipPath="url(#lpChartClip)"
                />

                {/* Key points for collateral line */}
                {keyPoints.map((point, i) => {
                  const x = xScale(point.logX);
                  const y = yScale(point.logYCollateral);
                  if (
                    y < CHART_PADDING.top ||
                    y > CHART_PADDING.top + INNER_HEIGHT
                  ) {
                    return null;
                  }
                  return (
                    <g key={`coll-${i}`}>
                      <circle cx={x} cy={y} r="4" fill="#22c55e" />
                      <circle
                        cx={x}
                        cy={y}
                        r="6"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="1.5"
                        opacity="0.5"
                      />
                    </g>
                  );
                })}

                {/* Key points for debt line */}
                {keyPoints.map((point, i) => {
                  const x = xScale(point.logX);
                  const y = yScale(point.logYDebt);
                  if (
                    y < CHART_PADDING.top ||
                    y > CHART_PADDING.top + INNER_HEIGHT
                  ) {
                    return null;
                  }
                  return (
                    <g key={`debt-${i}`}>
                      <circle cx={x} cy={y} r="4" fill="#3b82f6" />
                      <circle
                        cx={x}
                        cy={y}
                        r="6"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                        opacity="0.5"
                      />
                    </g>
                  );
                })}

                {/* X-axis labels */}
                <g>
                  {xTicks.map((logVal) => (
                    <text
                      key={`xl-${logVal}`}
                      x={xScale(logVal)}
                      y={CHART_HEIGHT - CHART_PADDING.bottom + 15}
                      textAnchor="middle"
                      className="text-[9px]"
                      style={{ fill: "hsl(var(--foreground))" }}
                    >
                      {formatLogLabel(logVal)}
                    </text>
                  ))}
                </g>

                {/* Y-axis labels */}
                <g>
                  {yTicks.map((logVal) => (
                    <text
                      key={`yl-${logVal}`}
                      x={CHART_PADDING.left - 5}
                      y={yScale(logVal) + 3}
                      textAnchor="end"
                      className="text-[9px]"
                      style={{ fill: "hsl(var(--foreground))" }}
                    >
                      {formatLogLabel(logVal)}
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
                  Value Change
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

                {/* Selection rectangle */}
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
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {keyPoints.map((point, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center rounded bg-background/60 px-2 py-1.5 dark:bg-background/30"
                >
                  <span className="text-[11px] text-foreground/70">
                    {point.priceChange >= 0 ? "+" : ""}
                    <DisplayFormattedNumber
                      num={point.priceChange}
                      significant={3}
                    />
                    %
                  </span>
                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className={`font-semibold ${
                        point.gainCollateral >= 0 ? "text-accent" : "text-red"
                      }`}
                    >
                      {point.gainCollateral >= 0 ? "+" : ""}
                      <DisplayFormattedNumber
                        num={point.gainCollateral}
                        significant={3}
                      />
                      %
                    </span>
                    <span
                      className={`font-semibold ${
                        point.gainDebt >= 0 ? "text-accent" : "text-red"
                      }`}
                    >
                      {point.gainDebt >= 0 ? "+" : ""}
                      <DisplayFormattedNumber
                        num={point.gainDebt}
                        significant={3}
                      />
                      %
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
