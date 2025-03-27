import { formatUnits, parseEther } from "viem";
import { api } from "@/trpc/react";
import { EContracts, getAddress } from "@/lib/contractAddresses";
import { TokenDisplay } from "@/components/ui/token-display";
import type { TPriceList } from "@/components/providers/priceProvider";
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
  const valueInUSD = sirPrice && sirPrice > 0n ? sirPrice * amount : 0n;
  return (
    <div>
      <div>{formatUnits(valueInUSD, 12)}</div>
      <TokenDisplay
        amount={valueInUSD}
        decimals={12}
        unitLabel={"$"}
      />
    </div>
  );
}

