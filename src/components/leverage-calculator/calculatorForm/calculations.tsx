import { useFormContext } from "react-hook-form";
import type { TCalculatorFormFields } from "@/components/providers/calculatorFormProvider";
import useFormFee from "@/components/leverage-liquidity/mintForm/hooks/useFormFee";
export default function Calculations({
  disabled,
  leverageTier,
}: {
  disabled: boolean;
  leverageTier: string;
}) {
  const form = useFormContext<TCalculatorFormFields>();
  const formData = form.watch();
  console.log(
    "formData",
    formData)
  // (1-fee)(price_final/price_initial)^l
  const strFee = useFormFee({ leverageTier: leverageTier, isApe: true });
  const fee = Number(strFee);


  const finalPosition: number = (1 - (fee / 100)) * (Number(formData.exitPrice) / Number(formData.entryPrice)) ** ((1 + 2 ** parseFloat(leverageTier)) - 1);
  const collateralPosition: number = (1 - (fee / 100)) * (Number(formData.exitPrice) / Number(formData.entryPrice)) ** (1 + 2 ** parseFloat(leverageTier));
  const positionGain = (finalPosition - 1) * 100;
  const collateralGain = (collateralPosition - 1) * 100;

  const ticker = (token: string) => token.split(',')[1];


  return (
    <div className={` mt-4 ${disabled ? "opacity-50" : ""}`}>
      <h2 className="text-md font-bold">Project return:</h2>
      <div className="pt-1"></div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between rounded-md ">
          <h3 className={`text-md `}>
            <span className="text-sm text-gray-300">Returns in <span>{ticker(formData.long)}</span></span>
          </h3>
          <div className="text-md space-x-1">
            <span>{Number(formData.deposit) * Number(finalPosition.toFixed(2))}</span>
            <span className={positionGain < 0 ? "text-red-400" : "text-green-400"}>
              ({positionGain > 0 ? '+' : ''}
              {positionGain.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md ">
          <h3 className={`text-md `}>
            <span className="text-sm text-gray-300">Returns in <span>{ticker(formData.versus)}</span></span>
          </h3>
          <div className="text-md space-x-1">
            <span>{Number(formData.deposit) * Number(formData.entryPrice) * Number(collateralPosition.toFixed(2))}</span>
            <span className={collateralGain < 0 ? "text-red-400" : "text-green-400"}>
              ({collateralGain > 0 ? '+' : ''}
              {collateralGain.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
