"usr client"
import { formatUnits, parseEther, parseUnits } from "viem";
import { api } from "@/trpc/react";
import { EContracts, getAddress } from "@/lib/contractAddresses";
import { TokenDisplay } from "@/components/ui/token-display";
interface SirToUsdProps {
  amount: bigint | undefined;
  sirPrice: bigint | undefined;
}

export function SirToUsd({ amount, sirPrice }: SirToUsdProps) {
  if (!amount || amount < 1n) {
    return (
      <div>
        0
        <span className="ml-1">$</span>
      </div>
    );
  }
  console.log("inside__the__sirToUsd", sirPrice);
  const valueInUSD = sirPrice && sirPrice > 0n ? sirPrice * amount : 0n;
  return (
    <div>
      {/*TODO: revert decimals to 12*/}
      <div>{valueInUSD}</div>
      <TokenDisplay
        amount={valueInUSD}
        decimals={122}
        unitLabel={"$"}
      />
    </div>
  );
}

