import { graphqlClient } from "@/lib/graphqlClient";
import type { VaultFieldFragment } from "@/lib/types";
import { gql } from "graphql-request";

const searchTokenVaults = (
  filterCollateral: boolean,
  filterDebt: boolean,
  filterLeverage: boolean,
  type: "debt" | "collateral",
) => {
  // I have to make where clase optional
  // very stupid to not have optional values default
  // Optional `where` clause fields
  const whereClauses = [];
  if (filterCollateral) whereClauses.push("collateralToken: $collateralToken");
  if (filterDebt) whereClauses.push("debtToken: $debtToken");
  if (filterLeverage) whereClauses.push("leverageTier: $leverageTier");
  if (type === "collateral") {
    whereClauses.push("collateralSymbol_contains: $search");
  } else {
    whereClauses.push("debtSymbol_contains: $search");
  }
  const whereClause =
    whereClauses.length > 0 ? `where: { ${whereClauses.join(", ")} }` : "";
  return gql`
  #graphql
  ${
    type === "collateral"
      ? `
  fragment VaultFields on Vault {
    collateralToken
    collateralSymbol
    vaultId
  }
  `
      : `
  fragment VaultFields on Vault {
    debtToken
    debtSymbol 
    vaultId
  }
  `
  }

  query VaultQuery($collateralToken: String, $debtToken: String, $leverageTier: Int, $search: String! ) {
    vaults(
      orderDirection: desc
      orderBy: totalValue
      
      ${whereClause}
    ) {
      ...VaultFields
    }
  }
`;
};

export const executeSearchVaultsQuery = async ({
  filterLeverage,
  filterDebtToken,
  filterCollateralToken,
  search,
  type,
}: {
  filterLeverage?: string;
  filterDebtToken?: string;
  filterCollateralToken?: string;
  search: string;
  type: "debt" | "collateral";
}) => {
  const result = await graphqlClient.request(
    searchTokenVaults(
      Boolean(filterCollateralToken),
      Boolean(filterDebtToken),
      Boolean(filterLeverage),
      type,
    ),
    {
      collateralToken: filterCollateralToken,
      debtToken: filterDebtToken,
      leverageTier: filterLeverage ? parseInt(filterLeverage) : undefined,
      search,
    },
  );
  return result as { vaults: VaultFieldFragment[] };
};
