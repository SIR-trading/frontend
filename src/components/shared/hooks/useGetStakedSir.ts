import { api } from "@/trpc/react";
import { useMemo } from "react";
import { useAccount } from "wagmi";

export function useGetStakedSir() {
  const { address, isConnected } = useAccount();
  const { data: unstakedBal } = api.user.getUnstakedSirBalance.useQuery(
    {
      user: address,
    },
    { enabled: isConnected },
  );
  const { data: totalBal } = api.user.getTotalSirBalance.useQuery(
    { user: address },
    { enabled: isConnected },
  );
  console.log({ totalBal, unstakedBal });
  const data = useMemo(() => {
    if (totalBal && unstakedBal) {
      return totalBal - unstakedBal;
    } else {
      return 0n;
    }
  }, [totalBal, unstakedBal]);
  return data;
}
