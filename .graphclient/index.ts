// @ts-nocheck
import { GraphQLResolveInfo, SelectionSetNode, FieldNode, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
import { gql } from '@graphql-mesh/utils';

import type { GetMeshOptions } from '@graphql-mesh/runtime';
import type { YamlConfig } from '@graphql-mesh/types';
import { PubSub } from '@graphql-mesh/utils';
import { DefaultLogger } from '@graphql-mesh/utils';
import MeshCache from "@graphql-mesh/cache-localforage";
import { fetch as fetchFn } from '@whatwg-node/fetch';

import { MeshResolvedSource } from '@graphql-mesh/runtime';
import { MeshTransform, MeshPlugin } from '@graphql-mesh/types';
import GraphqlHandler from "@graphql-mesh/graphql"
import BareMerger from "@graphql-mesh/merger-bare";
import { printWithCache } from '@graphql-mesh/utils';
import { usePersistedOperations } from '@graphql-yoga/plugin-persisted-operations';
import { createMeshHTTPHandler, MeshHTTPHandler } from '@graphql-mesh/http';
import { getMesh, ExecuteMeshFn, SubscribeMeshFn, MeshContext as BaseMeshContext, MeshInstance } from '@graphql-mesh/runtime';
import { MeshStore, FsStoreStorageAdapter } from '@graphql-mesh/store';
import { path as pathModule } from '@graphql-mesh/cross-helpers';
import { ImportFn } from '@graphql-mesh/types';
import type { SirTradeIndexTypes } from './sources/sir-trade/index/types';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };



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

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type LegacyStitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type NewStitchingResolver<TResult, TParent, TContext, TArgs> = {
  selectionSet: string | ((fieldNode: FieldNode) => SelectionSetNode);
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type StitchingResolver<TResult, TParent, TContext, TArgs> = LegacyStitchingResolver<TResult, TParent, TContext, TArgs> | NewStitchingResolver<TResult, TParent, TContext, TArgs>;
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Aggregation_interval: Aggregation_interval;
  BigDecimal: ResolverTypeWrapper<Scalars['BigDecimal']['output']>;
  BigInt: ResolverTypeWrapper<Scalars['BigInt']['output']>;
  BlockChangedFilter: BlockChangedFilter;
  Block_height: Block_height;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Bytes: ResolverTypeWrapper<Scalars['Bytes']['output']>;
  Dividends: ResolverTypeWrapper<Dividends>;
  Dividends_filter: Dividends_filter;
  Dividends_orderBy: Dividends_orderBy;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Int8: ResolverTypeWrapper<Scalars['Int8']['output']>;
  OrderDirection: OrderDirection;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<{}>;
  Test: ResolverTypeWrapper<Test>;
  Test_filter: Test_filter;
  Test_orderBy: Test_orderBy;
  Timestamp: ResolverTypeWrapper<Scalars['Timestamp']['output']>;
  UserPosition: ResolverTypeWrapper<UserPosition>;
  UserPositionTea: ResolverTypeWrapper<UserPositionTea>;
  UserPositionTea_filter: UserPositionTea_filter;
  UserPositionTea_orderBy: UserPositionTea_orderBy;
  UserPosition_filter: UserPosition_filter;
  UserPosition_orderBy: UserPosition_orderBy;
  Vault: ResolverTypeWrapper<Vault>;
  Vault_filter: Vault_filter;
  Vault_orderBy: Vault_orderBy;
  _Block_: ResolverTypeWrapper<_Block_>;
  _Meta_: ResolverTypeWrapper<_Meta_>;
  _SubgraphErrorPolicy_: _SubgraphErrorPolicy_;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  BigDecimal: Scalars['BigDecimal']['output'];
  BigInt: Scalars['BigInt']['output'];
  BlockChangedFilter: BlockChangedFilter;
  Block_height: Block_height;
  Boolean: Scalars['Boolean']['output'];
  Bytes: Scalars['Bytes']['output'];
  Dividends: Dividends;
  Dividends_filter: Dividends_filter;
  Float: Scalars['Float']['output'];
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Int8: Scalars['Int8']['output'];
  Query: {};
  String: Scalars['String']['output'];
  Subscription: {};
  Test: Test;
  Test_filter: Test_filter;
  Timestamp: Scalars['Timestamp']['output'];
  UserPosition: UserPosition;
  UserPositionTea: UserPositionTea;
  UserPositionTea_filter: UserPositionTea_filter;
  UserPosition_filter: UserPosition_filter;
  Vault: Vault;
  Vault_filter: Vault_filter;
  _Block_: _Block_;
  _Meta_: _Meta_;
}>;

export type entityDirectiveArgs = { };

export type entityDirectiveResolver<Result, Parent, ContextType = MeshContext, Args = entityDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type subgraphIdDirectiveArgs = {
  id: Scalars['String']['input'];
};

export type subgraphIdDirectiveResolver<Result, Parent, ContextType = MeshContext, Args = subgraphIdDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type derivedFromDirectiveArgs = {
  field: Scalars['String']['input'];
};

export type derivedFromDirectiveResolver<Result, Parent, ContextType = MeshContext, Args = derivedFromDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export interface BigDecimalScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['BigDecimal'], any> {
  name: 'BigDecimal';
}

export interface BigIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['BigInt'], any> {
  name: 'BigInt';
}

export interface BytesScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Bytes'], any> {
  name: 'Bytes';
}

export type DividendsResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['Dividends'] = ResolversParentTypes['Dividends']> = ResolversObject<{
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  ethAmount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  stakedAmount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface Int8ScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Int8'], any> {
  name: 'Int8';
}

export type QueryResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  vault?: Resolver<Maybe<ResolversTypes['Vault']>, ParentType, ContextType, RequireFields<QueryvaultArgs, 'id' | 'subgraphError'>>;
  vaults?: Resolver<Array<ResolversTypes['Vault']>, ParentType, ContextType, RequireFields<QueryvaultsArgs, 'skip' | 'first' | 'subgraphError'>>;
  test?: Resolver<Maybe<ResolversTypes['Test']>, ParentType, ContextType, RequireFields<QuerytestArgs, 'id' | 'subgraphError'>>;
  tests?: Resolver<Array<ResolversTypes['Test']>, ParentType, ContextType, RequireFields<QuerytestsArgs, 'skip' | 'first' | 'subgraphError'>>;
  userPosition?: Resolver<Maybe<ResolversTypes['UserPosition']>, ParentType, ContextType, RequireFields<QueryuserPositionArgs, 'id' | 'subgraphError'>>;
  userPositions?: Resolver<Array<ResolversTypes['UserPosition']>, ParentType, ContextType, RequireFields<QueryuserPositionsArgs, 'skip' | 'first' | 'subgraphError'>>;
  userPositionTea?: Resolver<Maybe<ResolversTypes['UserPositionTea']>, ParentType, ContextType, RequireFields<QueryuserPositionTeaArgs, 'id' | 'subgraphError'>>;
  userPositionTeas?: Resolver<Array<ResolversTypes['UserPositionTea']>, ParentType, ContextType, RequireFields<QueryuserPositionTeasArgs, 'skip' | 'first' | 'subgraphError'>>;
  dividends?: Resolver<Maybe<ResolversTypes['Dividends']>, ParentType, ContextType, RequireFields<QuerydividendsArgs, 'id' | 'subgraphError'>>;
  dividends_collection?: Resolver<Array<ResolversTypes['Dividends']>, ParentType, ContextType, RequireFields<Querydividends_collectionArgs, 'skip' | 'first' | 'subgraphError'>>;
  _meta?: Resolver<Maybe<ResolversTypes['_Meta_']>, ParentType, ContextType, Partial<Query_metaArgs>>;
}>;

export type SubscriptionResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = ResolversObject<{
  vault?: SubscriptionResolver<Maybe<ResolversTypes['Vault']>, "vault", ParentType, ContextType, RequireFields<SubscriptionvaultArgs, 'id' | 'subgraphError'>>;
  vaults?: SubscriptionResolver<Array<ResolversTypes['Vault']>, "vaults", ParentType, ContextType, RequireFields<SubscriptionvaultsArgs, 'skip' | 'first' | 'subgraphError'>>;
  test?: SubscriptionResolver<Maybe<ResolversTypes['Test']>, "test", ParentType, ContextType, RequireFields<SubscriptiontestArgs, 'id' | 'subgraphError'>>;
  tests?: SubscriptionResolver<Array<ResolversTypes['Test']>, "tests", ParentType, ContextType, RequireFields<SubscriptiontestsArgs, 'skip' | 'first' | 'subgraphError'>>;
  userPosition?: SubscriptionResolver<Maybe<ResolversTypes['UserPosition']>, "userPosition", ParentType, ContextType, RequireFields<SubscriptionuserPositionArgs, 'id' | 'subgraphError'>>;
  userPositions?: SubscriptionResolver<Array<ResolversTypes['UserPosition']>, "userPositions", ParentType, ContextType, RequireFields<SubscriptionuserPositionsArgs, 'skip' | 'first' | 'subgraphError'>>;
  userPositionTea?: SubscriptionResolver<Maybe<ResolversTypes['UserPositionTea']>, "userPositionTea", ParentType, ContextType, RequireFields<SubscriptionuserPositionTeaArgs, 'id' | 'subgraphError'>>;
  userPositionTeas?: SubscriptionResolver<Array<ResolversTypes['UserPositionTea']>, "userPositionTeas", ParentType, ContextType, RequireFields<SubscriptionuserPositionTeasArgs, 'skip' | 'first' | 'subgraphError'>>;
  dividends?: SubscriptionResolver<Maybe<ResolversTypes['Dividends']>, "dividends", ParentType, ContextType, RequireFields<SubscriptiondividendsArgs, 'id' | 'subgraphError'>>;
  dividends_collection?: SubscriptionResolver<Array<ResolversTypes['Dividends']>, "dividends_collection", ParentType, ContextType, RequireFields<Subscriptiondividends_collectionArgs, 'skip' | 'first' | 'subgraphError'>>;
  _meta?: SubscriptionResolver<Maybe<ResolversTypes['_Meta_']>, "_meta", ParentType, ContextType, Partial<Subscription_metaArgs>>;
}>;

export type TestResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['Test'] = ResolversParentTypes['Test']> = ResolversObject<{
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  amount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface TimestampScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Timestamp'], any> {
  name: 'Timestamp';
}

export type UserPositionResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['UserPosition'] = ResolversParentTypes['UserPosition']> = ResolversObject<{
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  balance?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  positionDecimals?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  APE?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  collateralSymbol?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  debtSymbol?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  collateralToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  debtToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  leverageTier?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  vaultId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserPositionTeaResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['UserPositionTea'] = ResolversParentTypes['UserPositionTea']> = ResolversObject<{
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  positionDecimals?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  balance?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  collateralSymbol?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  debtSymbol?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  collateralToken?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  debtToken?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  leverageTier?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  vaultId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VaultResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['Vault'] = ResolversParentTypes['Vault']> = ResolversObject<{
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  vaultId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  collateralToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  debtToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  collateralSymbol?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  debtSymbol?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  leverageTier?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalValue?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  lockedLiquidity?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  totalTea?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  apeCollateral?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  teaCollateral?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  taxAmount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  apeAddress?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  apeDecimals?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type _Block_Resolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['_Block_'] = ResolversParentTypes['_Block_']> = ResolversObject<{
  hash?: Resolver<Maybe<ResolversTypes['Bytes']>, ParentType, ContextType>;
  number?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  timestamp?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  parentHash?: Resolver<Maybe<ResolversTypes['Bytes']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type _Meta_Resolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['_Meta_'] = ResolversParentTypes['_Meta_']> = ResolversObject<{
  block?: Resolver<ResolversTypes['_Block_'], ParentType, ContextType>;
  deployment?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hasIndexingErrors?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = MeshContext> = ResolversObject<{
  BigDecimal?: GraphQLScalarType;
  BigInt?: GraphQLScalarType;
  Bytes?: GraphQLScalarType;
  Dividends?: DividendsResolvers<ContextType>;
  Int8?: GraphQLScalarType;
  Query?: QueryResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Test?: TestResolvers<ContextType>;
  Timestamp?: GraphQLScalarType;
  UserPosition?: UserPositionResolvers<ContextType>;
  UserPositionTea?: UserPositionTeaResolvers<ContextType>;
  Vault?: VaultResolvers<ContextType>;
  _Block_?: _Block_Resolvers<ContextType>;
  _Meta_?: _Meta_Resolvers<ContextType>;
}>;

export type DirectiveResolvers<ContextType = MeshContext> = ResolversObject<{
  entity?: entityDirectiveResolver<any, any, ContextType>;
  subgraphId?: subgraphIdDirectiveResolver<any, any, ContextType>;
  derivedFrom?: derivedFromDirectiveResolver<any, any, ContextType>;
}>;

export type MeshContext = SirTradeIndexTypes.Context & BaseMeshContext;


import { fileURLToPath } from '@graphql-mesh/utils';
const baseDir = pathModule.join(pathModule.dirname(fileURLToPath(import.meta.url)), '..');

const importFn: ImportFn = <T>(moduleId: string) => {
  const relativeModuleId = (pathModule.isAbsolute(moduleId) ? pathModule.relative(baseDir, moduleId) : moduleId).split('\\').join('/').replace(baseDir + '/', '');
  switch(relativeModuleId) {
    default:
      return Promise.reject(new Error(`Cannot find module '${relativeModuleId}'.`));
  }
};

const rootStore = new MeshStore('.graphclient', new FsStoreStorageAdapter({
  cwd: baseDir,
  importFn,
  fileType: "ts",
}), {
  readonly: true,
  validate: false
});

export const rawServeConfig: YamlConfig.Config['serve'] = undefined as any
export async function getMeshOptions(): Promise<GetMeshOptions> {
const pubsub = new PubSub();
const sourcesStore = rootStore.child('sources');
const logger = new DefaultLogger("GraphClient");
const cache = new (MeshCache as any)({
      ...({} as any),
      importFn,
      store: rootStore.child('cache'),
      pubsub,
      logger,
    } as any)

const sources: MeshResolvedSource[] = [];
const transforms: MeshTransform[] = [];
const additionalEnvelopPlugins: MeshPlugin<any>[] = [];
const sirTradeIndexTransforms = [];
const additionalTypeDefs = [] as any[];
const sirTradeIndexHandler = new GraphqlHandler({
              name: "sir-trade/index",
              config: {"endpoint":"http://140.82.62.189:8000/subgraphs/name/sir-trade/index"},
              baseDir,
              cache,
              pubsub,
              store: sourcesStore.child("sir-trade/index"),
              logger: logger.child("sir-trade/index"),
              importFn,
            });
sources[0] = {
          name: 'sir-trade/index',
          handler: sirTradeIndexHandler,
          transforms: sirTradeIndexTransforms
        }
const additionalResolvers = [] as any[]
const merger = new(BareMerger as any)({
        cache,
        pubsub,
        logger: logger.child('bareMerger'),
        store: rootStore.child('bareMerger')
      })
const documentHashMap = {
        "92e48b570ace24a0a339f0cece586f9ba41be2b83bfae712347b7a7f68cbb659": VaultQueryDocument,
"847baafaf71cab69f2034d36ea3d450625cbc642e815dc3cafcb2e15adaf2c98": GetUserApePositionsDocument,
"44d4baf9d98548b7b68d7c43e62f1e8815657ff7922d619657c772209344fb0b": GetUserTeaPositionsDocument
      }
additionalEnvelopPlugins.push(usePersistedOperations({
        getPersistedOperation(key) {
          return documentHashMap[key];
        },
        ...{}
      }))

  return {
    sources,
    transforms,
    additionalTypeDefs,
    additionalResolvers,
    cache,
    pubsub,
    merger,
    logger,
    additionalEnvelopPlugins,
    get documents() {
      return [
      {
        document: VaultQueryDocument,
        get rawSDL() {
          return printWithCache(VaultQueryDocument);
        },
        location: 'VaultQueryDocument.graphql',
        sha256Hash: '92e48b570ace24a0a339f0cece586f9ba41be2b83bfae712347b7a7f68cbb659'
      },{
        document: GetUserApePositionsDocument,
        get rawSDL() {
          return printWithCache(GetUserApePositionsDocument);
        },
        location: 'GetUserApePositionsDocument.graphql',
        sha256Hash: '847baafaf71cab69f2034d36ea3d450625cbc642e815dc3cafcb2e15adaf2c98'
      },{
        document: GetUserTeaPositionsDocument,
        get rawSDL() {
          return printWithCache(GetUserTeaPositionsDocument);
        },
        location: 'GetUserTeaPositionsDocument.graphql',
        sha256Hash: '44d4baf9d98548b7b68d7c43e62f1e8815657ff7922d619657c772209344fb0b'
      }
    ];
    },
    fetchFn,
  };
}

export function createBuiltMeshHTTPHandler<TServerContext = {}>(): MeshHTTPHandler<TServerContext> {
  return createMeshHTTPHandler<TServerContext>({
    baseDir,
    getBuiltMesh: getBuiltGraphClient,
    rawServeConfig: undefined,
  })
}


let meshInstance$: Promise<MeshInstance> | undefined;

export const pollingInterval = null;

export function getBuiltGraphClient(): Promise<MeshInstance> {
  if (meshInstance$ == null) {
    if (pollingInterval) {
      setInterval(() => {
        getMeshOptions()
        .then(meshOptions => getMesh(meshOptions))
        .then(newMesh =>
          meshInstance$.then(oldMesh => {
            oldMesh.destroy()
            meshInstance$ = Promise.resolve(newMesh)
          })
        ).catch(err => {
          console.error("Mesh polling failed so the existing version will be used:", err);
        });
      }, pollingInterval)
    }
    meshInstance$ = getMeshOptions().then(meshOptions => getMesh(meshOptions)).then(mesh => {
      const id = mesh.pubsub.subscribe('destroy', () => {
        meshInstance$ = undefined;
        mesh.pubsub.unsubscribe(id);
      });
      return mesh;
    });
  }
  return meshInstance$;
}

export const execute: ExecuteMeshFn = (...args) => getBuiltGraphClient().then(({ execute }) => execute(...args));

export const subscribe: SubscribeMeshFn = (...args) => getBuiltGraphClient().then(({ subscribe }) => subscribe(...args));
export function getBuiltGraphSDK<TGlobalContext = any, TOperationContext = any>(globalContext?: TGlobalContext) {
  const sdkRequester$ = getBuiltGraphClient().then(({ sdkRequesterFactory }) => sdkRequesterFactory(globalContext));
  return getSdk<TOperationContext, TGlobalContext>((...args) => sdkRequester$.then(sdkRequester => sdkRequester(...args)));
}
export type VaultFieldsFragment = Pick<Vault, 'debtToken' | 'apeDecimals' | 'debtSymbol' | 'collateralToken' | 'collateralSymbol' | 'vaultId' | 'leverageTier' | 'totalTea' | 'totalValue' | 'lockedLiquidity' | 'apeAddress' | 'taxAmount' | 'apeCollateral' | 'teaCollateral' | 'id'>;

export type VaultQueryQueryVariables = Exact<{
  collateralToken?: InputMaybe<Scalars['String']['input']>;
  debtToken?: InputMaybe<Scalars['String']['input']>;
  leverageTier?: InputMaybe<Scalars['Int']['input']>;
  lastId?: InputMaybe<Scalars['String']['input']>;
}>;


export type VaultQueryQuery = { vaults: Array<Pick<Vault, 'debtToken' | 'apeDecimals' | 'debtSymbol' | 'collateralToken' | 'collateralSymbol' | 'vaultId' | 'leverageTier' | 'totalTea' | 'totalValue' | 'lockedLiquidity' | 'apeAddress' | 'taxAmount' | 'apeCollateral' | 'teaCollateral' | 'id'>> };

export type getUserApePositionsQueryVariables = Exact<{
  user?: InputMaybe<Scalars['Bytes']['input']>;
}>;


export type getUserApePositionsQuery = { userPositions: Array<Pick<UserPosition, 'user' | 'vaultId' | 'APE' | 'balance' | 'debtToken' | 'debtSymbol' | 'positionDecimals' | 'collateralToken' | 'collateralSymbol' | 'leverageTier'>> };

export type getUserTeaPositionsQueryVariables = Exact<{
  user?: InputMaybe<Scalars['Bytes']['input']>;
}>;


export type getUserTeaPositionsQuery = { userPositionTeas: Array<Pick<UserPositionTea, 'user' | 'vaultId' | 'balance' | 'positionDecimals' | 'debtToken' | 'debtSymbol' | 'collateralToken' | 'collateralSymbol' | 'leverageTier'>> };

export const VaultFieldsFragmentDoc = gql`
    fragment VaultFields on Vault {
  debtToken
  apeDecimals
  debtSymbol
  collateralToken
  collateralSymbol
  vaultId
  leverageTier
  totalTea
  totalValue
  lockedLiquidity
  apeAddress
  taxAmount
  apeDecimals
  apeCollateral
  teaCollateral
  id
}
    ` as unknown as DocumentNode<VaultFieldsFragment, unknown>;
export const VaultQueryDocument = gql`
    query VaultQuery($collateralToken: String, $debtToken: String, $leverageTier: Int, $lastId: String) {
  vaults(orderDirection: desc, first: 10, orderBy: totalValue) {
    ...VaultFields
  }
}
    ${VaultFieldsFragmentDoc}` as unknown as DocumentNode<VaultQueryQuery, VaultQueryQueryVariables>;
export const getUserApePositionsDocument = gql`
    query getUserApePositions($user: Bytes) {
  userPositions(where: {user: $user}) {
    user
    vaultId
    APE
    balance
    debtToken
    debtSymbol
    positionDecimals
    collateralToken
    collateralSymbol
    leverageTier
  }
}
    ` as unknown as DocumentNode<getUserApePositionsQuery, getUserApePositionsQueryVariables>;
export const getUserTeaPositionsDocument = gql`
    query getUserTeaPositions($user: Bytes) {
  userPositionTeas(where: {user: $user}) {
    user
    vaultId
    balance
    positionDecimals
    debtToken
    debtSymbol
    collateralToken
    collateralSymbol
    leverageTier
  }
}
    ` as unknown as DocumentNode<getUserTeaPositionsQuery, getUserTeaPositionsQueryVariables>;




export type Requester<C = {}, E = unknown> = <R, V>(doc: DocumentNode, vars?: V, options?: C) => Promise<R> | AsyncIterable<R>
export function getSdk<C, E>(requester: Requester<C, E>) {
  return {
    VaultQuery(variables?: VaultQueryQueryVariables, options?: C): Promise<VaultQueryQuery> {
      return requester<VaultQueryQuery, VaultQueryQueryVariables>(VaultQueryDocument, variables, options) as Promise<VaultQueryQuery>;
    },
    getUserApePositions(variables?: getUserApePositionsQueryVariables, options?: C): Promise<getUserApePositionsQuery> {
      return requester<getUserApePositionsQuery, getUserApePositionsQueryVariables>(getUserApePositionsDocument, variables, options) as Promise<getUserApePositionsQuery>;
    },
    getUserTeaPositions(variables?: getUserTeaPositionsQueryVariables, options?: C): Promise<getUserTeaPositionsQuery> {
      return requester<getUserTeaPositionsQuery, getUserTeaPositionsQueryVariables>(getUserTeaPositionsDocument, variables, options) as Promise<getUserTeaPositionsQuery>;
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;