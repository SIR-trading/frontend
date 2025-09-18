import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { parseAddress } from "@/lib/utils/index";
import { useFormContext } from "react-hook-form";
import { formatUnits } from "viem";
import { useNativeCurrency } from "@/components/shared/hooks/useNativeCurrency";

interface EstimateProps {
  collateralEstimate: bigint | undefined;
  usingEth: boolean;
  isApe: boolean;
  vaultId: string;
  decimals: number;
}
export function TransactionEstimates({
  isApe,
  collateralEstimate,
  usingEth,
  vaultId,
  decimals,
}: EstimateProps) {
  const form = useFormContext<TMintFormFields>();
  const nativeCurrency = useNativeCurrency();
  const data = form.watch();
  const usingDebt =
    data.depositToken === parseAddress(data.versus) && data.depositToken !== "";
  const collateralAssetName = usingEth
    ? nativeCurrency.symbol
    : form.getValues("long").split(",")[1] ?? "";
  const debtAssetName = usingEth
    ? nativeCurrency.symbol
    : form.getValues("versus").split(",")[1] ?? "";
  const deposit = form.getValues("deposit");
  return (
    <div className="flex animate-fade-in gap-x-2  duration-300">
      <h3 className="space-x-1">
        <span>{deposit}</span>
        <span className="text-gray-300 text-sm">
          {usingDebt ? debtAssetName : collateralAssetName}
        </span>
      </h3>
      <span className="text-foreground/70">{"->"}</span>
      <h3 className=" space-x-1">
        <span>
          <DisplayFormattedNumber
            num={formatUnits(collateralEstimate ?? 0n, decimals)}
            significant={6}
          />
        </span>
        <span className="text-gray-300 text-sm">
          <span>
            {isApe ? "APE" : "TEA"}-{vaultId}
          </span>
        </span>
      </h3>
    </div>
  );
}
