import { L_FEE } from "@/data/constants";
import { formatNumber } from "@/lib/utils";
import { calculateApeVaultFee, calculateTeaVaultFee } from "@/lib/utils/calculations";
import { useMemo } from "react";

interface Props {
  levTier: string;
  isApe: boolean;
}
export default function useGetFee({ levTier, isApe }: Props) {
  const fee = useMemo(() => {
    const lev = parseFloat(levTier);
    if (!isApe) {
      return formatNumber(calculateTeaVaultFee() * 100, 2);
    }
    if (isFinite(lev)) {
      return formatNumber(calculateApeVaultFee(lev) * 100, 2);
    } else {
      return undefined;
    }
  }, [isApe, levTier]);
  return fee;
}
