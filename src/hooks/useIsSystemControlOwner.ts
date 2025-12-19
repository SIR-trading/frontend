import { useAccount } from "wagmi";
import { SYSTEM_CONTROL_OWNER } from "@/contracts/systemControl";

export function useIsSystemControlOwner(): boolean {
  const { address, isConnected } = useAccount();

  return (
    isConnected &&
    !!address &&
    address.toLowerCase() === SYSTEM_CONTROL_OWNER.toLowerCase()
  );
}
