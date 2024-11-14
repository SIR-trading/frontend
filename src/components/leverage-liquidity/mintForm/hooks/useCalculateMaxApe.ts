import { BASE_FEE } from "@/data/constants";
import { calculateMaxApe } from "@/lib/utils/calculations";
import { api } from "@/trpc/react";
import { useMemo } from "react";
import { parseUnits } from "viem";

export function useCalculateMaxApe({
  leverageTier,
  vaultId,
}: {
  vaultId: number;
  leverageTier: string;
}) {
  const { data } = api.vault.getReserves.useQuery(
    { vaultId },
    { enabled: vaultId !== -1 && isFinite(vaultId) },
  );
  const ape = data?.[0]?.reserveApes ?? 0n;
  const tea = data?.[0]?.reserveLPers ?? 0n;
  const calc = useMemo(() => {
    return calculateMaxApe({
      leverageTier: parseUnits(leverageTier ?? "0", 0),
      baseFee: parseUnits(BASE_FEE.toString(), 2),
      apeReserve: ape,
      gentlemenReserve: tea,
    });
  }, [ape, leverageTier, tea]);
  return calc;
}
