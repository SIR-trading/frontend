import { formatUnits, parseEther } from "viem";
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
      enabled: Boolean(contractAddress)
    }
  )
  // Calculate the prices for both conversion directions.
  const collateralPrice = tokens?.data[0]?.prices[0]?.value
    ? Number(tokens.data[0].prices[0].value)
    : 1;
  /*
   const debtPrice = tokens?.data[1]?.prices[0]?.value
    ? Number(tokens.data[1].prices[0].value)
    : 0;
  */
  console.log("SIR_PRICE", "#".repeat(100), collateralPrice, tokens)
  if (!amount || amount < 1n) {
    return (<div>
      0
      <span className="ml-1">$</span>
    </div>)
  }
  else
    return (
      <div>
        {contractAddress}

        <TokenDisplay
          amount={(amount ? amount / parseEther(collateralPrice.toString()) : 0n)}
          decimals={12}
          unitLabel={"$"}
        />
      </div>)
}
