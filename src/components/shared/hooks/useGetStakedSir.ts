import { api } from "@/trpc/react";
import { useAccount } from "wagmi";

export function useGetStakedSir() {
  const { address, isConnected } = useAccount();
  const { data: stakedPosition } = api.user.getStakedSirPosition.useQuery(
    { user: address ?? "0x" },
    { enabled: isConnected },
  );
  return { ...stakedPosition };
}
