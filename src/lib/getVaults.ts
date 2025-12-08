import { readContract } from "./viemClient";
import { AssistantContract } from "@/contracts/assistant";
import type { TCollateral, TVaults } from "./types";
import { executeVaultsQuery } from "@/server/queries/vaults";

const getVaults = async ({
  filterLeverage,
  filterCollateralToken,
  filterDebtToken,
  skip,
  first,
}: {
  filterLeverage?: string;
  skip?: number;
  first?: number;
  filterDebtToken?: string;
  filterCollateralToken?: string;
}) => {
  const result = await executeVaultsQuery({
    filterLeverage,
    filterCollateralToken,
    filterDebtToken,
    skip,
    first,
  });
  return result;
};
const getCollateralAmounts = async (vaultIds: number[]) => {
  if (vaultIds.length === 0) return [];
  const result = await readContract({
    ...AssistantContract,
    functionName: "getReserves",
    args: [[...vaultIds]],
  });
  return result;
};
export const getVaultsForTable = async (
  offset: number,
  filters?: {
    skip?: number;
    filterLeverage?: string;
    filterDebtToken?: string;
    filterCollateralToken?: string;
  },
) => {
  // Fetch all vaults (up to 300) for client-side pagination
  const v = await getVaults({
    filterLeverage: filters?.filterLeverage,
    filterDebtToken: filters?.filterDebtToken,
    filterCollateralToken: filters?.filterCollateralToken,
    // No skip or first - let it use the default 300 limit
  });

  const pageVaults = v.vaults;
  const vaultIds = pageVaults?.map((v) => parseInt(v.id));
  // const vaultIdHash = createHash("md5")
  //   .update(JSON.stringify(vaultIds))
  //   .digest("hex");
  let collateral: TCollateral;
  // const resp = await kv.get(vaultIdHash + "1");
  // Grab collteral
  if (false) {
    // collateral = (resp as TCollateralResp).map((c) => {
    //   return {
    //     reserveLPers: parseUnits(c.reserveLPers, 0),
    //     reserveApes: parseUnits(c.reserveApes, 0),
    //     tickPriceX42: parseUnits(c.tickPriceX42, 0),
    //   };
    // });
  } else {
    try {
      collateral = await getCollateralAmounts(vaultIds ?? []);
    } catch (e) {
      collateral = [];
      console.log(e);
    }
  }

  const vaultQuery = {
    vaults: pageVaults?.map((v, i) => ({
      ...v,
      reserveApes: (collateral[i]?.reserveApes ?? 0n).toString(),
      reserveLPers: (collateral[i]?.reserveLPers ?? 0n).toString(),
    })) ?? [],
  } as TVaults;
  return { vaultQuery };
};
