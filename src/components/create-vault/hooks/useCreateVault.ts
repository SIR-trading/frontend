import { VaultContract } from "@/contracts/vault";
import type { CreateVaultInputValues } from "@/lib/schemas";
import type { TAddressString } from "@/lib/types";
import type { z } from "zod";

type Props = z.infer<typeof CreateVaultInputValues>;

export function useCreateVault({
  longToken,
  versusToken,
  leverageTier,
}: Props) {
  let lt = parseInt(leverageTier);
  if (!isFinite(lt)) {
    lt = 0;
  }

  // Build the request object for direct contract write (no simulation)
  const request = {
    ...VaultContract,
    functionName: "initialize" as const,
    args: [
      {
        debtToken: versusToken as TAddressString,
        collateralToken: longToken as TAddressString,
        leverageTier: lt,
      },
    ],
  };

  // Only return request if we have valid inputs
  const enabled = Boolean(versusToken && longToken && leverageTier);

  return enabled ? { request } : undefined;
}
