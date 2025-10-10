import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { TUnstakeForm } from "@/lib/types";
import { BalancePercent } from "@/components/shared/balancePercent";

import { getSirLogo } from "@/lib/assets";
import Image from "next/image";
import { inputPatternMatch } from "@/lib/utils/index";
import DisplayFormattedNumber from "../displayFormattedNumber";
import { useSirUsdPrice } from "./hooks/useSirUsdPrice";

interface Props {
  form: TUnstakeForm;
  balance?: string;
  isStaking: boolean;
}

const StakeInput = ({ form, balance, isStaking }: Props) => {
  const logo = getSirLogo();
  const amount = form.watch("amount");
  const { usdValue } = useSirUsdPrice(amount);

  return (
    <div className="rounded-md bg-primary/5 px-3 py-2 dark:bg-primary">
      <FormLabel htmlFor="stake">Amount</FormLabel>
      <div className="flex justify-between  ">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <div className="flex-1">
              <FormItem>
                <FormControl>
                  <Input
                    type="text"
                    className="bg-transparent"
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
                      if (inputPatternMatch(e.target.value, 12)) {
                        // Normalize commas to dots for European locale keyboards
                        const normalizedValue = e.target.value.replace(',', '.');
                        field.onChange(normalizedValue);
                      }
                    }}
                  ></Input>
                </FormControl>
              </FormItem>
              {usdValue !== null && usdValue > 0 && (
                <div className="text-xs text-muted-foreground pt-1">
                  ≈ $<DisplayFormattedNumber num={usdValue.toString()} />
                </div>
              )}
            </div>
          )}
        />
        <div className="flex flex-col items-end">
          <div
            className={`flex items-center justify-center gap-x-2 rounded-md py-1`}
          >
            <span className="text-nowrap font-medium">
              {isStaking ? "Unstaked SIR" : "Unlocked Staked SIR"}
            </span>
            <Image src={logo} alt="gorilla-logo" width={25} height={25} />
          </div>
          <h2 className="pt-1 text-right font-geist-mono text-sm text-on-bg-subdued">
            Balance{" "}
            <DisplayFormattedNumber num={balance ?? "0"} significant={8} />
          </h2>
          <div className="flex justify-end"></div>
          <BalancePercent
            balance={balance}
            setValue={(s: string) => {
              form.setValue("amount", s);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default StakeInput;
