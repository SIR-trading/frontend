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
import { WETH_ADDRESS } from "@/data/constants";
import Show from "@/components/shared/show";
import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import MintFormSettings from "./MintFormSettings";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";

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
  useEth: boolean;
  setUseEth: (b: boolean) => void;
  decimals: number;
  disabled: boolean;
  maxTokenIn?: string | undefined;
  inputLoading: boolean;
  children: ReactNode;
}
function Inputs({
  decimals,
  balance,
  useEth,
  setUseEth,
  disabled,
  maxTokenIn,
  inputLoading,
  children,
}: Props) {
  const form = useFormContext<TMintFormFields>();
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
        <div className="space-y-2">
          {formData.depositToken === WETH_ADDRESS && (
            <div className="flex items-center gap-x-2 pt-1">
              <h3 className="text-[12px] text-foreground">Use ETH</h3>
              <Switch
                checked={useEth}
                onCheckedChange={() => {
                  setUseEth(!useEth);
                }}
                aria-readonly
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div
          className={`flex h-[40px] w-[130px] items-center justify-center gap-x-2 rounded-md bg-tertiary ${!formData.depositToken ? "opacity-70" : ""}`}
        >
          {/* {!depositAsset && <div className="h-[25px] w-[25px]" />} */}
          {/* <AssetInfo depositAsset={depositAsset} useEth={useEth} /> */}
          {children}
        </div>
        <h2 className="font-geist-mono pt-1 text-right  text-on-bg-subdued">
          Balance: <DisplayFormattedNumber num={balance ?? "0"} />
        </h2>
        <BalancePercent
          settings={<MintFormSettings />}
          disabled={disabled}
          balance={balance}
          setValue={(s: string) => {
            form.setValue("deposit", s);
          }}
          overrideMaxValue={maxTokenIn}
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
