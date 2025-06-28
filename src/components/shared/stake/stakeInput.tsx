import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { TUnstakeForm } from "@/lib/types";
import { BalancePercent } from "@/components/shared/balancePercent";

import sir_logo from "@/../public/images/sir-logo.svg";
import Image, { type StaticImageData } from "next/image";
import { formatNumber, inputPatternMatch } from "@/lib/utils";
import DisplayFormattedNumber from "../displayFormattedNumber";

interface Props {
  form: TUnstakeForm;
  balance?: string;
  isStaking: boolean;
}

const StakeInput = ({ form, balance, isStaking }: Props) => {
  const logo = sir_logo as StaticImageData;

  return (
    <div className="bg-secondary-600 rounded-md px-3 py-2">
      <FormLabel htmlFor="stake">Amount</FormLabel>
      <div className="flex justify-between  ">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <div>
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
                        field.onChange(e.target.value);
                      }
                    }}
                  ></Input>
                </FormControl>
              </FormItem>
              {/* <h2 className="pt-2 text-sm italic text-gray-500">{"$20.55"}</h2> */}
            </div>
          )}
        />
        <div className="flex flex-col items-end">
          <div
            className={`flex items-center justify-center gap-x-2 rounded-md py-1`}
          >
            <Image src={logo} alt="sir-logo" width={25} height={25} />
            <span className="text-nowrap font-medium">
              {isStaking ? "Unstaked SIR" : "Staked SIR"}
            </span>
          </div>
          <h2 className="text-on-bg-subdued pt-1 text-right text-sm">
            Balance{" "}
            <DisplayFormattedNumber num={formatNumber(balance ?? "0", 8)} />
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
