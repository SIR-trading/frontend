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
  "CALCULATOR",
  "LEADERBOARD",
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
  id: string;
  exists: boolean;
  leverageTier: number;
  teaSupply: string;
  totalValue: string;
  totalValueUsd: string;
  lockedLiquidity: string;
  tax: string;
  rate: string;
  reserveApes: string;
  reserveLPers: string;
  collateralToken: {
    id: TAddressString;
    symbol: string | null;
    decimals: number;
  };
  debtToken: {
    id: TAddressString;
    symbol: string | null;
    decimals: number;
  };
  ape: {
    id: TAddressString;
    symbol: string | null;
    decimals: number;
  };
}
export type TVault = VaultFieldFragment;
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
  token: {
    id: string;
    symbol: string | null;
    decimals: number;
  };
  amount: string;
  highestBid: string;
  highestBidder: string;
  startTime: string;
  isClaimed: boolean;
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

export interface ExplainerContent {
  title: React.ReactNode;
  description: React.ReactNode;
}

export type ExplainersMap = Record<EPage, ExplainerContent>;
export type ClosedApePositionFragment = {
  collateralDeposited: string;
  collateralWithdrawn: string;
  dollarDeposited: string;
  dollarWithdrawn: string;
  user: string;
  timestamp: string;
  vault: {
    id: `0x${string}`;
    leverageTier: number;
    collateralToken: {
      decimals: number;
    };
  };
};

export type CurrentApePositionFragment = {
  user: string;
  collateralTotal: string;
  dollarTotal: string;
  debtTokenTotal: string;
  balance: string;
  vault: {
    id: `0x${string}`;
    leverageTier: number;
    collateralToken: {
      id: `0x${string}`;
      symbol: string | null;
      decimals: number;
    };
    debtToken: {
      id: `0x${string}`;
      symbol: string | null;
      decimals: number;
    };
    ape: {
      id: `0x${string}`;
      symbol: string | null;
      decimals: number;
    };
  };
};

export type TClosedApePositions = Record<
  string,
  {
    positions: {
      pnlUsd: number;
      pnlCollateral: number;
      pnlUsdPercentage: number;
      pnlCollateralPercentage: number;
      dollarDeposited: number;
      collateralDeposited: number;
      timestamp: number;
      vaultId: `0x${string}`;
    }[];
    total: {
      pnlUsd: number;
      pnlCollateral: number;
      pnlUsdPercentage: number;
      pnlCollateralPercentage: number;
    };
    rank: number;
  }
>;

export type TPositionsResponse = {
  activeApePositions: TCurrentApePositions;
  closedApePositions: TClosedApePositions;
};

export type TCurrentApePositions = Record<
  string,
  {
    rank: number;
    position: {
      vaultId: `0x${string}`;
      user: `0x${string}`;
      apeBalance: string;
      collateralToken: string;
      pnlUsd: number;
      pnlUsdPercentage: number;
      pnlCollateral: number;
      pnlCollateralPercentage: number;
      leverageTier: number;
      netCollateralPosition: number;
      dollarTotal: number;
      collateralTotal: string;
    };
  }
>;
