"use client";
import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { inputPatternMatch } from "@/lib/utils/index";
import { useFormContext } from "react-hook-form";
import type { TCalculatorFormFields } from "@/components/providers/calculatorFormProvider";
import ToolTip from "@/components/ui/tooltip";
import { formatPriceForInput } from "./calculatorForm";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";

// You might need to import or define decimals if not available in this file
const decimals = 18;

function Root({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mt-4 flex w-full flex-col gap-4 space-y-4 lg:flex-row lg:items-baseline lg:justify-between">
      {children}
    </div>
  );
}

interface Props {
  disabled: boolean;
}

function EntryPrice({ disabled }: Props) {
  const form = useFormContext<TCalculatorFormFields>();

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <FormLabel htmlFor="entryPrice">Entry price</FormLabel>
      </div>
      <div
        data-state={disabled ? "disabled" : "active"}
        className="flex flex-col gap-4 rounded-md bg-primary/5 p-4 data-[state=disabled]:opacity-60 dark:bg-primary"
      >
        {/* Entry Price Input */}
        <FormField
          control={form.control}
          name="entryPrice"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  id="entryPrice"
                  disabled={disabled}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  pattern="^[0-9]*[.,]?[0-9]*$"
                  background="primary"
                  placeholder="0"
                  minLength={1}
                  textSize="md"
                  step="any"
                  {...field}
                  onChange={(e) => {
                    if (inputPatternMatch(e.target.value, decimals)) {
                      // Normalize commas to dots for European locale keyboards
                      const normalizedValue = e.target.value.replace(',', '.');
                      field.onChange(normalizedValue);
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function ExitPrice({ disabled }: Props) {
  const form = useFormContext<TCalculatorFormFields>();
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <FormLabel htmlFor="exitPrice">Exit price</FormLabel>
      </div>
      <div
        data-state={disabled ? "disabled" : "active"}
        className="flex flex-col gap-4 rounded-md bg-primary/5 p-4 data-[state=disabled]:opacity-60 dark:bg-primary"
      >
        {/* Exit Price Input */}
        <FormField
          control={form.control}
          name="exitPrice"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  id="exitPrice"
                  disabled={disabled}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  pattern="^[0-9]*[.,]?[0-9]*$"
                  background="primary"
                  placeholder="0"
                  minLength={1}
                  textSize="md"
                  step="any"
                  {...field}
                  onChange={(e) => {
                    if (inputPatternMatch(e.target.value, decimals)) {
                      // Normalize commas to dots for European locale keyboards
                      const normalizedValue = e.target.value.replace(',', '.');
                      field.onChange(normalizedValue);
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

interface SaturationPriceProps {
  disabled: boolean;
  saturationPrice?: number;
  inPowerZone?: boolean;
  isInverted?: boolean;
}

function SaturationPrice({ disabled, saturationPrice, inPowerZone, isInverted }: SaturationPriceProps) {
  const displayValue = saturationPrice && saturationPrice > 0 
    ? saturationPrice >= 1e10 
      ? "∞"  // Display as infinity for very large values
      : formatPriceForInput(saturationPrice) 
    : "";
  
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <FormLabel htmlFor="saturationPrice">Saturation price</FormLabel>
        <ToolTip size="300">
          <div>
            <p className="mb-2 font-semibold">Saturation Price Explained</p>
            <p className="mb-2">
              The saturation price is the threshold where the vault transitions between power and saturation zones.
            </p>
            {saturationPrice === 0 || (saturationPrice !== undefined && saturationPrice >= 1e10) ? (
              <React.Fragment>
                <p className="mb-2">
                  <strong>This vault has no liquidity: </strong>All new positions will be effectively 1x leverage, i.e., like holding spot.
                </p>
              </React.Fragment>
            ) : saturationPrice ? (
              <React.Fragment>
                <p className="mb-2">
                  <strong>Power Zone {isInverted ? "(price > " : "(price < "}{saturationPrice >= 1e10 ? "∞" : <><DisplayFormattedNumber num={saturationPrice} /></>}):</strong> Gains follow the constant leverage formula (price ratio)<sup>leverage</sup>.
                </p>
                <p>
                  <strong>Saturation Zone {isInverted ? "(price < " : "(price > "}{saturationPrice >= 1e10 ? "∞" : <><DisplayFormattedNumber num={saturationPrice} /></>}):</strong> Gains are limited by available liquidity and follow the formula (real leverage) × (price ratio).
                </p>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <p className="mb-2">
                  <strong>Power Zone:</strong> Gains follow the constant leverage formula (price ratio)<sup>leverage</sup>.
                </p>
                <p>
                  <strong>Saturation Zone:</strong> Gains are limited by available liquidity and follow the formula (real leverage) × (price ratio).
                </p>
              </React.Fragment>
            )}
            {inPowerZone !== undefined && saturationPrice !== undefined && saturationPrice !== null && (
              <>
                {saturationPrice === 0 || (saturationPrice !== undefined && saturationPrice >= 1e10) ? (
                  <p className="mt-2" style={{ color: '#fb923c' }}>
                    Current: Empty Vault (1x leverage) ⚠️
                  </p>
                ) : inPowerZone ? (
                  <p className="mt-2 text-accent">
                    Current: Power Zone ✓
                  </p>
                ) : (
                  <p className="mt-2" style={{ color: '#eab308' }}>
                    Current: Saturation Zone ⚠️
                  </p>
                )}
              </>
            )}
          </div>
        </ToolTip>
      </div>
      <div
        data-state={disabled ? "disabled" : "active"}
        className="flex flex-col gap-4 rounded-md bg-primary/5 p-4 data-[state=disabled]:opacity-60 dark:bg-primary"
      >
        {/* Saturation Price Input - matching Entry/Exit structure */}
        <FormItem>
          <FormControl>
            <Input
              id="saturationPrice"
              disabled={true}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              pattern="^[0-9]*[.,]?[0-9]*$"
              background="primary"
              placeholder="0"
              minLength={1}
              textSize="md"
              step="any"
              value={displayValue}
              readOnly
            />
          </FormControl>
        </FormItem>
      </div>
    </div>
  );
}

const PriceInputs = {
  Root,
  EntryPrice,
  ExitPrice,
  SaturationPrice,
};

export default PriceInputs;
