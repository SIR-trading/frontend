import { BalancePercent } from "@/components/shared/balancePercent";
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatBigInt } from "@/lib/utils";
import { formatUnits } from "viem";
import type { TBurnForm } from "./burnForm";

export function Section({
  form,
  bg,
  balance,
  vaultId,
  isApe,
}: {
  form: TBurnForm;
  bg: string;
  balance: bigint | undefined;
  vaultId: string;
  isApe: boolean;
}) {
  return (
    <div className={`w-full rounded-md ${bg} px-2 py-3`}>
      <div className="flex justify-between">
        <FormField
          control={form.control}
          name="deposit"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  id="a"
                  placeholder="0"
                  textSize="xl"
                  type="string"
                  inputMode="decimal"
                  autoComplete="off"
                  pattern="^[0-9]*[.,]?[0-9]*$"
                  {...field}
                  onChange={(e) => {
                    const pattern = /^[0-9]*[.,]?[0-9]*$/;
                    if (pattern.test(e.target.value))
                      return field.onChange(e.target.value);
                  }}
                ></Input>
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex items-center">
          <h3 className="text-xl">
            {isApe ? "APE-" : "TEA-"}
            {vaultId}
          </h3>
        </div>
      </div>
      <div className="flex items-end justify-between pt-2">
        <BalancePercent
          balance={formatUnits(balance ?? 0n, 18)}
          setValue={(s: string) => {
            form.setValue("deposit", s);
          }}
        />

        <span className="text-sm italic text-gray">
          Balance {formatBigInt(balance, 4)}
        </span>
      </div>
    </div>
  );
}
{
  /* <div className="flex h-[45px] w-[140px] items-center gap-x-2 rounded-md bg-secondary px-2"> */
}
{
  /*   <h3>TEA</h3> */
}
{
  /* </div> */
}
