import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type { TCalculatorFormFields } from "@/components/providers/calculatorFormProvider";
import useFormFee from "@/components/leverage-calculator/calculatorForm/hooks/useFormFee";
import useIsDebtToken from "@/components/leverage-calculator/calculatorForm/hooks/useIsDebtToken";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";

export default function Calculations({ disabled }: { disabled: boolean }) {
  const form = useFormContext<TCalculatorFormFields>();
  const formData = form.watch();

  //  Check for the required fields
  const areRequiredValuesPresent = useMemo(() => {
    return formData.depositToken && formData.versus && formData.leverageTier;
  }, [formData.depositToken, formData.versus, formData.leverageTier]);

  const isDebtToken = useIsDebtToken();
  console.log({ isDebtToken });

  // Extract fee
  const strFee = useFormFee({
    leverageTier: formData.leverageTier,
    isApe: true,
  });
  const fee = Number(strFee);

  // If the required values are not present, show a placeholder
  if (!areRequiredValuesPresent) {
    return (
      <div className="flex h-40 items-center justify-center">
        Please complete all required fields to display calculations.
      </div>
    );
  }

  // Make sure entryPrice and exitPrice are provided to avoid calculation errors.
  const entryPrice = Number(formData.entryPrice);
  const exitPrice = Number(formData.exitPrice);
  // if (!entryPrice || !exitPrice) {
  //   return (
  //     <div className="flex h-40 items-center justify-center">
  //       Please provide both entry and exit prices.
  //     </div>
  //   );
  // }

  // Calculate positions using the provided values.
  const longTokenPosition: number =
    (1 - fee / 100) *
    (exitPrice / entryPrice) ** (2 ** parseFloat(formData.leverageTier));

  const debtTokenPosition: number =
    (1 - fee / 100) *
    (exitPrice / entryPrice) ** (1 + 2 ** parseFloat(formData.leverageTier));

  const positionGain = (longTokenPosition - 1) * 100;
  const collateralGain = (debtTokenPosition - 1) * 100;

  interface IAmounts {
    long: string;
    longGain: string | number;
    debt: string;
    debtGain: number | string;
  }

  const amounts = (): IAmounts => {
    if (isNaN(Number(formData.deposit)))
      return { long: "0", longGain: "0", debt: "0", debtGain: "0" };
    if (Number(formData.deposit) === 0 || (entryPrice === 0 && exitPrice === 0))
      return { long: "0", longGain: "0", debt: "0", debtGain: "0" };
    else if (entryPrice === 0 && exitPrice !== 0)
      return { long: "∞", longGain: "∞", debt: "∞", debtGain: "∞" };
    else if (entryPrice !== 0 && exitPrice === 0)
      return { long: "0", longGain: "-100", debt: "0", debtGain: "-100" };
    return {
      long: (
        Number(formData.deposit) *
        (isDebtToken ? Number(entryPrice) : 1) *
        longTokenPosition
      )
        .toFixed(2)
        .toString(),
      longGain: positionGain.toFixed(2).toString(),
      debt: (
        Number(formData.deposit) *
        ((isDebtToken ? 1 : entryPrice) * debtTokenPosition)
      )
        .toFixed(2)
        .toString(),
      debtGain: collateralGain.toFixed(2).toString(),
    };
  };

  // Extracts the ticker form the token string
  const ticker = (token: string) => token.split(",")[1];

  return (
    <div className={`mt-4 ${disabled ? "opacity-50" : ""}`}>
      <h2 className="text-md font-bold">Project return:</h2>
      <div className="pt-1"></div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between rounded-md">
          <h3 className="text-md">
            <span className="text-gray-300 text-sm">
              Returns in <span>{ticker(formData.long)}</span>
            </span>
          </h3>
          <div className="text-md space-x-1">
            <span><DisplayFormattedNumber num={amounts().long} significant={4} /></span>
            <span
              className={
                Number(amounts().longGain) < 0 ? "text-red" : "text-accent"
              }
            >
              ({Number(amounts().longGain) > 0 ? "+" : ""}
              {amounts().longGain}%)
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md">
          <h3 className="text-md">
            <span className="text-gray-300 text-sm">
              Returns in <span>{ticker(formData.versus)}</span>
            </span>
          </h3>
          <div className="text-md space-x-1">
            <span><DisplayFormattedNumber num={amounts().debt} significant={4} /></span>
            <span
              className={
                Number(amounts().debtGain) < 0 ? "text-red" : "text-accent"
              }
            >
              ({Number(amounts().debtGain) > 0 ? "+" : ""}
              {amounts().debtGain}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
