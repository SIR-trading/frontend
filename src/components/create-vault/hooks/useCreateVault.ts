import { VaultContract } from "@/contracts/vault";
import type { CreateVaultInputValues } from "@/lib/schemas";
import type { TAddressString } from "@/lib/types";
import { useSimulateContract } from "wagmi";
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
  console.log(lt, "LT");
  const enabled = Boolean(versusToken !== "" && longToken !== "");

  const vault = {
    ...VaultContract,
    address: enabled ? VaultContract.address : undefined,
  };
  // return undefined address to avoid simulation
  const { data, error } = useSimulateContract({
    ...vault,
    functionName: "initialize",
    args: [
      {
        debtToken: versusToken as TAddressString,
        collateralToken: longToken as TAddressString,
        leverageTier: lt,
      },
    ],
  });

  console.log(error, "init error", data);
  if (error) {
    console.log(error, "init error", data);
  }
  return data;
}
