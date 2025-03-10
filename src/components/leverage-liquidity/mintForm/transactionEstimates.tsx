import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { formatNumber, parseAddress } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import { formatUnits } from "viem";

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
  const data = form.watch();
  const usingDebt =
    data.depositToken === parseAddress(data.versus) && data.depositToken !== "";
  const collateralAssetName = usingEth
    ? "ETH"
    : form.getValues("long").split(",")[1] ?? "";
  const debtAssetName = usingEth
    ? "ETH"
    : form.getValues("versus").split(",")[1] ?? "";
  const deposit = form.getValues("deposit");
  return (
    <div className="flex animate-fade-in gap-x-2  duration-300">
      <h3 className="space-x-1">
        <span>{deposit}</span>
        <span className="text-sm text-gray-300">
          {usingDebt ? debtAssetName : collateralAssetName}
        </span>
      </h3>
      <span className="text-gray-500">{"->"}</span>
      <h3 className=" space-x-1">
        <span>
          <DisplayFormattedNumber
            num={formatNumber(
              formatUnits(collateralEstimate ?? 0n, decimals),
              6,
            )}
          />
        </span>
        <span className="text-sm text-gray-300">
          <span>
            {isApe ? "APE" : "TEA"}-{vaultId}
          </span>
        </span>
      </h3>
    </div>
  );
}
