import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { TAddressString, TMintForm } from "@/lib/types";
import { BalancePercent } from "@/components/shared/balancePercent";
import Image from "next/image";
import { formatNumber, inputPatternMatch } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { WETH_ADDRESS } from "@/data/constants";
import ImageWithFallback from "@/components/shared/ImageWithFallback";
import { getLogoAsset } from "@/lib/assets";
import Show from "@/components/shared/show";
import type { ReactNode } from "react";

function Root({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <FormLabel htmlFor="deposit">Deposit</FormLabel>
      <div className="pt-1"></div>
      {children}
    </div>
  );
}

interface Props {
  form: TMintForm;
  depositAsset: string | undefined;
  balance?: string;
  useEth: boolean;
  setUseEth: (b: boolean) => void;
  decimals: number;
  disabled: boolean;
  maxCollateralIn?: string | undefined;
  inputLoading: boolean;
  children: ReactNode;
}
function Inputs({
  form,
  decimals,
  depositAsset,
  balance,
  useEth,
  setUseEth,
  disabled,
  maxCollateralIn,
  inputLoading,
  children,
}: Props) {
  return (
    <div
      data-state={disabled ? "disabled" : "active"}
      className="flex justify-between rounded-md bg-primary p-3 data-[state=disabled]:opacity-60"
    >
      <div>
        <Show
          when={!inputLoading}
          fallback={
            <div className="flex h-[40px] items-center">
              <div className="h-[24px] w-12 animate-pulse rounded-sm bg-secondary-600"></div>
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

        <div className="">
          {depositAsset?.split(",")[0] === WETH_ADDRESS && (
            <div className="flex items-center gap-x-2 pt-1">
              <h3 className="text-[12px]">Use ETH</h3>
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
        {/* <h2 className="pt-1 text-sm text-[#B6B6C9]">$22.55</h2> */}
      </div>

      <div className="flex flex-col items-end">
        <h2 className="pb-2 text-sm">Deposit Asset</h2>
        <div
          className={`flex h-[40px] w-[130px] items-center justify-center gap-x-2 rounded-md bg-secondary ${!depositAsset ? "opacity-70" : ""}`}
        >
          {/* {!depositAsset && <div className="h-[25px] w-[25px]" />} */}
          {/* <AssetInfo depositAsset={depositAsset} useEth={useEth} /> */}
          {children}
        </div>
        <h2 className="pt-1 text-right text-sm text-[#B6B6C9]">
          Balance: {formatNumber(balance ?? "0")}
        </h2>
        <BalancePercent
          disabled={disabled}
          balance={balance}
          setValue={(s: string) => {
            form.setValue("deposit", s);
          }}
          overrideMaxValue={maxCollateralIn}
        />
      </div>
    </div>
  );
}

function AssetInfo({
  useEth,
  depositAsset,
}: {
  useEth: boolean;
  depositAsset: string | undefined;
}) {
  if (useEth) {
    return (
      <>
        {depositAsset && (
          <Image
            src={
              "https://raw.githubusercontent.com/fusionxx23/assets/master/blockchains/ethereum/info/logo.png"
            }
            alt={"ETH"}
            width={25}
            height={25}
          />
        )}
        <span>{"ETH"}</span>
      </>
    );
  }
  return (
    <>
      {depositAsset && (
        <ImageWithFallback
          src={getLogoAsset(depositAsset?.split(",")[0] as TAddressString)}
          alt={depositAsset.split(",")[1] ?? ""}
          width={25}
          height={25}
        />
      )}
      <span>{depositAsset?.split(",")[1]}</span>
    </>
  );
}

const DepositInputs = {
  Root,
  Inputs,
};
export default DepositInputs;
