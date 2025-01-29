import { useApproveErc20 } from "@/components/shared/hooks/useApproveErc20";
import { useMintApeOrTea } from "@/components/shared/hooks/useMintApeOrTea";
import { VaultContract } from "@/contracts/vault";
import type { TMintFormFields, TVaults } from "@/lib/types";
import { formatDataInput, findVault } from "@/lib/utils";
import { api } from "@/trpc/react";
import { useFormContext } from "react-hook-form";
import type { SimulateContractReturnType } from "viem";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { z } from "zod";

type SimulateReq = SimulateContractReturnType["request"] | undefined;
export function useTransactions({
  isApe,
  vaultsQuery,
  decimals,
  useEth,
  minCollateralOut,
}: {
  isApe: boolean;
  vaultsQuery: TVaults;
  decimals: number;
  useEth: boolean;
  minCollateralOut: bigint | undefined;
}) {
  const form = useFormContext<TMintFormFields>();
  const formData = form.watch();
  const { address } = useAccount();
  const { data: userBalance, isFetching } =
    api.user.getBalanceAndAllowance.useQuery(
      {
        userAddress: address,
        tokenAddress: formData.depositToken,
        spender: VaultContract.address,
      },
      {
        enabled:
          Boolean(address) &&
          Boolean(formData.long) &&
          Boolean(formData.depositToken),
      },
    );
  const safeLeverageTier = z.coerce.number().safeParse(formData.leverageTier);
  const leverageTier = safeLeverageTier.success ? safeLeverageTier.data : -1;
  const { Mint, isFetching: mintFetching } = useMintApeOrTea({
    useEth,
    minCollateralOut,
    depositToken: formData.depositToken,
    decimals,
    vaultId: findVault(vaultsQuery, formData).result?.vaultId.toString(),
    isApe,
    debtToken: formatDataInput(formData.versus), //value formatted : address,symbol
    collateralToken: formatDataInput(formData.long), //value formatted : address,symbol
    leverageTier: leverageTier,
    amount: safeParseUnits(formData.deposit ?? "0", decimals),
    tokenAllowance: userBalance?.tokenAllowance?.result,
  });

  const { approveSimulate } = useApproveErc20({
    tokenAddr: formData.depositToken ?? "",
    approveContract: VaultContract.address,
  });

  return {
    requests: {
      mintRequest: Mint?.request as SimulateReq,
      approveWriteRequest: approveSimulate.data?.request as SimulateReq,
    },
    isApproveFetching: approveSimulate.isFetching,
    isMintFetching: mintFetching,
    userBalance,
    userBalanceFetching: isFetching,
  };
}

function safeParseUnits(s: string, n: number) {
  try {
    return parseUnits(s, n);
  } catch {
    return 0n;
  }
}
