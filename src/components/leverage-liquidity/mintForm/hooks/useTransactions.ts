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
  useEth,
  tokenAllowance,
  maxApprove,
}: {
  depositToken: string;
  deposit: string;
  maxApprove: boolean;
  vaultsQuery: TVaults;
  decimals: number;
  useEth: boolean;
  tokenAllowance: bigint | undefined;
  enableMintSimulation?: boolean;
}) {
  // Skip approval logic when using ETH directly
  const { approveSimulate, needsApproval, needs0Approval } = useApproveErc20({
    useMaxApprove: maxApprove,
    tokenAddr: useEth ? "" : (depositToken ?? ""), // Skip approval when using ETH
    approveContract: VaultContract.address,
    amount: parseUnits(deposit ?? "0", decimals),
    allowance: tokenAllowance ?? 0n,
  });

  return {
    requests: {
      mintRequest: undefined, // No longer simulating mint
      approveWriteRequest: useEth ? undefined : (approveSimulate.data?.request as SimulateReq), // No approval needed for ETH
    },
    isApproveFetching: useEth ? false : approveSimulate.isFetching, // No approval fetching for ETH
    isMintFetching: false,
    needs0Approval: useEth ? false : needs0Approval, // No approval needed for ETH
    needsApproval: useEth ? false : needsApproval, // No approval needed for ETH
    mintError: undefined,
    mintFailureReason: undefined,
  };
}
