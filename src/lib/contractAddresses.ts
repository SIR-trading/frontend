import { env } from "@/env";
import type { TAddressString } from "./types";

export enum EContracts {
  "SIR",
  "ASSISTANT",
  "VAULT",
  "ORACLE",
}
export function getAddress(contract: EContracts): TAddressString {
  if (contract === EContracts.SIR) {
    return env.NEXT_PUBLIC_SIR_ADDRESS as TAddressString;
  }
  if (contract === EContracts.ORACLE) {
    return env.NEXT_PUBLIC_ORACLE_ADDRESS as TAddressString;
  }
  if (contract === EContracts.ASSISTANT) {
    return env.NEXT_PUBLIC_ASSISTANT_ADDRESS as TAddressString;
  }
  if (contract === EContracts.VAULT) {
    return env.NEXT_PUBLIC_VAULT_ADDRESS as TAddressString;
  }
  return "" as TAddressString;
}
