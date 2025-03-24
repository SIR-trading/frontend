import { formatUnits } from "viem";
import { api } from "@/trpc/react";
import type { TUserPosition } from "@/server/queries/vaults";
export function useTeaAndApePrice({
  isApe,
  amount,
  row
}: {
  isApe: boolean,
  amount: string,
  row: TUserPosition
}) {

  const { data: quoteBurn } = api.vault.quoteBurn.useQuery(
    {
      amount: amount ?? "0",
      isApe,
      debtToken: row.debtToken,
      leverageTier: parseInt(row.leverageTier),
      collateralToken: row.collateralToken,
      decimals: row.positionDecimals,
    },
    {
      enabled: Boolean(amount),
    },
  );
  console.log("QUOTE__BURN__", quoteBurn);
  const formatted = formatUnits(quoteBurn ?? 0n, row.positionDecimals);
  const contractAddress: string = row.collateralToken ?? "";
  const { data: tokens } = api.price.getTokenPrice.useQuery(
    {
      contractAddress,
      chain: "eth-mainnet"
    },
    {
      enabled: Boolean(contractAddress)
    }
  )
  console.log("TOKEN", row.collateralToken)
  console.log("PRICE___", tokens)
  // Calculate the prices for both conversion directions.
  const collateralPrice = tokens?.data[0]?.prices[0]?.value
    ? Number(tokens.data[0].prices[0].value)
    : 0;
  /*
   const debtPrice = tokens?.data[1]?.prices[0]?.value
    ? Number(tokens.data[1].prices[0].value)
    : 0;
  */
  return Number(formatted) * collateralPrice;
}
