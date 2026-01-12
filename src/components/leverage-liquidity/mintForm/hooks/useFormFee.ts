import {
  calculateApeVaultFee,
  calculateTeaVaultFee,
} from "@/lib/utils/calculations";
import buildData from "@/../public/build-data.json";

const BASE_FEE = buildData.systemParams.baseFee;
const LP_FEE = buildData.systemParams.lpFee;
import { useMemo } from "react";
interface Props {
  leverageTier: string;
  isApe: boolean;
  portionLockTime?: number; // 0-255, only used for TEA on chains with LP lock time feature
}
export default function useFormFee({ leverageTier, isApe, portionLockTime = 0 }: Props) {
  const fee = useMemo(() => {
    const lev = parseFloat(leverageTier);
    if (!isApe) {
      // Apply portionLockTime scaling to LP fee
      // portionLockTime: 0 = full fee, 255 = no fee
      const effectiveLpFee = LP_FEE * (255 - portionLockTime) / 255;
      return (calculateTeaVaultFee(effectiveLpFee) * 100).toString();
    }
    if (isFinite(lev)) {
      return (calculateApeVaultFee(lev, BASE_FEE) * 100).toString();
    } else {
      return undefined;
    }
  }, [isApe, leverageTier, portionLockTime]);
  return fee;
}
