import { formatUnits, formatEther, parseEther, parseUnits } from "viem";
import { api } from "@/trpc/react";
import { EContracts, getAddress } from "@/lib/contractAddresses";
import { TokenDisplay } from "@/components/ui/token-display";

export function useSirToUsd({
  amount,
}: {
  amount: bigint | undefined,
}) {

  const contractAddress = getAddress(EContracts.SIR);
  const { data: tokens } = api.price.getTokenPrice.useQuery(
    {
      contractAddress,
      chain: "eth-mainnet"
    },
    {
      staleTime: 3000,
      enabled: Boolean(contractAddress)
    }
  )
  // Calculate the prices for both conversion directions.
  const collateralPrice = tokens?.data[0]?.prices[0]?.value
    ? parseEther(tokens.data[0].prices[0].value)
    : 1;
  /*
   const debtPrice = tokens?.data[1]?.prices[0]?.value
    ? Number(tokens.data[1].prices[0].value)
    : 0;
  */
  console.log("SIR_PRICE", "#".repeat(100), tokens, amount)
  if (!amount || amount < 1n) {
    return (<div>
      0
      <span className="ml-1">$</span>
    </div>)
  }
  else

    return (
      <div>
        <div><h2>price:</h2></div>
        <div>{collateralPrice}</div>
        <div>{formatUnits(amount, 12)}</div>
        <TokenDisplay
          amount={amount}
          decimals={12}
          unitLabel={"$"}
        />
      </div>)
}
