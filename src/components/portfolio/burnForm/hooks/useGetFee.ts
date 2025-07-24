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
      return (calculateTeaVaultFee() * 100).toString();
    }
    if (isFinite(lev)) {
      return (calculateApeVaultFee(lev) * 100).toString();
    } else {
      return undefined;
    }
  }, [isApe, levTier]);
  return fee;
}
