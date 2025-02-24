import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import { useApproveErc20 } from "@/components/shared/hooks/useApproveErc20";
import { useMintApeOrTea } from "@/components/shared/hooks/useMintApeOrTea";
import { VaultContract } from "@/contracts/vault";
import type { TVaults } from "@/lib/types";
import { formatDataInput } from "@/lib/utils";
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
}: {
  isApe: boolean;
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
  const depositAmount = safeParseUnits(formData.deposit ?? "0", decimals);
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
    amount: depositAmount,
    tokenAllowance,
  });

  const { approveSimulate } = useApproveErc20({
    tokenAddr: formData.depositToken ?? "",
    approveContract: VaultContract.address,
    amount: depositAmount,
  });

  return {
    requests: {
      mintRequest: Mint?.request as SimulateReq,
      approveWriteRequest: approveSimulate.data?.request as SimulateReq,
    },
    isApproveFetching: approveSimulate.isFetching,
    isMintFetching: mintFetching,
  };
}

function safeParseUnits(s: string, n: number) {
  try {
    return parseUnits(s, n);
  } catch {
    return 0n;
  }
}
