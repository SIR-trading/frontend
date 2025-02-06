import { formatNumber } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import { formatUnits } from "viem";
import type { TMintFormFields } from "../providers/mintFormProvider";

interface EstimateProps {
  collateralEstimate: bigint | undefined;
  inAssetName: string;
  outAssetName: string;
  usingEth: boolean;
  decimals: number;
}
export function TransactionEstimates({
  collateralEstimate,
  inAssetName,
  outAssetName,
  decimals,
}: EstimateProps) {
  const form = useFormContext<TMintFormFields>();
  const deposit = form.getValues("deposit");
  return (
    <div className="flex gap-x-2 py-2">
      <h3 className="space-x-1">
        <span>{deposit}</span>
        <span className="text-sm text-gray-300">{inAssetName}</span>
      </h3>
      <span className="text-gray-500">{"->"}</span>
      <h3 className="space-x-1">
        <span>
          {formatNumber(formatUnits(collateralEstimate ?? 0n, decimals), 6)}
        </span>
        <span className="text-sm text-gray-300">{outAssetName}</span>
      </h3>
    </div>
  );
}
