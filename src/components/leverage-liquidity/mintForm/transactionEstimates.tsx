import type { TMintFormFields } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import { formatUnits } from "viem";

interface EstimateProps {
  collateralEstimate: bigint | undefined;
  usingEth: boolean;
  isApe: boolean;
  vaultId: string;
}
export function TransactionEstimates({
  isApe,
  collateralEstimate,
  usingEth,
  vaultId,
}: EstimateProps) {
  const form = useFormContext<TMintFormFields>();
  const collateralAssetName = usingEth
    ? "ETH"
    : form.getValues("long").split(",")[1] ?? "";
  const deposit = form.getValues("deposit");
  return (
    <div className="flex gap-x-2 py-2">
      <h3 className="space-x-1">
        <span>{deposit}</span>
        <span className="text-sm text-gray-300">{collateralAssetName}</span>
      </h3>
      <span className="text-gray-500">{"->"}</span>
      <h3 className=" space-x-1">
        <span>
          {formatNumber(formatUnits(collateralEstimate ?? 0n, 18), 6)}
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
