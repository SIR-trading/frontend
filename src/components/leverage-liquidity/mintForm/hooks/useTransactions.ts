import { useApproveErc20 } from "@/components/shared/hooks/useApproveErc20";
import { VaultContract } from "@/contracts/vault";
import type { TVaults } from "@/lib/types";
import { parseUnits } from "viem";
import type { SimulateContractReturnType } from "viem";

type SimulateReq = SimulateContractReturnType["request"] | undefined;
export function useTransactions({
  depositToken,
  deposit,
  decimals,
  useNativeToken,
  tokenAllowance,
  maxApprove,
}: {
  depositToken: string;
  deposit: string;
  maxApprove: boolean;
  vaultsQuery: TVaults;
  decimals: number;
  useNativeToken: boolean;
  tokenAllowance: bigint | undefined;
  enableMintSimulation?: boolean;
}) {
  // Skip approval logic when using ETH directly
  const { approveSimulate, needsApproval, needs0Approval } = useApproveErc20({
    useMaxApprove: maxApprove,
    tokenAddr: useNativeToken ? "" : (depositToken ?? ""), // Skip approval when using ETH
    approveContract: VaultContract.address,
    amount: parseUnits(deposit ?? "0", decimals),
    allowance: tokenAllowance ?? 0n,
  });

  return {
    requests: {
      mintRequest: undefined, // No longer simulating mint
      approveWriteRequest: useNativeToken ? undefined : (approveSimulate.data?.request as SimulateReq), // No approval needed for ETH
    },
    isApproveFetching: useNativeToken ? false : approveSimulate.isFetching, // No approval fetching for ETH
    isMintFetching: false,
    needs0Approval: useNativeToken ? false : needs0Approval, // No approval needed for ETH
    needsApproval: useNativeToken ? false : needsApproval, // No approval needed for ETH
    mintError: undefined,
    mintFailureReason: undefined,
  };
}
