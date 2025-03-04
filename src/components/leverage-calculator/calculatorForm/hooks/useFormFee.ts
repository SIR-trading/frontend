import { formatNumber } from "@/lib/utils";
import {
  calculateApeVaultFee,
  calculateTeaVaultFee,
} from "@/lib/utils/calculations";
import { useMemo } from "react";
interface Props {
  leverageTier: string;
  isApe: boolean;
}
export default function useFormFee({ leverageTier, isApe }: Props) {
  const fee = useMemo(() => {
    const lev = parseFloat(leverageTier);
    if (!isApe) {
      return formatNumber(calculateTeaVaultFee() * 100, 2);
    }
    if (isFinite(lev)) {
      return formatNumber(calculateApeVaultFee(lev) * 100, 2);
    } else {
      return undefined;
    }
  }, [isApe, leverageTier]);
  return fee;
}
