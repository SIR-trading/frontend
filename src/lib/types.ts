import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import type { CreateVaultInputValues } from "./schemas";
import type { Address } from "viem";
export enum EPage {
  "LEVERAGE",
  "LIQUIDITY",
  "PORTFOLIO",
  "STAKE",
  "AUCTIONS",
  "CREATE_VAULT",
}

export enum ESubmitType {
  "mint",
  "approve",
}
export type TCollateral = readonly {
  reserveApes: bigint;
  reserveLPers: bigint;
  tickPriceX42: bigint;
}[];

export type TCollateralResp = readonly {
  reserveApes: string;
  reserveLPers: string;
  tickPriceX42: string;
}[];
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
  taxAmount: string;
  vaultId: string;
  leverageTier: number;
  lockedLiquidity: string;
  totalTea: string;
  totalValue: string;
  apeDecimals: number;
  apeAddress: TAddressString;
  id: string;
}
export type TVault = VaultFieldFragment & {
  apeCollateral: bigint;
  teaCollateral: bigint;
};
export type TVaults =
  | {
      vaults: TVault[];
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
export type TVaultsCollateralToken = {
  collateralToken: string[];
  collateralSymbol: string[];
  apeDecimals: number[];
};

export type AuctionFieldFragment = {
  id: string;
  token: string;
  amount: string;
  highestBid: string;
  highestBidder: string;
  startTime: string;
  isParticipant: {
    bid: string;
  }[];
};


export type TAuctions = {
  bidder: Address;
  bid: bigint;
  startTime: number;
  tokenIndex: number;
};
