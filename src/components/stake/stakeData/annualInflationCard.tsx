"use client";
import React, { useMemo, useState, useRef } from "react";
import Show from "@/components/shared/show";
import buildData from "@/../public/build-data.json";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { getSirSymbol } from "@/lib/assets";
import ToolTip from "@/components/ui/tooltip";
import { useStaking } from "@/contexts/StakingContext";
import { useSirPrice } from "@/contexts/SirPriceContext";
import { formatUnits } from "viem";
import { motion, AnimatePresence } from "motion/react";
import { X, Move } from "lucide-react";

export default function AnnualInflationCard() {
  const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
  const { totalSupply, totalSupplyLoading } = useStaking();
  const {
    sirPrice,
    isLoading: priceLoading,
    error: priceError,
  } = useSirPrice();
  const [chartOpen, setChartOpen] = useState(false);
  const constraintsRef = useRef(null);

  const { annualInflationRate, impliedMarketCapInOneYear } = useMemo(() => {
    const timestampIssuanceStart = buildData.timestampIssuanceStart;
    const currentUnixTime = Math.floor(Date.now() / 1000);

    // Time elapsed since issuance started (in seconds)
    const timeElapsed = currentUnixTime - timestampIssuanceStart;

    if (timeElapsed <= 0) {
      return { annualInflationRate: null, impliedMarketCapInOneYear: null };
    }

    // Annual inflation rate = (SECONDS_PER_YEAR / timeElapsed) * 100
    const inflationRate = (SECONDS_PER_YEAR / timeElapsed) * 100;

    // Calculate implied market cap in 1 year
    let impliedMarketCap = null;
    if (totalSupply && sirPrice) {
      const currentSupplyNumber = parseFloat(formatUnits(totalSupply, 12)); // SIR has 12 decimals
      const timeElapsedInOneYear = timeElapsed + SECONDS_PER_YEAR;

      // Future supply = current supply * (future time elapsed / current time elapsed)
      const futureSupply =
        currentSupplyNumber * (timeElapsedInOneYear / timeElapsed);

      // Implied market cap = future supply * SIR price
      impliedMarketCap = futureSupply * sirPrice;
    }

    return {
      annualInflationRate: inflationRate,
      impliedMarketCapInOneYear: impliedMarketCap,
    };
  }, [SECONDS_PER_YEAR, totalSupply, sirPrice]);

  const isLoading = totalSupplyLoading || priceLoading;
  const isUnavailable =
    priceError ||
    (!priceLoading && (sirPrice === null || sirPrice === undefined));

  // Calculate inflation data points for the chart (current to 5 years)
  const chartData = useMemo(() => {
    const timestampIssuanceStart = buildData.timestampIssuanceStart;
    const currentUnixTime = Math.floor(Date.now() / 1000);
    const timeElapsed = currentUnixTime - timestampIssuanceStart;

    if (timeElapsed <= 0) return [];

    const dataPoints = [];
    const numPoints = 50; // Number of points for smooth curve

    for (let i = 0; i <= numPoints; i++) {
      const yearsFromNow = (i / numPoints) * 5; // 0 to 5 years
      const futureTimeElapsed = timeElapsed + yearsFromNow * SECONDS_PER_YEAR;
      const inflationRate = (SECONDS_PER_YEAR / futureTimeElapsed) * 100;

      dataPoints.push({
        years: yearsFromNow,
        inflation: inflationRate,
      });
    }

    return dataPoints;
  }, [SECONDS_PER_YEAR]);

  // Simple SVG line chart component
  const InflationChart = () => {
    if (chartData.length === 0) return null;

    const width = 600;
    const height = 300;
    const padding = { top: 30, right: 30, bottom: 60, left: 70 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxInflation = Math.max(...chartData.map((d) => d.inflation));
    const minInflation = Math.min(...chartData.map((d) => d.inflation));

    // Use logarithmic scale for y-axis
    const logMin = Math.log10(minInflation);
    const logMax = Math.log10(maxInflation);

    // Helper function to convert inflation value to y-coordinate (log scale)
    const getYCoord = (inflationValue: number) => {
      const logValue = Math.log10(inflationValue);
      return padding.top + chartHeight - ((logValue - logMin) / (logMax - logMin)) * chartHeight;
    };

    // Create path for the line using log scale
    const points = chartData.map((d, i) => {
      const x = padding.left + (i / (chartData.length - 1)) * chartWidth;
      const y = getYCoord(d.inflation);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    });

    const pathData = points.join(" ");

    // Create gradient for the line
    const gradientId = "inflationGradient";

    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="select-none"
      >
        {/* Define gradient */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(265, 63%, 72%)" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(265, 63%, 72%)" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="white"
        />

        {/* Grid lines - horizontal only (log scale) */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const logValue = logMin + pct * (logMax - logMin);
          const inflationValue = Math.pow(10, logValue);
          const y = getYCoord(inflationValue);
          return (
            <line
              key={`h-${pct}`}
              x1={padding.left}
              y1={y}
              x2={padding.left + chartWidth}
              y2={y}
              stroke="#eaf0f6"
              strokeWidth={1}
              shapeRendering="crispEdges"
            />
          );
        })}

        {/* Axis boundary lines */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
          stroke="#000000"
          strokeWidth={1}
          shapeRendering="crispEdges"
        />
        <line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + chartHeight}
          stroke="#000000"
          strokeWidth={1}
          shapeRendering="crispEdges"
        />

        {/* Line chart with gradient */}
        <path
          d={pathData}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {chartData.map((d, i) => {
          const x = padding.left + (i / (chartData.length - 1)) * chartWidth;
          const y = getYCoord(d.inflation);
          return (
            <circle
              key={`point-${i}`}
              cx={x}
              cy={y}
              r={3}
              fill="hsl(265, 63%, 72%)"
              opacity={0.8}
            />
          );
        })}

        {/* X-axis labels */}
        {[0, 1, 2, 3, 4, 5].map((year) => (
          <text
            key={`x-label-${year}`}
            x={padding.left + (year / 5) * chartWidth}
            y={padding.top + chartHeight + 25}
            textAnchor="middle"
            fill="#64748b"
            className="text-xs font-medium"
          >
            {year === 0 ? "Now" : `${year}Y`}
          </text>
        ))}

        {/* Y-axis labels (log scale) */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const logValue = logMin + pct * (logMax - logMin);
          const inflationValue = Math.pow(10, logValue);
          const y = getYCoord(inflationValue);
          // Format to 2 significant digits for SVG text
          let formattedValue: string;
          if (inflationValue >= 10) {
            formattedValue = inflationValue.toFixed(0);
          } else if (inflationValue >= 1) {
            formattedValue = inflationValue.toFixed(1);
          } else {
            formattedValue = inflationValue.toPrecision(2);
          }
          return (
            <text
              key={`y-label-${pct}`}
              x={padding.left - 15}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fill="#64748b"
              className="text-xs font-medium"
            >
              {formattedValue}%
            </text>
          );
        })}

        {/* Axis labels */}
        <text
          x={width / 2}
          y={height - 8}
          textAnchor="middle"
          fill="#334155"
          className="text-sm font-semibold"
        >
          Time Horizon
        </text>
        <text
          x={-height / 2}
          y={18}
          textAnchor="middle"
          transform={`rotate(-90, 18, ${height / 2})`}
          fill="#334155"
          className="text-sm font-semibold"
        >
          Inflation Rate
        </text>
      </svg>
    );
  };

  return (
    <div className="rounded-md bg-primary/5 p-3 text-center dark:bg-primary">
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
        Annual Inflation
        <ToolTip iconSize={14} size="300">
          A fixed 2015M {getSirSymbol()} are issued annually. The inflation
          rate (as a percentage) decreases over time as the total supply
          increases.
        </ToolTip>
      </div>
      <Show
        when={!isLoading}
        fallback={
          <>
            <div className="mx-auto mt-1 h-7 w-16 animate-pulse rounded bg-foreground/10"></div>
            <div className="mx-auto mt-1 h-4 w-32 animate-pulse rounded bg-foreground/10"></div>
          </>
        }
      >
        {isUnavailable || annualInflationRate === null ? (
          <div className="mt-1 text-sm italic text-muted-foreground">
            Not available
          </div>
        ) : (
          <>
            <div className="mt-1 flex items-center justify-center gap-2 text-lg font-semibold">
              <span>
                <DisplayFormattedNumber
                  num={annualInflationRate}
                  significant={3}
                />
                %
              </span>
              <button
                className="h-6 w-6 p-0 flex items-center justify-center rounded hover:bg-foreground/10 transition-colors text-sm"
                title="View inflation chart"
                onClick={() => setChartOpen(true)}
              >
                📊
              </button>
            </div>
            <div className="text-xs text-muted-foreground">
              {impliedMarketCapInOneYear !== null ? (
                <>
                  Implied MC in 1 year: $
                  <DisplayFormattedNumber
                    num={impliedMarketCapInOneYear}
                    significant={3}
                  />
                </>
              ) : (
                "—"
              )}
            </div>
          </>
        )}
      </Show>

      {/* Draggable Chart Popup */}
      {chartOpen && (
        <>
          {/* Invisible constraints container for drag bounds */}
          <div
            ref={constraintsRef}
            className="fixed inset-0 pointer-events-none z-40"
          />

          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setChartOpen(false)}
          />

          {/* Draggable popup */}
          <AnimatePresence>
            <motion.div
              drag
              dragConstraints={constraintsRef}
              dragElastic={0.1}
              dragMomentum={false}
              initial={{
                opacity: 0,
                scale: 0.95,
                x: "-50%",
                y: "-50%"
              }}
              animate={{
                opacity: 1,
                scale: 1,
                x: "-50%",
                y: "-50%"
              }}
              exit={{
                opacity: 0,
                scale: 0.95
              }}
              transition={{ duration: 0.2 }}
              className="fixed z-50 w-[90vw] max-w-[700px] rounded-lg border border-foreground/20 bg-background shadow-2xl overflow-hidden"
              style={{
                top: '50%',
                left: '50%',
              }}
            >
              {/* Drag handle bar */}
              <div className="flex items-center justify-between bg-foreground/5 px-3 py-2 cursor-move">
                <div className="flex items-center gap-2 text-foreground/60">
                  <Move className="h-4 w-4" />
                  <span className="text-xs">Annual Inflation Projection</span>
                </div>
                <button
                  onClick={() => setChartOpen(false)}
                  className="text-foreground/60 hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Chart content */}
              <div className="p-6 bg-white">
                <div className="w-full h-[350px]">
                  <InflationChart />
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Projected annual inflation rate based on constant {getSirSymbol()}{" "}
                  issuance over the next 5 years
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
