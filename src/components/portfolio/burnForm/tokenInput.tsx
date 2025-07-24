import { BalancePercent } from "@/components/shared/balancePercent";
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatUnits, fromHex } from "viem";
import type { TBurnForm } from "./burnForm";
import { inputPatternMatch } from "@/lib/utils/index";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";

// Helper function to convert vaultId to consistent decimal format
const getDisplayVaultId = (vaultId: string): string => {
  // If vaultId starts with '0x', it's hexadecimal and needs conversion
  if (vaultId.startsWith('0x')) {
    try {
      return fromHex(vaultId as `0x${string}`, "number").toString();
    } catch {
      // If conversion fails, return as-is
      return vaultId;
    }
  }
  // If it's already a decimal number, return as-is
  return vaultId;
};

export function TokenInput({
  form,
  balance,
  vaultId,
  isApe,
  positionDecimals,
}: {
  form: TBurnForm;
  balance: bigint | undefined;
  vaultId: string;
  isApe: boolean;
  positionDecimals: number;
}) {
  return (
    <div className={`rounded-md bg-primary/5 px-3 py-2 dark:bg-primary`}>
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
                    if (inputPatternMatch(e.target.value, positionDecimals)) {
                      return field.onChange(e.target.value);
                    }
                  }}
                ></Input>
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex items-center">
          <h3 className="text-xl">
            {isApe ? "APE-" : "TEA-"}
            {getDisplayVaultId(vaultId)}
          </h3>
        </div>
      </div>
      <div className="flex items-end justify-between pt-2">
        <BalancePercent
          balance={formatUnits(balance ?? 0n, positionDecimals)}
          setValue={(s: string) => {
            form.setValue("deposit", s);
          }}
        />

        <span className="text-gray-300 text-sm italic">
          Balance{" "}
          <DisplayFormattedNumber num={formatUnits(balance ?? 0n, positionDecimals)} significant={8} />
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
