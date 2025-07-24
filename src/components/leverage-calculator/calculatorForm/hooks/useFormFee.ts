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
      return (calculateTeaVaultFee() * 100).toString();
    }
    if (isFinite(lev)) {
      return (calculateApeVaultFee(lev) * 100).toString();
    } else {
      return undefined;
    }
  }, [isApe, leverageTier]);
  return fee;
}
