import { graphqlClient } from "@/lib/graphqlClient";
import { gql } from "graphql-request";

export interface Fee {
  id: string;
  vaultId: string;
  timestamp: string;
  lpApy: string;
}

export interface FeesQueryResult {
  fees: Fee[];
}

const feesQuery = gql`
  query getVaultFees($vaultId: String!, $timestampThreshold: BigInt!) {
    fees(
      where: { 
        vaultId: $vaultId, 
        timestamp_gte: $timestampThreshold 
      }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      vaultId
      timestamp
      lpApy
    }
  }
`;

export const executeGetVaultFees = async ({
  vaultId,
  timestampThreshold,
}: {
  vaultId: string;
  timestampThreshold: string;
}) => {
  // Convert vaultId to 0x format if not already
  // Vault IDs in the subgraph are stored as simple hex values like 0xa for vault 10
  let formattedVaultId: string;
  if (vaultId.startsWith('0x')) {
    formattedVaultId = vaultId;
  } else {
    const hexValue = parseInt(vaultId).toString(16);
    formattedVaultId = `0x${hexValue}`;
  }
  
  console.log(`Fetching fees for vault: ${vaultId} -> formatted: ${formattedVaultId}, threshold: ${timestampThreshold}`);
  
  const result = await graphqlClient.request(feesQuery, {
    vaultId: formattedVaultId,
    timestampThreshold,
  });
  
  const typedResult = result as FeesQueryResult;
  
  console.log(`Fees result for vault ${formattedVaultId}:`, typedResult.fees.length, 'fees found');
  
  return typedResult;
};
