"use client";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BalancePercent } from "@/components/shared/balancePercent";
import { inputPatternMatch } from "@/lib/utils/index";
import { Switch } from "@/components/ui/switch";
import { WRAPPED_NATIVE_TOKEN_ADDRESS } from "@/data/constants";
import Show from "@/components/shared/show";
import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import MintFormSettings from "./MintFormSettings";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { getNativeCurrencySymbol } from "@/lib/chains";
import { useTokenUsdPrice } from "./hooks/useTokenUsdPrice";

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
  balance?: string;
  useNativeToken: boolean;
  setUseNativeToken: (b: boolean) => void;
  decimals: number;
  disabled: boolean;
  inputLoading: boolean;
  children: ReactNode;
}
function Inputs({
  decimals,
  balance,
  useNativeToken,
  setUseNativeToken,
  disabled,
  inputLoading,
  children,
}: Props) {
  const form = useFormContext<TMintFormFields>();
  const formData = form.watch();

  // Get USD value for the deposit amount
  const { usdValue } = useTokenUsdPrice(
    formData.depositToken,
    formData.deposit,
    decimals
  );

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
        <div className="space-y-2">
          {usdValue !== null && usdValue > 0 && (
            <div className="text-xs text-muted-foreground pt-1">
              ≈ $<DisplayFormattedNumber num={usdValue.toString()} />
            </div>
          )}
          {formData.depositToken === WRAPPED_NATIVE_TOKEN_ADDRESS && (
            <div className="flex items-center gap-x-2 pt-1">
              <h3 className="text-[12px] text-foreground">Use {getNativeCurrencySymbol()}</h3>
              <Switch
                checked={useNativeToken}
                onCheckedChange={() => {
                  setUseNativeToken(!useNativeToken);
                }}
                aria-readonly
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div
          className={`flex h-[40px] w-[150px] items-center justify-center gap-x-2 rounded-md bg-tertiary ${!formData.depositToken ? "opacity-70" : ""}`}
        >
          {/* {!depositAsset && <div className="h-[25px] w-[25px]" />} */}
          {/* <AssetInfo depositAsset={depositAsset} useNativeToken={useNativeToken} /> */}
          {children}
        </div>
        <h2 className="font-geist-mono pt-1 text-right text-on-bg-subdued whitespace-nowrap">
          Balance: {balance !== undefined ? (
            <DisplayFormattedNumber num={balance} />
          ) : (
            <span className="inline-block w-12 h-4 animate-pulse bg-foreground/30 rounded"></span>
          )}
        </h2>
        <BalancePercent
          settings={<MintFormSettings />}
          disabled={disabled}
          balance={balance}
          setValue={(s: string) => {
            form.setValue("deposit", s);
          }}
        />
      </div>
    </div>
  );
}

const DepositInputs = {
  Root,
  Inputs,
};
export default DepositInputs;
