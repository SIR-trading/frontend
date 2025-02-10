import { api } from "@/trpc/react";
import { useAccount } from "wagmi";

export function useGetUnstakedSir() {
  const { address, isConnected } = useAccount();
  const { data: unstakedBal } = api.user.getUnstakedSirBalance.useQuery(
    {
      user: address,
    },
    { enabled: isConnected },
  );
  return { unstakedBal };
}
