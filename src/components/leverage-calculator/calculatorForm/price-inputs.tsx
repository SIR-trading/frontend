"use client";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { inputPatternMatch } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import type { TCalculatorFormFields } from "@/components/providers/calculatorFormProvider";
import { api } from "@/trpc/react";
import { useEffect } from "react";

// You might need to import or define decimals if not available in this file
const decimals = 18;

function Root({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mt-4 flex w-full flex-col gap-4 space-y-4 md:flex-row md:items-baseline md:justify-between">
      {children}
    </div>
  );
}

interface Props {
  disabled: boolean;
}



function EntryPrice({ disabled }: Props) {
  const form = useFormContext<TCalculatorFormFields>();
    const { setValue, control } = form;

    const formData = form.watch();
    const depositTicker =
        formData.long?.trim()
            ? formData.long.split(",")[1] ?? "ETH"
            : "ETH";
    const collateralTicker =
        formData.versus?.trim()
            ? formData.versus.split(",")[1] ?? "USDC"
            : "USDC";

    const { data: prices } = api.price.getVaultPrices.useQuery(
        { depositToken: depositTicker, collateralToken: collateralTicker },
        {
            enabled:
                Boolean(formData.depositToken?.trim()) &&
                Boolean(formData.versus?.trim()),
        }
    );

    console.log("Prices:", prices)

    return (
    <div className="space-y-2">
      <div>
        <FormLabel htmlFor="entryPrice">Entry price</FormLabel>
      </div>
      <div
        data-state={disabled ? "disabled" : "active"}
        className="flex flex-col gap-4 rounded-md bg-primary p-3 data-[state=disabled]:opacity-60"
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
                      field.onChange(e.target.value);
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
  const formData = form.watch();
  return (
    <div className="space-y-2">
      <div>
        <FormLabel htmlFor="exitPrice">Exit price</FormLabel>
      </div>
      <div
        data-state={disabled ? "disabled" : "active"}
        className="flex flex-col gap-4 rounded-md bg-primary p-3 data-[state=disabled]:opacity-60"
      >
        {/* Entry Price Input */}
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
                      field.onChange(e.target.value);
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

const PriceInputs = {
  Root,
  EntryPrice,
  ExitPrice,
};

export default PriceInputs;
