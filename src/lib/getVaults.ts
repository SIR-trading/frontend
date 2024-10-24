import { kv } from "@vercel/kv";
import { createHash, randomInt } from "crypto";
import { readContract } from "./viemClient";
import { AssistantContract } from "@/contracts/assistant";
import type {
  TCollateral,
  TVaults,
  TCollateralResp,
  VaultFieldFragment,
} from "./types";
import { executeVaultsQuery } from "@/server/queries/vaults";
import { parseUnits } from "viem";

// export const revalidate = 6000;
const getVaults = async () => {
  const vaults = await executeVaultsQuery();
  const randomI = randomInt(1000);
  return { vaults, randomI };
};
const getCollateralAmounts = async (vaultIds: number[]) => {
  const result = await readContract({
    ...AssistantContract,
    functionName: "getReserves",
    args: [[...vaultIds]],
  });
  return result;
};
export const getVaultData = async (offset: number) => {
  let vaultQuery;

  const v = await getVaults();

  vaultQuery = v.vaults;
  // if (!vaults) {
  //   // Don't block with await only need for next cache
  //   kv.set("vaults", JSON.stringify(vaultQuery), { ex: 60 * 4 }).catch((e) => {
  //     console.log(e, "Failed to store in KV");
  //   });
  // } else {
  //   vaultQuery = vaults as { vaults: VaultFieldFragment[] };
  // }
  let pageVaults: VaultFieldFragment[] | undefined;
  if (isFinite(offset)) {
    pageVaults = vaultQuery?.vaults.slice(offset, offset + 10);
  } else {
    pageVaults = vaultQuery?.vaults;
  }
  const vaultIds = pageVaults?.map((v) => parseInt(v.vaultId));
  const vaultIdHash = createHash("md5")
    .update(JSON.stringify(vaultIds))
    .digest("hex");
  let collateral: TCollateral;
  const resp = await kv.get(vaultIdHash);

  if (resp) {
    collateral = (resp as TCollateralResp).map((c) => {
      return {
        reserveLPers: parseUnits(c.reserveLPers, 0),
        reserveApes: parseUnits(c.reserveApes, 0),
        tickPriceX42: parseUnits(c.tickPriceX42, 0),
      };
    });
  } else {
    collateral = await getCollateralAmounts(vaultIds ?? []);
  }

  kv.set(
    vaultIdHash,
    JSON.stringify(
      collateral.map((c) => ({
        ...c,
        reserveApes: c.reserveApes.toString(),
        reserveLPers: c.reserveLPers.toString(),
        tickPriceX42: c.tickPriceX42.toString(),
      })),
    ),
    {
      ex: 60 * 5,
    },
  ).catch((e) => {
    console.log("Error setting vaultIdHash", e);
  });

  vaultQuery = {
    vaults: vaultQuery?.vaults.map((v, i) => ({
      ...v,
      apeCollateral: collateral[i]?.reserveApes ?? 0n,
      teaCollateral: collateral[i]?.reserveLPers ?? 0n,
    })),
  } as TVaults;
  return { vaultQuery };
};
