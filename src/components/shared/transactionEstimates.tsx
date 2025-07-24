import { useFormContext } from "react-hook-form";
import { formatUnits } from "viem";
import type { TMintFormFields } from "../providers/mintFormProvider";
import DisplayFormattedNumber from "./displayFormattedNumber";

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
    <div className="flex h-[40px] gap-x-2 py-2">
      <h3 className="space-x-1">
        <span>{deposit}</span>
        <span className="text-gray-300 text-sm">{inAssetName}</span>
      </h3>
      <span className="text-foreground/70">{"->"}</span>
      <h3 className="space-x-1">
        <span>
          <DisplayFormattedNumber
            num={formatUnits(collateralEstimate ?? 0n, decimals)}
            significant={6}
          />
        </span>
        <span className="text-gray-300 text-sm">{outAssetName}</span>
      </h3>
    </div>
  );
}
