import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import { VaultContract } from "@/contracts/vault";
import { parseAddress } from "@/lib/utils";
import { api } from "@/trpc/react";
import { useFormContext } from "react-hook-form";
import { useAccount } from "wagmi";
/**
 * Gets user balance and allowance for the form field deposit token
 * Gets user ETH Balance
 * Gets Collateral and Debt Decimals
 */
export default function useGetFormTokensInfo() {
  const { address } = useAccount();

  const formData = useFormContext<TMintFormFields>().watch();

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
  const { data: userEthBalance } = api.user.getEthBalance.useQuery(
    { userAddress: address },
    { enabled: Boolean(address) && Boolean(formData.long) },
  );
  // TODO
  // REFACTOR TO ONE CALL
  const { data: collateralDecimals } = api.erc20.getErc20Decimals.useQuery(
    {
      tokenAddress: parseAddress(formData.long) ?? "0x",
    },
    {
      enabled: Boolean(formData.long) && Boolean(formData.versus),
    },
  );

  const { data: debtDecimals } = api.erc20.getErc20Decimals.useQuery(
    {
      tokenAddress: parseAddress(formData.versus) ?? "0x",
    },
    {
      enabled: Boolean(formData.long) && Boolean(formData.versus),
    },
  );
  const depositDecimals =
    formData.depositToken === parseAddress(formData.long)
      ? collateralDecimals
      : debtDecimals;
  return {
    userEthBalance,
    userBalance,
    userBalanceFetching: isFetching,
    collateralDecimals,
    debtDecimals,
    depositDecimals,
  };
}
