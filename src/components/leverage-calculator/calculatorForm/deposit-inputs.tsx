"use client";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { inputPatternMatch } from "@/lib/utils";
import Show from "@/components/shared/show";
import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import type { TCalculatorFormFields } from "@/components/providers/calculatorFormProvider";
import { useVaultPrices } from "@/components/leverage-calculator/calculatorForm/hooks/useVaultPrices";
import { api } from "@/trpc/react";

function Root({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <FormLabel htmlFor="deposit">Deposit</FormLabel>
      <div className="pt-1"></div>
      {children}
    </div>
  );
}

interface Props {
  decimals: number;
  disabled: boolean;
  inputLoading: boolean;
  children: ReactNode;
}
function Inputs({ decimals, disabled, inputLoading, children }: Props) {
  const form = useFormContext<TCalculatorFormFields>();
  const formData = form.watch();

  return (
    <div
      data-state={disabled ? "disabled" : "active"}
      className="flex justify-between rounded-md bg-primary/5 p-4 data-[state=disabled]:opacity-60 dark:bg-primary"
    >
      <div>
        <Show
          when={!inputLoading}
          fallback={
            <div className="flex h-[40px] items-center">
              <div className="h-[24px] w-12 animate-pulse rounded-sm bg-foreground/30"></div>
            </div>
          }
        >
          <FormField
            control={form.control}
            name="deposit"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    disabled={disabled}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    pattern="^[0-9]*[.,]?[0-9]*$"
                    background="primary"
                    placeholder="0"
                    minLength={1}
                    textSize="xl"
                    step="any"
                    {...field}
                    onChange={(e) => {
                      if (inputPatternMatch(e.target.value, decimals)) {
                        return field.onChange(e.target.value);
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </Show>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div
          className={`flex h-[40px] w-[130px] items-center justify-center gap-x-2 rounded-md bg-tertiary ${!formData.depositToken ? "opacity-70" : ""}`}
        >
          {/* {!depositAsset && <div className="h-[25px] w-[25px]" />} */}
          {/* <AssetInfo depositAsset={depositAsset} useEth={useEth} /> */}
          {children}
        </div>
      </div>
    </div>
  );
}

const DepositInputs = {
  Root,
  Inputs,
};
export default DepositInputs;
