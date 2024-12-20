// @ts-nocheck

import { InContextSdkMethod } from '@graphql-mesh/types';
import { MeshContext } from '@graphql-mesh/runtime';

export namespace SirTradeIndexTypes {
  export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigDecimal: { input: any; output: any; }
  BigInt: { input: any; output: any; }
  Bytes: { input: any; output: any; }
  Int8: { input: any; output: any; }
  Timestamp: { input: any; output: any; }
};

export type Aggregation_interval =
  | 'hour'
  | 'day';

export type BlockChangedFilter = {
  number_gte: Scalars['Int']['input'];
};

export type Block_height = {
  hash?: InputMaybe<Scalars['Bytes']['input']>;
  number?: InputMaybe<Scalars['Int']['input']>;
  number_gte?: InputMaybe<Scalars['Int']['input']>;
};

export type Dividends = {
  id: Scalars['String']['output'];
  ethAmount: Scalars['BigInt']['output'];
  stakedAmount: Scalars['BigInt']['output'];
};

export type Dividends_filter = {
  id?: InputMaybe<Scalars['String']['input']>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_gt?: InputMaybe<Scalars['String']['input']>;
  id_lt?: InputMaybe<Scalars['String']['input']>;
  id_gte?: InputMaybe<Scalars['String']['input']>;
  id_lte?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<Scalars['String']['input']>>;
  id_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  ethAmount?: InputMaybe<Scalars['BigInt']['input']>;
  ethAmount_not?: InputMaybe<Scalars['BigInt']['input']>;
  ethAmount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  ethAmount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  ethAmount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  ethAmount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  ethAmount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  ethAmount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  stakedAmount?: InputMaybe<Scalars['BigInt']['input']>;
  stakedAmount_not?: InputMaybe<Scalars['BigInt']['input']>;
  stakedAmount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  stakedAmount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  stakedAmount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  stakedAmount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  stakedAmount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  stakedAmount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Dividends_filter>>>;
  or?: InputMaybe<Array<InputMaybe<Dividends_filter>>>;
};

export type Dividends_orderBy =
  | 'id'
  | 'ethAmount'
  | 'stakedAmount';

/** Defines the order direction, either ascending or descending */
export type OrderDirection =
  | 'asc'
  | 'desc';

export type Query = {
  vault?: Maybe<Vault>;
  vaults: Array<Vault>;
  test?: Maybe<Test>;
  tests: Array<Test>;
  userPosition?: Maybe<UserPosition>;
  userPositions: Array<UserPosition>;
  userPositionTea?: Maybe<UserPositionTea>;
  userPositionTeas: Array<UserPositionTea>;
  dividends?: Maybe<Dividends>;
  dividends_collection: Array<Dividends>;
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
};


export type QueryvaultArgs = {
  id: Scalars['ID']['input'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryvaultsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Vault_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Vault_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerytestArgs = {
  id: Scalars['ID']['input'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerytestsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Test_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Test_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryuserPositionArgs = {
  id: Scalars['ID']['input'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryuserPositionsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<UserPosition_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<UserPosition_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryuserPositionTeaArgs = {
  id: Scalars['ID']['input'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryuserPositionTeasArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<UserPositionTea_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<UserPositionTea_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerydividendsArgs = {
  id: Scalars['ID']['input'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querydividends_collectionArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Dividends_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Dividends_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Query_metaArgs = {
  block?: InputMaybe<Block_height>;
};

export type Subscription = {
  vault?: Maybe<Vault>;
  vaults: Array<Vault>;
  test?: Maybe<Test>;
  tests: Array<Test>;
  userPosition?: Maybe<UserPosition>;
  userPositions: Array<UserPosition>;
  userPositionTea?: Maybe<UserPositionTea>;
  userPositionTeas: Array<UserPositionTea>;
  dividends?: Maybe<Dividends>;
  dividends_collection: Array<Dividends>;
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
};


export type SubscriptionvaultArgs = {
  id: Scalars['ID']['input'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionvaultsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Vault_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Vault_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptiontestArgs = {
  id: Scalars['ID']['input'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptiontestsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Test_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Test_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionuserPositionArgs = {
  id: Scalars['ID']['input'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionuserPositionsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<UserPosition_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<UserPosition_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionuserPositionTeaArgs = {
  id: Scalars['ID']['input'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionuserPositionTeasArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<UserPositionTea_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<UserPositionTea_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptiondividendsArgs = {
  id: Scalars['ID']['input'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptiondividends_collectionArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Dividends_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Dividends_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscription_metaArgs = {
  block?: InputMaybe<Block_height>;
};

export type Test = {
  id: Scalars['String']['output'];
  amount: Scalars['BigInt']['output'];
};

export type Test_filter = {
  id?: InputMaybe<Scalars['String']['input']>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_gt?: InputMaybe<Scalars['String']['input']>;
  id_lt?: InputMaybe<Scalars['String']['input']>;
  id_gte?: InputMaybe<Scalars['String']['input']>;
  id_lte?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<Scalars['String']['input']>>;
  id_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  amount?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Test_filter>>>;
  or?: InputMaybe<Array<InputMaybe<Test_filter>>>;
};

export type Test_orderBy =
  | 'id'
  | 'amount';

export type UserPosition = {
  id: Scalars['String']['output'];
  balance: Scalars['BigInt']['output'];
  positionDecimals: Scalars['Int']['output'];
  APE: Scalars['String']['output'];
  user: Scalars['Bytes']['output'];
  collateralSymbol: Scalars['String']['output'];
  debtSymbol: Scalars['String']['output'];
  collateralToken: Scalars['String']['output'];
  debtToken: Scalars['String']['output'];
  leverageTier: Scalars['String']['output'];
  vaultId: Scalars['String']['output'];
};

export type UserPositionTea = {
  id: Scalars['String']['output'];
  positionDecimals: Scalars['Int']['output'];
  balance: Scalars['BigInt']['output'];
  user: Scalars['Bytes']['output'];
  collateralSymbol: Scalars['String']['output'];
  debtSymbol: Scalars['String']['output'];
  collateralToken: Scalars['Bytes']['output'];
  debtToken: Scalars['Bytes']['output'];
  leverageTier: Scalars['String']['output'];
  vaultId: Scalars['String']['output'];
};

export type UserPositionTea_filter = {
  id?: InputMaybe<Scalars['String']['input']>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_gt?: InputMaybe<Scalars['String']['input']>;
  id_lt?: InputMaybe<Scalars['String']['input']>;
  id_gte?: InputMaybe<Scalars['String']['input']>;
  id_lte?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<Scalars['String']['input']>>;
  id_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  positionDecimals?: InputMaybe<Scalars['Int']['input']>;
  positionDecimals_not?: InputMaybe<Scalars['Int']['input']>;
  positionDecimals_gt?: InputMaybe<Scalars['Int']['input']>;
  positionDecimals_lt?: InputMaybe<Scalars['Int']['input']>;
  positionDecimals_gte?: InputMaybe<Scalars['Int']['input']>;
  positionDecimals_lte?: InputMaybe<Scalars['Int']['input']>;
  positionDecimals_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  positionDecimals_not_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  balance?: InputMaybe<Scalars['BigInt']['input']>;
  balance_not?: InputMaybe<Scalars['BigInt']['input']>;
  balance_gt?: InputMaybe<Scalars['BigInt']['input']>;
  balance_lt?: InputMaybe<Scalars['BigInt']['input']>;
  balance_gte?: InputMaybe<Scalars['BigInt']['input']>;
  balance_lte?: InputMaybe<Scalars['BigInt']['input']>;
  balance_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  balance_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  user?: InputMaybe<Scalars['Bytes']['input']>;
  user_not?: InputMaybe<Scalars['Bytes']['input']>;
  user_gt?: InputMaybe<Scalars['Bytes']['input']>;
  user_lt?: InputMaybe<Scalars['Bytes']['input']>;
  user_gte?: InputMaybe<Scalars['Bytes']['input']>;
  user_lte?: InputMaybe<Scalars['Bytes']['input']>;
  user_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  user_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  user_contains?: InputMaybe<Scalars['Bytes']['input']>;
  user_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  collateralSymbol?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_gt?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_lt?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_gte?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_lte?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_in?: InputMaybe<Array<Scalars['String']['input']>>;
  collateralSymbol_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  collateralSymbol_contains?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not_contains?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_starts_with?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_ends_with?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtSymbol?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_gt?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_lt?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_gte?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_lte?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_in?: InputMaybe<Array<Scalars['String']['input']>>;
  debtSymbol_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  debtSymbol_contains?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not_contains?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_starts_with?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_ends_with?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_not?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_gt?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_lt?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_gte?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_lte?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  collateralToken_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  collateralToken_contains?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  debtToken?: InputMaybe<Scalars['Bytes']['input']>;
  debtToken_not?: InputMaybe<Scalars['Bytes']['input']>;
  debtToken_gt?: InputMaybe<Scalars['Bytes']['input']>;
  debtToken_lt?: InputMaybe<Scalars['Bytes']['input']>;
  debtToken_gte?: InputMaybe<Scalars['Bytes']['input']>;
  debtToken_lte?: InputMaybe<Scalars['Bytes']['input']>;
  debtToken_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  debtToken_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  debtToken_contains?: InputMaybe<Scalars['Bytes']['input']>;
  debtToken_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  leverageTier?: InputMaybe<Scalars['String']['input']>;
  leverageTier_not?: InputMaybe<Scalars['String']['input']>;
  leverageTier_gt?: InputMaybe<Scalars['String']['input']>;
  leverageTier_lt?: InputMaybe<Scalars['String']['input']>;
  leverageTier_gte?: InputMaybe<Scalars['String']['input']>;
  leverageTier_lte?: InputMaybe<Scalars['String']['input']>;
  leverageTier_in?: InputMaybe<Array<Scalars['String']['input']>>;
  leverageTier_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  leverageTier_contains?: InputMaybe<Scalars['String']['input']>;
  leverageTier_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  leverageTier_not_contains?: InputMaybe<Scalars['String']['input']>;
  leverageTier_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  leverageTier_starts_with?: InputMaybe<Scalars['String']['input']>;
  leverageTier_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  leverageTier_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  leverageTier_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  leverageTier_ends_with?: InputMaybe<Scalars['String']['input']>;
  leverageTier_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  leverageTier_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  leverageTier_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultId?: InputMaybe<Scalars['String']['input']>;
  vaultId_not?: InputMaybe<Scalars['String']['input']>;
  vaultId_gt?: InputMaybe<Scalars['String']['input']>;
  vaultId_lt?: InputMaybe<Scalars['String']['input']>;
  vaultId_gte?: InputMaybe<Scalars['String']['input']>;
  vaultId_lte?: InputMaybe<Scalars['String']['input']>;
  vaultId_in?: InputMaybe<Array<Scalars['String']['input']>>;
  vaultId_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  vaultId_contains?: InputMaybe<Scalars['String']['input']>;
  vaultId_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultId_not_contains?: InputMaybe<Scalars['String']['input']>;
  vaultId_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultId_starts_with?: InputMaybe<Scalars['String']['input']>;
  vaultId_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  vaultId_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultId_ends_with?: InputMaybe<Scalars['String']['input']>;
  vaultId_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  vaultId_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<UserPositionTea_filter>>>;
  or?: InputMaybe<Array<InputMaybe<UserPositionTea_filter>>>;
};

export type UserPositionTea_orderBy =
  | 'id'
  | 'positionDecimals'
  | 'balance'
  | 'user'
  | 'collateralSymbol'
  | 'debtSymbol'
  | 'collateralToken'
  | 'debtToken'
  | 'leverageTier'
  | 'vaultId';

export type UserPosition_filter = {
  id?: InputMaybe<Scalars['String']['input']>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_gt?: InputMaybe<Scalars['String']['input']>;
  id_lt?: InputMaybe<Scalars['String']['input']>;
  id_gte?: InputMaybe<Scalars['String']['input']>;
  id_lte?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<Scalars['String']['input']>>;
  id_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  balance?: InputMaybe<Scalars['BigInt']['input']>;
  balance_not?: InputMaybe<Scalars['BigInt']['input']>;
  balance_gt?: InputMaybe<Scalars['BigInt']['input']>;
  balance_lt?: InputMaybe<Scalars['BigInt']['input']>;
  balance_gte?: InputMaybe<Scalars['BigInt']['input']>;
  balance_lte?: InputMaybe<Scalars['BigInt']['input']>;
  balance_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  balance_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  positionDecimals?: InputMaybe<Scalars['Int']['input']>;
  positionDecimals_not?: InputMaybe<Scalars['Int']['input']>;
  positionDecimals_gt?: InputMaybe<Scalars['Int']['input']>;
  positionDecimals_lt?: InputMaybe<Scalars['Int']['input']>;
  positionDecimals_gte?: InputMaybe<Scalars['Int']['input']>;
  positionDecimals_lte?: InputMaybe<Scalars['Int']['input']>;
  positionDecimals_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  positionDecimals_not_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  APE?: InputMaybe<Scalars['String']['input']>;
  APE_not?: InputMaybe<Scalars['String']['input']>;
  APE_gt?: InputMaybe<Scalars['String']['input']>;
  APE_lt?: InputMaybe<Scalars['String']['input']>;
  APE_gte?: InputMaybe<Scalars['String']['input']>;
  APE_lte?: InputMaybe<Scalars['String']['input']>;
  APE_in?: InputMaybe<Array<Scalars['String']['input']>>;
  APE_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  APE_contains?: InputMaybe<Scalars['String']['input']>;
  APE_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  APE_not_contains?: InputMaybe<Scalars['String']['input']>;
  APE_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  APE_starts_with?: InputMaybe<Scalars['String']['input']>;
  APE_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  APE_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  APE_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  APE_ends_with?: InputMaybe<Scalars['String']['input']>;
  APE_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  APE_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  APE_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  user?: InputMaybe<Scalars['Bytes']['input']>;
  user_not?: InputMaybe<Scalars['Bytes']['input']>;
  user_gt?: InputMaybe<Scalars['Bytes']['input']>;
  user_lt?: InputMaybe<Scalars['Bytes']['input']>;
  user_gte?: InputMaybe<Scalars['Bytes']['input']>;
  user_lte?: InputMaybe<Scalars['Bytes']['input']>;
  user_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  user_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  user_contains?: InputMaybe<Scalars['Bytes']['input']>;
  user_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  collateralSymbol?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_gt?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_lt?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_gte?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_lte?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_in?: InputMaybe<Array<Scalars['String']['input']>>;
  collateralSymbol_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  collateralSymbol_contains?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not_contains?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_starts_with?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_ends_with?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtSymbol?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_gt?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_lt?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_gte?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_lte?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_in?: InputMaybe<Array<Scalars['String']['input']>>;
  debtSymbol_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  debtSymbol_contains?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not_contains?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_starts_with?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_ends_with?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not?: InputMaybe<Scalars['String']['input']>;
  collateralToken_gt?: InputMaybe<Scalars['String']['input']>;
  collateralToken_lt?: InputMaybe<Scalars['String']['input']>;
  collateralToken_gte?: InputMaybe<Scalars['String']['input']>;
  collateralToken_lte?: InputMaybe<Scalars['String']['input']>;
  collateralToken_in?: InputMaybe<Array<Scalars['String']['input']>>;
  collateralToken_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  collateralToken_contains?: InputMaybe<Scalars['String']['input']>;
  collateralToken_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_contains?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_starts_with?: InputMaybe<Scalars['String']['input']>;
  collateralToken_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_ends_with?: InputMaybe<Scalars['String']['input']>;
  collateralToken_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken?: InputMaybe<Scalars['String']['input']>;
  debtToken_not?: InputMaybe<Scalars['String']['input']>;
  debtToken_gt?: InputMaybe<Scalars['String']['input']>;
  debtToken_lt?: InputMaybe<Scalars['String']['input']>;
  debtToken_gte?: InputMaybe<Scalars['String']['input']>;
  debtToken_lte?: InputMaybe<Scalars['String']['input']>;
  debtToken_in?: InputMaybe<Array<Scalars['String']['input']>>;
  debtToken_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  debtToken_contains?: InputMaybe<Scalars['String']['input']>;
  debtToken_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_contains?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_starts_with?: InputMaybe<Scalars['String']['input']>;
  debtToken_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_ends_with?: InputMaybe<Scalars['String']['input']>;
  debtToken_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  leverageTier?: InputMaybe<Scalars['String']['input']>;
  leverageTier_not?: InputMaybe<Scalars['String']['input']>;
  leverageTier_gt?: InputMaybe<Scalars['String']['input']>;
  leverageTier_lt?: InputMaybe<Scalars['String']['input']>;
  leverageTier_gte?: InputMaybe<Scalars['String']['input']>;
  leverageTier_lte?: InputMaybe<Scalars['String']['input']>;
  leverageTier_in?: InputMaybe<Array<Scalars['String']['input']>>;
  leverageTier_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  leverageTier_contains?: InputMaybe<Scalars['String']['input']>;
  leverageTier_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  leverageTier_not_contains?: InputMaybe<Scalars['String']['input']>;
  leverageTier_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  leverageTier_starts_with?: InputMaybe<Scalars['String']['input']>;
  leverageTier_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  leverageTier_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  leverageTier_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  leverageTier_ends_with?: InputMaybe<Scalars['String']['input']>;
  leverageTier_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  leverageTier_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  leverageTier_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultId?: InputMaybe<Scalars['String']['input']>;
  vaultId_not?: InputMaybe<Scalars['String']['input']>;
  vaultId_gt?: InputMaybe<Scalars['String']['input']>;
  vaultId_lt?: InputMaybe<Scalars['String']['input']>;
  vaultId_gte?: InputMaybe<Scalars['String']['input']>;
  vaultId_lte?: InputMaybe<Scalars['String']['input']>;
  vaultId_in?: InputMaybe<Array<Scalars['String']['input']>>;
  vaultId_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  vaultId_contains?: InputMaybe<Scalars['String']['input']>;
  vaultId_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultId_not_contains?: InputMaybe<Scalars['String']['input']>;
  vaultId_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultId_starts_with?: InputMaybe<Scalars['String']['input']>;
  vaultId_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  vaultId_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultId_ends_with?: InputMaybe<Scalars['String']['input']>;
  vaultId_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  vaultId_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<UserPosition_filter>>>;
  or?: InputMaybe<Array<InputMaybe<UserPosition_filter>>>;
};

export type UserPosition_orderBy =
  | 'id'
  | 'balance'
  | 'positionDecimals'
  | 'APE'
  | 'user'
  | 'collateralSymbol'
  | 'debtSymbol'
  | 'collateralToken'
  | 'debtToken'
  | 'leverageTier'
  | 'vaultId';

export type Vault = {
  id: Scalars['String']['output'];
  vaultId: Scalars['String']['output'];
  collateralToken: Scalars['String']['output'];
  debtToken: Scalars['String']['output'];
  collateralSymbol: Scalars['String']['output'];
  debtSymbol: Scalars['String']['output'];
  leverageTier: Scalars['Int']['output'];
  totalValue: Scalars['BigInt']['output'];
  lockedLiquidity: Scalars['BigInt']['output'];
  totalTea: Scalars['BigInt']['output'];
  apeCollateral: Scalars['BigInt']['output'];
  teaCollateral: Scalars['BigInt']['output'];
  taxAmount: Scalars['BigInt']['output'];
  apeAddress: Scalars['Bytes']['output'];
  apeDecimals: Scalars['Int']['output'];
};

export type Vault_filter = {
  id?: InputMaybe<Scalars['String']['input']>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_gt?: InputMaybe<Scalars['String']['input']>;
  id_lt?: InputMaybe<Scalars['String']['input']>;
  id_gte?: InputMaybe<Scalars['String']['input']>;
  id_lte?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<Scalars['String']['input']>>;
  id_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultId?: InputMaybe<Scalars['String']['input']>;
  vaultId_not?: InputMaybe<Scalars['String']['input']>;
  vaultId_gt?: InputMaybe<Scalars['String']['input']>;
  vaultId_lt?: InputMaybe<Scalars['String']['input']>;
  vaultId_gte?: InputMaybe<Scalars['String']['input']>;
  vaultId_lte?: InputMaybe<Scalars['String']['input']>;
  vaultId_in?: InputMaybe<Array<Scalars['String']['input']>>;
  vaultId_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  vaultId_contains?: InputMaybe<Scalars['String']['input']>;
  vaultId_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultId_not_contains?: InputMaybe<Scalars['String']['input']>;
  vaultId_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultId_starts_with?: InputMaybe<Scalars['String']['input']>;
  vaultId_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  vaultId_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultId_ends_with?: InputMaybe<Scalars['String']['input']>;
  vaultId_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  vaultId_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not?: InputMaybe<Scalars['String']['input']>;
  collateralToken_gt?: InputMaybe<Scalars['String']['input']>;
  collateralToken_lt?: InputMaybe<Scalars['String']['input']>;
  collateralToken_gte?: InputMaybe<Scalars['String']['input']>;
  collateralToken_lte?: InputMaybe<Scalars['String']['input']>;
  collateralToken_in?: InputMaybe<Array<Scalars['String']['input']>>;
  collateralToken_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  collateralToken_contains?: InputMaybe<Scalars['String']['input']>;
  collateralToken_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_contains?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_starts_with?: InputMaybe<Scalars['String']['input']>;
  collateralToken_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_ends_with?: InputMaybe<Scalars['String']['input']>;
  collateralToken_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  collateralToken_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken?: InputMaybe<Scalars['String']['input']>;
  debtToken_not?: InputMaybe<Scalars['String']['input']>;
  debtToken_gt?: InputMaybe<Scalars['String']['input']>;
  debtToken_lt?: InputMaybe<Scalars['String']['input']>;
  debtToken_gte?: InputMaybe<Scalars['String']['input']>;
  debtToken_lte?: InputMaybe<Scalars['String']['input']>;
  debtToken_in?: InputMaybe<Array<Scalars['String']['input']>>;
  debtToken_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  debtToken_contains?: InputMaybe<Scalars['String']['input']>;
  debtToken_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_contains?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_starts_with?: InputMaybe<Scalars['String']['input']>;
  debtToken_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_ends_with?: InputMaybe<Scalars['String']['input']>;
  debtToken_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  debtToken_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_gt?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_lt?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_gte?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_lte?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_in?: InputMaybe<Array<Scalars['String']['input']>>;
  collateralSymbol_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  collateralSymbol_contains?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not_contains?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_starts_with?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_ends_with?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  collateralSymbol_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtSymbol?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_gt?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_lt?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_gte?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_lte?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_in?: InputMaybe<Array<Scalars['String']['input']>>;
  debtSymbol_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  debtSymbol_contains?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not_contains?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_starts_with?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_ends_with?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  debtSymbol_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  leverageTier?: InputMaybe<Scalars['Int']['input']>;
  leverageTier_not?: InputMaybe<Scalars['Int']['input']>;
  leverageTier_gt?: InputMaybe<Scalars['Int']['input']>;
  leverageTier_lt?: InputMaybe<Scalars['Int']['input']>;
  leverageTier_gte?: InputMaybe<Scalars['Int']['input']>;
  leverageTier_lte?: InputMaybe<Scalars['Int']['input']>;
  leverageTier_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  leverageTier_not_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  totalValue?: InputMaybe<Scalars['BigInt']['input']>;
  totalValue_not?: InputMaybe<Scalars['BigInt']['input']>;
  totalValue_gt?: InputMaybe<Scalars['BigInt']['input']>;
  totalValue_lt?: InputMaybe<Scalars['BigInt']['input']>;
  totalValue_gte?: InputMaybe<Scalars['BigInt']['input']>;
  totalValue_lte?: InputMaybe<Scalars['BigInt']['input']>;
  totalValue_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalValue_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lockedLiquidity?: InputMaybe<Scalars['BigInt']['input']>;
  lockedLiquidity_not?: InputMaybe<Scalars['BigInt']['input']>;
  lockedLiquidity_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lockedLiquidity_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lockedLiquidity_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lockedLiquidity_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lockedLiquidity_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  lockedLiquidity_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalTea?: InputMaybe<Scalars['BigInt']['input']>;
  totalTea_not?: InputMaybe<Scalars['BigInt']['input']>;
  totalTea_gt?: InputMaybe<Scalars['BigInt']['input']>;
  totalTea_lt?: InputMaybe<Scalars['BigInt']['input']>;
  totalTea_gte?: InputMaybe<Scalars['BigInt']['input']>;
  totalTea_lte?: InputMaybe<Scalars['BigInt']['input']>;
  totalTea_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalTea_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  apeCollateral?: InputMaybe<Scalars['BigInt']['input']>;
  apeCollateral_not?: InputMaybe<Scalars['BigInt']['input']>;
  apeCollateral_gt?: InputMaybe<Scalars['BigInt']['input']>;
  apeCollateral_lt?: InputMaybe<Scalars['BigInt']['input']>;
  apeCollateral_gte?: InputMaybe<Scalars['BigInt']['input']>;
  apeCollateral_lte?: InputMaybe<Scalars['BigInt']['input']>;
  apeCollateral_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  apeCollateral_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  teaCollateral?: InputMaybe<Scalars['BigInt']['input']>;
  teaCollateral_not?: InputMaybe<Scalars['BigInt']['input']>;
  teaCollateral_gt?: InputMaybe<Scalars['BigInt']['input']>;
  teaCollateral_lt?: InputMaybe<Scalars['BigInt']['input']>;
  teaCollateral_gte?: InputMaybe<Scalars['BigInt']['input']>;
  teaCollateral_lte?: InputMaybe<Scalars['BigInt']['input']>;
  teaCollateral_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  teaCollateral_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  taxAmount?: InputMaybe<Scalars['BigInt']['input']>;
  taxAmount_not?: InputMaybe<Scalars['BigInt']['input']>;
  taxAmount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  taxAmount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  taxAmount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  taxAmount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  taxAmount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  taxAmount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  apeAddress?: InputMaybe<Scalars['Bytes']['input']>;
  apeAddress_not?: InputMaybe<Scalars['Bytes']['input']>;
  apeAddress_gt?: InputMaybe<Scalars['Bytes']['input']>;
  apeAddress_lt?: InputMaybe<Scalars['Bytes']['input']>;
  apeAddress_gte?: InputMaybe<Scalars['Bytes']['input']>;
  apeAddress_lte?: InputMaybe<Scalars['Bytes']['input']>;
  apeAddress_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  apeAddress_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  apeAddress_contains?: InputMaybe<Scalars['Bytes']['input']>;
  apeAddress_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  apeDecimals?: InputMaybe<Scalars['Int']['input']>;
  apeDecimals_not?: InputMaybe<Scalars['Int']['input']>;
  apeDecimals_gt?: InputMaybe<Scalars['Int']['input']>;
  apeDecimals_lt?: InputMaybe<Scalars['Int']['input']>;
  apeDecimals_gte?: InputMaybe<Scalars['Int']['input']>;
  apeDecimals_lte?: InputMaybe<Scalars['Int']['input']>;
  apeDecimals_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  apeDecimals_not_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Vault_filter>>>;
  or?: InputMaybe<Array<InputMaybe<Vault_filter>>>;
};

export type Vault_orderBy =
  | 'id'
  | 'vaultId'
  | 'collateralToken'
  | 'debtToken'
  | 'collateralSymbol'
  | 'debtSymbol'
  | 'leverageTier'
  | 'totalValue'
  | 'lockedLiquidity'
  | 'totalTea'
  | 'apeCollateral'
  | 'teaCollateral'
  | 'taxAmount'
  | 'apeAddress'
  | 'apeDecimals';

export type _Block_ = {
  /** The hash of the block */
  hash?: Maybe<Scalars['Bytes']['output']>;
  /** The block number */
  number: Scalars['Int']['output'];
  /** Integer representation of the timestamp stored in blocks for the chain */
  timestamp?: Maybe<Scalars['Int']['output']>;
  /** The hash of the parent block */
  parentHash?: Maybe<Scalars['Bytes']['output']>;
};

/** The type for the top-level _meta field */
export type _Meta_ = {
  /**
   * Information about a specific subgraph block. The hash of the block
   * will be null if the _meta field has a block constraint that asks for
   * a block number. It will be filled if the _meta field has no block constraint
   * and therefore asks for the latest  block
   *
   */
  block: _Block_;
  /** The deployment ID */
  deployment: Scalars['String']['output'];
  /** If `true`, the subgraph encountered indexing errors at some past block */
  hasIndexingErrors: Scalars['Boolean']['output'];
};

export type _SubgraphErrorPolicy_ =
  /** Data will be returned even if the subgraph has indexing errors */
  | 'allow'
  /** If the subgraph has indexing errors, data will be omitted. The default. */
  | 'deny';

  export type QuerySdk = {
      /** null **/
  vault: InContextSdkMethod<Query['vault'], QueryvaultArgs, MeshContext>,
  /** null **/
  vaults: InContextSdkMethod<Query['vaults'], QueryvaultsArgs, MeshContext>,
  /** null **/
  test: InContextSdkMethod<Query['test'], QuerytestArgs, MeshContext>,
  /** null **/
  tests: InContextSdkMethod<Query['tests'], QuerytestsArgs, MeshContext>,
  /** null **/
  userPosition: InContextSdkMethod<Query['userPosition'], QueryuserPositionArgs, MeshContext>,
  /** null **/
  userPositions: InContextSdkMethod<Query['userPositions'], QueryuserPositionsArgs, MeshContext>,
  /** null **/
  userPositionTea: InContextSdkMethod<Query['userPositionTea'], QueryuserPositionTeaArgs, MeshContext>,
  /** null **/
  userPositionTeas: InContextSdkMethod<Query['userPositionTeas'], QueryuserPositionTeasArgs, MeshContext>,
  /** null **/
  dividends: InContextSdkMethod<Query['dividends'], QuerydividendsArgs, MeshContext>,
  /** null **/
  dividends_collection: InContextSdkMethod<Query['dividends_collection'], Querydividends_collectionArgs, MeshContext>,
  /** Access to subgraph metadata **/
  _meta: InContextSdkMethod<Query['_meta'], Query_metaArgs, MeshContext>
  };

  export type MutationSdk = {
    
  };

  export type SubscriptionSdk = {
      /** null **/
  vault: InContextSdkMethod<Subscription['vault'], SubscriptionvaultArgs, MeshContext>,
  /** null **/
  vaults: InContextSdkMethod<Subscription['vaults'], SubscriptionvaultsArgs, MeshContext>,
  /** null **/
  test: InContextSdkMethod<Subscription['test'], SubscriptiontestArgs, MeshContext>,
  /** null **/
  tests: InContextSdkMethod<Subscription['tests'], SubscriptiontestsArgs, MeshContext>,
  /** null **/
  userPosition: InContextSdkMethod<Subscription['userPosition'], SubscriptionuserPositionArgs, MeshContext>,
  /** null **/
  userPositions: InContextSdkMethod<Subscription['userPositions'], SubscriptionuserPositionsArgs, MeshContext>,
  /** null **/
  userPositionTea: InContextSdkMethod<Subscription['userPositionTea'], SubscriptionuserPositionTeaArgs, MeshContext>,
  /** null **/
  userPositionTeas: InContextSdkMethod<Subscription['userPositionTeas'], SubscriptionuserPositionTeasArgs, MeshContext>,
  /** null **/
  dividends: InContextSdkMethod<Subscription['dividends'], SubscriptiondividendsArgs, MeshContext>,
  /** null **/
  dividends_collection: InContextSdkMethod<Subscription['dividends_collection'], Subscriptiondividends_collectionArgs, MeshContext>,
  /** Access to subgraph metadata **/
  _meta: InContextSdkMethod<Subscription['_meta'], Subscription_metaArgs, MeshContext>
  };

  export type Context = {
      ["sir-trade/index"]: { Query: QuerySdk, Mutation: MutationSdk, Subscription: SubscriptionSdk },
      
    };
}
