"use client";

import { useMemo } from "react";
import {
  calculateSaturationPrice,
  getLeverageRatio,
} from "@/lib/utils/calculations";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import ToolTip from "@/components/ui/tooltip";

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
  baseFee: number
): number {
  if (saturationPrice <= 0 || entryPrice <= 0) return 1;

  const g0 = entryPrice / saturationPrice;
  const g1 = exitPrice / saturationPrice;

  const feeMultiplier = 1 + (leverageRatio - 1) * baseFee;
  const feeFactor = feeMultiplier * feeMultiplier; // squared for mint + burn

  const gain = f(g1, leverageRatio) / f(g0, leverageRatio) / feeFactor;

  return gain;
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
const CHART_HEIGHT = 250;
const CHART_PADDING = { top: 18, right: 18, bottom: 32, left: 42 };
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

  // Calculate adjusted reserves after user's deposit
  // Upon minting: deposit is reduced by 1/(1+(l-1)*fBase)
  // Fee = deposit - depositAfterFee
  // Fee portion (510-tax)/510 goes to tea reserve
  // Deposit after fee goes to ape reserve
  const adjustedReserves = useMemo(() => {
    if (!depositAmount || depositAmount <= 0 || !Number.isFinite(depositAmount)) {
      return { apeReserve, teaReserve };
    }

    const feeMultiplier = 1 + (leverageRatio - 1) * baseFee;
    if (feeMultiplier <= 0) {
      return { apeReserve, teaReserve };
    }

    const depositAfterFee = depositAmount / feeMultiplier;
    const feeAmount = depositAmount - depositAfterFee;

    // Fee portion that goes to LP (tea) reserve
    const feeToLp = feeAmount * (510 - tax) / 510;

    // Convert to bigint with proper decimals - ensure valid values
    const depositAfterFeeBigInt = BigInt(Math.floor(Math.max(0, depositAfterFee) * Math.pow(10, collateralDecimals)));
    const feeToLpBigInt = BigInt(Math.floor(Math.max(0, feeToLp) * Math.pow(10, collateralDecimals)));

    return {
      apeReserve: apeReserve + depositAfterFeeBigInt,
      teaReserve: teaReserve + feeToLpBigInt,
    };
  }, [apeReserve, teaReserve, depositAmount, leverageRatio, baseFee, tax, collateralDecimals]);

  // Calculate saturation price and the price change % at which saturation occurs
  const saturationData = useMemo(() => {
    if (!currentPrice || currentPrice === 0 || adjustedReserves.apeReserve === 0n) {
      return { saturationPrice: 0, saturationPriceChange: Infinity };
    }

    const satPrice = calculateSaturationPrice(
      currentPrice,
      adjustedReserves.apeReserve,
      adjustedReserves.teaReserve,
      leverageRatio
    );

    const satPriceChange = ((satPrice - currentPrice) / currentPrice) * 100;

    return {
      saturationPrice: satPrice,
      saturationPriceChange: satPriceChange,
    };
  }, [currentPrice, adjustedReserves.apeReserve, adjustedReserves.teaReserve, leverageRatio]);

  // Generate chart points using the correct gain formula:
  // G = f(g1) / f(g0) / [1 + (l-1)*fBase]^2
  const chartData = useMemo(() => {
    const points: ChartPoint[] = [];
    const entryPrice = currentPrice;
    const satPrice = saturationData.saturationPrice;

    if (satPrice <= 0) return points;

    // Generate points from -100% to +300% price change
    const minChange = -100;
    const maxChange = 300;
    const step = 5;

    for (let priceChange = minChange; priceChange <= maxChange; priceChange += step) {
      const exitPrice = entryPrice * (1 + priceChange / 100);

      if (exitPrice <= 0) continue;

      // Calculate gain using the correct formula
      const gain = calculateApeGain(
        entryPrice,
        exitPrice,
        satPrice,
        leverageRatio,
        baseFee
      );

      // Convert to percentage (0% = break-even, where gain = 1)
      const gainPercent = (gain - 1) * 100;

      points.push({
        priceChange,
        gain: gainPercent,
      });
    }

    return points;
  }, [currentPrice, leverageRatio, baseFee, saturationData.saturationPrice]);

  // Key points to highlight (-50%, +100%, +250%)
  const keyPoints = useMemo(() => {
    const entryPrice = currentPrice;
    const satPrice = saturationData.saturationPrice;

    if (satPrice <= 0) return [];

    return [-50, 100, 250].map((priceChange) => {
      const exitPrice = entryPrice * (1 + priceChange / 100);

      const gain = calculateApeGain(
        entryPrice,
        exitPrice,
        satPrice,
        leverageRatio,
        baseFee
      );

      const gainPercent = (gain - 1) * 100;

      return {
        priceChange,
        gain: gainPercent,
      };
    });
  }, [currentPrice, leverageRatio, baseFee, saturationData.saturationPrice]);

  // Calculate scales and Y-axis ticks
  const { xScale, yScale, yMin, yMax, yTicks } = useMemo(() => {
    const xMin = -100;
    const xMax = 300;

    // Y-axis: fixed minimum at -100%, maximum from largest key point (rounded up to nice tick)
    const keyPointGains = keyPoints.map((p) => p.gain);
    const yMin = -100;
    const rawYMax = Math.max(...keyPointGains, 100);

    // Calculate step based on range to get nice round tick values
    const rawRange = rawYMax - yMin;
    let step = 100;
    if (rawRange > 2000) step = 500;
    else if (rawRange > 1000) step = 250;
    else if (rawRange > 500) step = 100;
    else if (rawRange > 200) step = 50;
    else step = 25;

    // Round yMax up to the next tick value so highest tick equals yMax
    const yMax = Math.ceil(rawYMax / step) * step;

    const xScale = (val: number) =>
      CHART_PADDING.left + ((val - xMin) / (xMax - xMin)) * INNER_WIDTH;
    const yScale = (val: number) =>
      CHART_PADDING.top + INNER_HEIGHT - ((val - yMin) / (yMax - yMin)) * INNER_HEIGHT;

    // Generate Y-axis ticks (used for both grid lines and labels)

    const ticks: number[] = [];
    const start = Math.ceil(yMin / step) * step;
    for (let val = start; val <= yMax; val += step) {
      ticks.push(val);
    }
    // Ensure 0 is included if in range
    if (yMin <= 0 && yMax >= 0 && !ticks.includes(0)) {
      ticks.push(0);
      ticks.sort((a, b) => a - b);
    }
    // Limit to ~5 ticks max
    const maxTicks = 5;
    const skipFactor = Math.ceil(ticks.length / maxTicks);
    const yTicks = ticks.filter((_, i) => i % skipFactor === 0 || ticks[i] === 0);

    return { xScale, yScale, yMin, yMax, yTicks };
  }, [keyPoints]);

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
    // Clipped to visible Y range
    const xMin = -100;
    const xMax = 300;

    // The line goes from (xMin, xMin) to (xMax, xMax) but clipped to yMin/yMax
    const startX = Math.max(xMin, yMin);
    const endX = Math.min(xMax, yMax);

    if (startX >= endX) return "";

    return `M ${xScale(startX)} ${yScale(startX)} L ${xScale(endX)} ${yScale(endX)}`;
  }, [xScale, yScale, yMin, yMax]);

  // Generate regular leverage line - gain = l * priceChange (linear, with liquidation risk)
  const regularLeveragePath = useMemo(() => {
    // Regular leverage: gain% = leverageRatio * priceChange%
    // Formula: l*(x-1)+1 where x = exitPrice/entryPrice, so gain% = l * priceChange%
    const xMin = -100;
    const xMax = 300;

    // Find where the line intersects yMin and yMax
    // y = l * x, so x = y / l
    const xAtYMin = yMin / leverageRatio;
    const xAtYMax = yMax / leverageRatio;

    const startX = Math.max(xMin, xAtYMin);
    const endX = Math.min(xMax, xAtYMax);

    if (startX >= endX) return "";

    const startY = leverageRatio * startX;
    const endY = leverageRatio * endX;

    return `M ${xScale(startX)} ${yScale(startY)} L ${xScale(endX)} ${yScale(endY)}`;
  }, [xScale, yScale, yMin, yMax, leverageRatio]);

  // Don't render if we don't have valid data
  if (!currentPrice || currentPrice === 0 || chartData.length === 0) {
    return null;
  }

  const zeroY = yScale(0);
  // Show saturation line if it falls within the visible x-axis range (-100% to 300%)
  const saturationX = saturationData.saturationPriceChange > -100 && saturationData.saturationPriceChange < 300
    ? xScale(saturationData.saturationPriceChange)
    : null;

  return (
    <div className="mt-4 rounded-md bg-primary/5 p-4 dark:bg-primary">
      <div className="mb-3 flex items-center gap-2">
        <h4 className="text-sm font-medium text-foreground">
          Potential Returns
        </h4>
        <ToolTip size="300">
          This chart shows your potential profit/loss in {debtSymbol} terms as the{" "}
          {collateralSymbol}/{debtSymbol} price changes. In the &quot;power zone&quot;
          (before saturation), gains follow (price)^leverage. Past the saturation
          threshold, gains become more linear.
        </ToolTip>
      </div>

      {/* Chart area with lighter background for readability */}
      <div className="rounded bg-background/80 dark:bg-background/40 p-2">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
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
            {/* Vertical grid lines - extend from min to max yTick */}
            {[-50, 0, 50, 100, 150, 200, 250, 300].map((val) => (
              <line
                key={`v-${val}`}
                x1={xScale(val)}
                y1={yScale(yTicks[yTicks.length - 1] ?? yMax)}
                x2={xScale(val)}
                y2={yScale(yTicks[0] ?? yMin)}
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
            style={{ stroke: "hsla(var(--foreground), 0.3)" }}
            strokeWidth="1"
          />

          {/* Y-axis at 0% price change (entry point) */}
          <line
            x1={xScale(0)}
            y1={yScale(yTicks[yTicks.length - 1] ?? yMax)}
            x2={xScale(0)}
            y2={yScale(yTicks[0] ?? yMin)}
            style={{ stroke: "hsla(var(--foreground), 0.3)" }}
            strokeWidth="1"
          />

        {/* Saturation threshold line */}
        {saturationX && saturationX > CHART_PADDING.left && saturationX < CHART_WIDTH - CHART_PADDING.right && (
          <g>
            <line
              x1={saturationX}
              y1={yScale(yTicks[yTicks.length - 1] ?? yMax)}
              x2={saturationX}
              y2={yScale(yTicks[0] ?? yMin)}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4,3"
              className="text-amber-500"
            />
            <text
              x={saturationX}
              y={yScale(yTicks[yTicks.length - 1] ?? yMax) - 8}
              textAnchor="middle"
              className="fill-amber-500 text-[8px]"
            >
              Saturation
            </text>
          </g>
        )}

        {/* Spot (1x) holding reference line */}
        {spotLinePath && (
          <path
            d={spotLinePath}
            fill="none"
            stroke="#a78bfa"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )}

        {/* Regular leverage reference line */}
        {regularLeveragePath && (
          <path
            d={regularLeveragePath}
            fill="none"
            stroke="#fb923c"
            strokeWidth="1.5"
            strokeLinecap="round"
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
            {[-100, -50, 0, 50, 100, 150, 200, 250, 300].map((val) => (
              <text
                key={`xl-${val}`}
                x={xScale(val)}
                y={CHART_HEIGHT - CHART_PADDING.bottom + 15}
                textAnchor="middle"
                className="text-[9px]"
                style={{ fill: "hsla(var(--foreground), 0.7)" }}
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
                style={{ fill: "hsla(var(--foreground), 0.7)" }}
              >
                {val === 0 ? "0" : val > 0 ? `+${val}%` : `${val}%`}
              </text>
            ))}
          </g>

          {/* Axis titles */}
          <text
            x={CHART_WIDTH / 2}
            y={CHART_HEIGHT - 3}
            textAnchor="middle"
            className="text-[9px]"
            style={{ fill: "hsla(var(--foreground), 0.6)" }}
          >
            {collateralSymbol}/{debtSymbol} Price Change
          </text>
        </svg>
      </div>

      {/* Key points summary */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        {keyPoints.map((point, i) => (
          <div
            key={i}
            className="flex flex-col items-center rounded bg-background/60 dark:bg-background/30 px-2 py-1.5"
          >
            <span className="text-foreground/70 text-[11px]">{point.priceChange >= 0 ? "+" : ""}{point.priceChange}%</span>
            <span className={point.gain >= 0 ? "text-accent font-semibold" : "text-red font-semibold"}>
              {point.gain >= 0 ? "+" : ""}
              <DisplayFormattedNumber num={point.gain} />%
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-foreground">
        {/* APE leveraged line legend */}
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-0 w-4 border-t-2 border-solid border-accent"></span>
          <span className="font-medium">APE <span className="text-on-bg-subdued font-normal">(incl. fees)</span></span>
        </div>
        {/* Regular leverage line legend */}
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-0 w-4 border-t-[1.5px] border-solid" style={{ borderColor: "#fb923c" }}></span>
          <span>Perp {leverageRatio}x <span className="text-on-bg-subdued">(excl. fees)</span></span>
        </div>
        {/* Spot line legend */}
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-0 w-4 border-t-[1.5px] border-solid" style={{ borderColor: "#a78bfa" }}></span>
          <span>Spot</span>
        </div>
      </div>
      {/* Saturation info */}
      {saturationData.saturationPriceChange < 300 && saturationData.saturationPriceChange > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-on-bg-subdued">
          <span className="inline-block h-0 w-4 border-t-[1.5px] border-dashed border-amber-500"></span>
          <span>
            Power zone up to{" "}
            <span className="text-amber-500 font-medium">
              +<DisplayFormattedNumber num={saturationData.saturationPriceChange} />%
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
