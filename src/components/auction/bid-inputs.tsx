"use client";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatNumber, inputPatternMatch } from "@/lib/utils";
import Show from "@/components/shared/show";
import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import type { TAuctionBidFormFields } from "@/components/providers/auctionBidFormProvider";
import { BidPercent } from "@/components/auction/bidPercent";

function Root({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="pt-4"></div>
      {children}
    </div>
  );
}

interface Props {
  balance?: string;
  decimals: number;
  disabled: boolean;
  inputLoading: boolean;
  children: ReactNode;
  currentBid: string;
  nextBid: string;
  isTopUp: boolean | undefined;
}
function Inputs({
  decimals,
  balance,
  disabled,
  inputLoading,
  children,
  currentBid,
  nextBid,
  isTopUp,
}: Props) {
  const form = useFormContext<TAuctionBidFormFields>();
  return (
    <div
      data-state={disabled ? "disabled" : "active"}
      className="mx-4 flex justify-between rounded-md bg-primary/5 p-4 data-[state=disabled]:opacity-60 dark:bg-primary"
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
            name="bid"
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

      <div className="flex flex-col items-end">
        <div
          className={`flex h-[40px] w-[130px] items-center justify-end gap-x-2 rounded-md`}
        >
          {children}
        </div>
        <h2 className="pt-1 text-right text-sm text-on-bg-subdued">
          Balance: {formatNumber(balance ?? "0")}
        </h2>
        <BidPercent
          disabled={disabled}
          balance={balance}
          setValue={(s: string) => {
            form.setValue("bid", s);
          }}
          currentBid={currentBid}
          nextBid={nextBid}
          isTopUp={isTopUp}
        />
      </div>
    </div>
  );
}

const AuctionBidInputs = {
  Root,
  Inputs,
};
export default AuctionBidInputs;
