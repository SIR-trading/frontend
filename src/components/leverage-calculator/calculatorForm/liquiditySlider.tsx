"use client";
import React, { useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";

interface LiquiditySliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

// Slider positions:
// 0: 0 liquidity (empty vault)
// 25: 0.1x 
// 50: 1x (current liquidity)
// 75: 10x
// 100: 100x (max, not infinite to avoid issues)

function sliderToMultiplier(sliderValue: number): number {
  if (sliderValue === 0) return 0; // Empty vault
  if (sliderValue === 50) return 1; // Current liquidity
  if (sliderValue === 25) return 0.1; // 0.1x at 25%
  if (sliderValue === 75) return 10; // 10x at 75%
  if (sliderValue === 100) return 100; // 100x max (not infinite)
  
  if (sliderValue < 25) {
    // 0 to 25: interpolate from 0 to 0.1 (linear for simplicity near 0)
    if (sliderValue < 5) return 0; // Keep very low values as 0
    return 0.1 * (sliderValue - 5) / 20;
  } else if (sliderValue < 50) {
    // 25 to 50: interpolate from 0.1 to 1 (log scale)
    const t = (sliderValue - 25) / 25;
    const logStart = Math.log10(0.1);
    const logEnd = Math.log10(1);
    const logValue = logStart + t * (logEnd - logStart);
    return Math.pow(10, logValue);
  } else if (sliderValue < 75) {
    // 50 to 75: interpolate from 1 to 10 (log scale)
    const t = (sliderValue - 50) / 25;
    const logStart = Math.log10(1);
    const logEnd = Math.log10(10);
    const logValue = logStart + t * (logEnd - logStart);
    return Math.pow(10, logValue);
  } else {
    // 75 to 100: interpolate from 10 to 100 (log scale)
    const t = (sliderValue - 75) / 25;
    const logStart = Math.log10(10);
    const logEnd = Math.log10(100);
    const logValue = logStart + t * (logEnd - logStart);
    return Math.pow(10, logValue);
  }
}

function multiplierToSlider(multiplier: number): number {
  if (multiplier === 0) return 0;
  if (Math.abs(multiplier - 1) < 0.001) return 50;
  if (Math.abs(multiplier - 0.1) < 0.001) return 25;
  if (Math.abs(multiplier - 10) < 0.01) return 75;
  if (multiplier >= 100) return 100;
  
  if (multiplier < 0.1) {
    // Map 0 to 0.1 to slider 0-25
    if (multiplier < 0.005) return 0;
    return 5 + (multiplier / 0.1) * 20;
  } else if (multiplier < 1) {
    // Map 0.1 to 1 to slider 25-50 (log scale)
    const logValue = Math.log10(multiplier);
    const logStart = Math.log10(0.1);
    const logEnd = Math.log10(1);
    const t = (logValue - logStart) / (logEnd - logStart);
    return 25 + t * 25;
  } else if (multiplier < 10) {
    // Map 1 to 10 to slider 50-75 (log scale)
    const logValue = Math.log10(multiplier);
    const logStart = Math.log10(1);
    const logEnd = Math.log10(10);
    const t = (logValue - logStart) / (logEnd - logStart);
    return 50 + t * 25;
  } else {
    // Map 10 to 100 to slider 75-100 (log scale)
    const logValue = Math.log10(multiplier);
    const logStart = Math.log10(10);
    const logEnd = Math.log10(100);
    const t = (logValue - logStart) / (logEnd - logStart);
    return 75 + t * 25;
  }
}

export default function LiquiditySlider({ value, onChange, disabled = false }: LiquiditySliderProps) {
  const sliderValue = useMemo(() => multiplierToSlider(value), [value]);
  
  const handleChange = (values: number[]) => {
    const newSliderValue = values[0];
    if (newSliderValue !== undefined) {
      const newMultiplier = sliderToMultiplier(newSliderValue);
      onChange(newMultiplier);
    }
  };

  const getLabel = () => {
    if (value === 0) return "Empty (0x)";
    if (Math.abs(value - 1) < 0.001) return "Current (1x)";
    
    return (
      <>
        <DisplayFormattedNumber num={value} />x
      </>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm text-foreground/80">
          Simulate LP liquidity
        </label>
        <span className="text-sm font-medium">
          {getLabel()}
        </span>
      </div>
      <div className="relative">
        <Slider
          value={[sliderValue]}
          onValueChange={handleChange}
          max={100}
          step={1}
          className="w-full"
          disabled={disabled}
        />
        <div className="flex justify-between text-xs text-foreground/60 mt-1">
          <span>0x</span>
          <span>0.1x</span>
          <span className="font-medium">1x</span>
          <span>10x</span>
          <span>100x</span>
        </div>
      </div>
    </div>
  );
}