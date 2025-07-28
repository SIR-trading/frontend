import {
  calculateApeVaultFee,
  calculateTeaVaultFee,
} from "@/lib/utils/calculations";
import buildData from "@/../public/build-data.json";

const BASE_FEE = buildData.systemParams.baseFee;
const MINTING_FEE = buildData.systemParams.mintingFee;
import { useMemo } from "react";
interface Props {
  leverageTier: string;
  isApe: boolean;
}
export default function useFormFee({ leverageTier, isApe }: Props) {
  const fee = useMemo(() => {
    const lev = parseFloat(leverageTier);
    if (!isApe) {
      return (calculateTeaVaultFee(MINTING_FEE) * 100).toString();
    }
    if (isFinite(lev)) {
      return (calculateApeVaultFee(lev, BASE_FEE) * 100).toString();
    } else {
      return undefined;
    }
  }, [isApe, leverageTier]);
  return fee;
}
