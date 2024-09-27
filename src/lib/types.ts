import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import type { CreateVaultInputValues } from "./schemas";

export type TTokenRow = {
  ID: number;
  Address: string;
  Decimals: string;
  Symbol: string;
};
export type TAddressString = `0x${string}`;
// vaultParams.debtToken, vaultParams.collateralToken, vaultParams.leverageTier, vaultId
export type TPool = {
  debtToken: TAddressString;
  collateralToken: TAddressString;
  leverageTier: LeverageTier;
  vaultId: string;
  iconUrl?: string;
  name: string;
  debtTokenSymbol: string;
  collateralTokenSymbol: string;
};

export interface VaultFieldFragment {
  debtToken: string;
  debtSymbol: string;
  collateralToken: string;
  collateralSymbol: string;
  vaultId: string;
  leverageTier: number;
  totalApeLocked: string;
  totalTeaLocked: string;
  lockedLiquidity: string;
  apeAddress: TAddressString;
}
export type TVaults =
  | {
      vaults: VaultFieldFragment[];
    }
  | undefined;
export enum LeverageTier {
  "one",
  "two",
  "three",
  "four",
}

export type TBurnRow =
  | {
      User: string;
      leverageTier: string;
      balance: bigint;
      APE: string;
      collateralToken: string;
      debtToken: string;
      collateralSymbol: string;
      debtSymbol: string;
    }
  | undefined;

export type TCreateVaultForm = UseFormReturn<TCreateVaultFields, undefined>;
export type TCreateVaultFields = z.infer<typeof CreateVaultInputValues>;
export type TCreateVaultKeys = keyof TCreateVaultFields;

export type TStakeForm = UseFormReturn<TStakeFormFields, undefined>;
export interface TStakeFormFields {
  stake?: string;
}
export type TUnstakeForm = UseFormReturn<TUnstakeFormFields, undefined>;
export interface TUnstakeFormFields {
  amount?: string;
  claimFees?: boolean;
}

export type TMintForm = UseFormReturn<TMintFormFields, undefined>;
export interface TMintFormFields {
  long: string;
  versus: string;
  leverageTier: string;
  depositToken: string;
  deposit?: string;
}
export type TMintFormFieldKeys = keyof TMintFormFields;
