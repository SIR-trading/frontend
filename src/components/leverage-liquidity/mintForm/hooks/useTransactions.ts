import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import { useApproveErc20 } from "@/components/shared/hooks/useApproveErc20";
import { useMintApeOrTea } from "@/components/shared/hooks/useMintApeOrTea";
import { VaultContract } from "@/contracts/vault";
import type { TVaults } from "@/lib/types";
import { formatDataInput } from "@/lib/utils/index";
import { useFormContext } from "react-hook-form";
import type { SimulateContractReturnType } from "viem";
import { parseUnits } from "viem";
import { z } from "zod";

type SimulateReq = SimulateContractReturnType["request"] | undefined;
export function useTransactions({
  isApe,
  vaultId,
  decimals,
  useEth,
  minCollateralOut,
  tokenAllowance,
  maxApprove,
}: {
  isApe: boolean;
  maxApprove: boolean;
  vaultsQuery: TVaults;
  decimals: number;
  useEth: boolean;
  minCollateralOut: bigint | undefined;
  vaultId: string | undefined;
  tokenAllowance: bigint | undefined;
}) {
  const form = useFormContext<TMintFormFields>();
  const formData = form.watch();
  const safeLeverageTier = z.coerce.number().safeParse(formData.leverageTier);
  const leverageTier = safeLeverageTier.success ? safeLeverageTier.data : -1;
  const { Mint, isFetching: mintFetching } = useMintApeOrTea({
    useEth,
    minCollateralOut,
    depositToken: formData.depositToken,
    decimals,
    vaultId,
    isApe,
    debtToken: formatDataInput(formData.versus), //value formatted : address,symbol
    collateralToken: formatDataInput(formData.long), //value formatted : address,symbol
    leverageTier: leverageTier,
    amount: safeParseUnits(formData.deposit ?? "0", decimals),
    tokenAllowance,
  });

  // Skip approval logic when using ETH directly
  const { approveSimulate, needsApproval, needs0Approval } = useApproveErc20({
    useMaxApprove: maxApprove,
    tokenAddr: useEth ? "" : (formData.depositToken ?? ""), // Skip approval when using ETH
    approveContract: VaultContract.address,
    amount: parseUnits(formData.deposit ?? "0", decimals),
    allowance: tokenAllowance ?? 0n,
  });

  return {
    requests: {
      mintRequest: Mint?.request as SimulateReq,
      approveWriteRequest: useEth ? undefined : (approveSimulate.data?.request as SimulateReq), // No approval needed for ETH
    },
    isApproveFetching: useEth ? false : approveSimulate.isFetching, // No approval fetching for ETH
    isMintFetching: mintFetching,
    needs0Approval: useEth ? false : needs0Approval, // No approval needed for ETH
    needsApproval: useEth ? false : needsApproval, // No approval needed for ETH
  };
}

function safeParseUnits(s: string, n: number) {
  try {
    return parseUnits(s, n);
  } catch {
    return 0n;
  }
}
