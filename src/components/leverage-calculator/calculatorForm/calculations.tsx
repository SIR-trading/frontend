import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type { TCalculatorFormFields } from "@/components/providers/calculatorFormProvider";
import useFormFee from "@/components/leverage-calculator/calculatorForm/hooks/useFormFee";
import useIsDebtToken from "@/components/leverage-calculator/calculatorForm/hooks/useIsDebtToken";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { calculateCollateralGainWithLiquidity} from "@/lib/utils/calculations";
import { useFindVault } from "./hooks/useFindVault";
import { Checkbox } from "@/components/ui/checkbox";
import { useVaultProvider } from "@/components/providers/vaultProvider";

export default function Calculations({ 
  disabled,
  currentPrice 
}: { 
  disabled: boolean;
  currentPrice?: number;
}) {
  const form = useFormContext<TCalculatorFormFields>();
  const formData = form.watch();

  //  Check for the required fields
  const areRequiredValuesPresent = useMemo(() => {
    return formData.depositToken && formData.versus && formData.leverageTier;
  }, [formData.depositToken, formData.versus, formData.leverageTier]);

  const isDebtToken = useIsDebtToken();
  
  // Get vaults from provider
  const { vaults: vaultsQuery } = useVaultProvider();
  
  // Get the selected vault to fetch reserve data
  const selectedVault = useFindVault(vaultsQuery);
  
  // Use reserve data directly from the vault object
  const apeReserve = selectedVault.result?.apeCollateral ?? 0n;
  const teaReserve = selectedVault.result?.teaCollateral ?? 0n;
  
  // Use the currentPrice passed from parent component (calculatorForm.tsx)
  const marketPrice = currentPrice ?? 0;

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

  // Calculate positions using the provided values.
  // Use liquidity-aware calculation if considerLiquidity is checked
  const rawCollateralGain = calculateCollateralGainWithLiquidity(
    entryPrice,
    exitPrice,
    marketPrice,
    parseFloat(formData.leverageTier),
    apeReserve,
    teaReserve,
    formData.considerLiquidity ?? true
  );
  
  const collateralGain: number = (1 - fee / 100) * rawCollateralGain;

  const debtTokenGain: number = collateralGain * (exitPrice / entryPrice);

  const collateralGainPerc = (collateralGain - 1) * 100;
  const debtTokenGainPerc = (debtTokenGain - 1) * 100;

  interface IAmounts {
    collateralGain: number;
    collateralGainPerc: number;
    debtTokenGain: number;
    debtTokenGainPerc: number;
  }

  const amounts = (): IAmounts => {
    if (isNaN(Number(formData.deposit)))
      return { collateralGain: 0, collateralGainPerc: 0, debtTokenGain: 0, debtTokenGainPerc: 0 };
    if (Number(formData.deposit) === 0 || (entryPrice === 0 && exitPrice === 0))
      return { collateralGain: 0, collateralGainPerc: 0, debtTokenGain: 0, debtTokenGainPerc: 0 };
    else if (entryPrice === 0 && exitPrice !== 0)
      return { collateralGain: Infinity, collateralGainPerc: Infinity, debtTokenGain: Infinity, debtTokenGainPerc: Infinity };
    else if (entryPrice !== 0 && exitPrice === 0)
      return { collateralGain: 0, collateralGainPerc: -100, debtTokenGain: 0, debtTokenGainPerc: -100 };
    return {
      collateralGain: 
        Number(formData.deposit) *
        (isDebtToken ? entryPrice : 1) *
        collateralGain,
      collateralGainPerc: collateralGainPerc,
      debtTokenGain: 
        Number(formData.deposit) *
        (isDebtToken ? 1 : 1/entryPrice) *
        debtTokenGain,
      debtTokenGainPerc: debtTokenGainPerc,
    };
  };

  // Extracts the ticker form the token string
  const ticker = (token: string) => token.split(",")[1];

  return (
    <div className={`mt-4 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-md font-bold">Expected returns</h2>
        <div className="flex items-center gap-2">
          <Checkbox
            id="considerLiquidity"
            checked={formData.considerLiquidity ?? true}
            onCheckedChange={(checked) => {
              form.setValue("considerLiquidity", checked === true);
            }}
            className="border-foreground/50"
          />
          <label 
            htmlFor="considerLiquidity" 
            className="text-sm text-foreground/80 cursor-pointer"
          >
            Consider current liquidity
          </label>
        </div>
      </div>
      <div className="pt-1"></div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between rounded-md">
          <h3 className="text-md">
            <span className="text-gray-300 text-sm">
              Returns in <span>{ticker(formData.long)}</span>:
            </span>
          </h3>
          <div className="text-md space-x-1">
            <span><DisplayFormattedNumber num={amounts().collateralGain} significant={4} /></span>
            <span
              className={
                amounts().collateralGainPerc < 0 ? "text-red" : "text-accent"
              }
            >
              ({amounts().collateralGainPerc > 0 ? "+" : ""}
              <DisplayFormattedNumber num={amounts().collateralGainPerc} significant={2} />%)
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md">
          <h3 className="text-md">
            <span className="text-gray-300 text-sm">
              Returns in <span>{ticker(formData.versus)}</span>:
            </span>
          </h3>
          <div className="text-md space-x-1">
            <span><DisplayFormattedNumber num={amounts().debtTokenGain} significant={4} /></span>
            <span
              className={
                amounts().debtTokenGainPerc < 0 ? "text-red" : "text-accent"
              }
            >
              ({amounts().debtTokenGainPerc > 0 ? "+" : ""}
              <DisplayFormattedNumber num={amounts().debtTokenGainPerc} significant={2} />%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
