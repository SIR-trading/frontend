import { BASE_FEE } from "@/data/constants";
import { calculateMaxApe } from "@/lib/utils/calculations";
import { api } from "@/trpc/react";
import { useMemo } from "react";
import { formatUnits, parseUnits } from "viem";
import useCalculateVaultHealth from "../../vaultTable/hooks/useCalculateVaultHealth";
import { useFormContext } from "react-hook-form";
import { parseAddress } from "@/lib/utils";
import type { TMintFormFields } from "@/lib/types";

export function useCalculateMaxApe({
  leverageTier,
  vaultId,
  usingDebtToken,
  collateralDecimals,
}: {
  vaultId: number;
  leverageTier: string;
  usingDebtToken: boolean;
  collateralDecimals: number;
}) {
  const form = useFormContext<TMintFormFields>();
  const formData = form.watch();
  const { data, isLoading } = api.vault.getReserve.useQuery(
    { vaultId },
    { enabled: vaultId !== -1 && Number.isFinite(vaultId) },
  );
  const ape = data?.[0]?.reserveApes ?? 0n;
  const tea = data?.[0]?.reserveLPers ?? 0n;

  const { variant } = useCalculateVaultHealth({
    leverageTier: Number.parseInt(leverageTier),
    apeCollateral: ape,
    teaCollateral: tea,
    isApe: true,
  });
  const { badHealth, maxCollateralIn } = useMemo(() => {
    let maxCollateralIn;
    if (!isApe) {
      maxCollateralIn = calculateMaxApe({
        leverageTier: parseUnits(leverageTier ?? "0", 0),
        baseFee: parseUnits(BASE_FEE.toString(), 4),
        apeReserve: ape,
        gentlemenReserve: tea,
      });
    }
    let badHealth = false;
    if (variant === "red" || variant === "yellow") {
      badHealth = true;
    }
    return { badHealth, maxCollateralIn };
  }, [ape, leverageTier, tea, variant]);
  const { data: maxDebtIn } = api.vault.getDebtTokenMax.useQuery(
    {
      debtToken: parseAddress(formData.versus) ?? "0x",
      collateralToken: parseAddress(formData.long) ?? "0x",
      maxCollateralIn: formatUnits(maxCollateralIn ?? 0n, collateralDecimals),
      decimals: collateralDecimals,
    },
    { enabled: usingDebtToken },
  );
  return { badHealth, maxDebtIn, maxCollateralIn, isLoading };
}
