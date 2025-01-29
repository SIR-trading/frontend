import useGetChainId from "@/components/shared/hooks/useGetChainId";
import { env } from "@/env";
import { ESubmitType } from "@/lib/types";
import { useMemo } from "react";
import type { SimulateContractReturnType } from "viem";
import { parseUnits } from "viem";
import { useChainId } from "wagmi";

interface Props {
  deposit: string | undefined;
  depositToken: string;
  requests: {
    mintRequest?: SimulateContractReturnType["request"] | undefined;
    approveWriteRequest?: SimulateContractReturnType["request"] | undefined;
  };
  tokenAllowance?: bigint | undefined;
  tokenBalance: bigint | undefined;
  ethBalance?: bigint | undefined;
  mintFetching: boolean;
  approveFetching?: boolean;
  useEth?: boolean;
  decimals: number;
  maxCollateralIn?: bigint;
}

/**
 * Checks if user can submit transaction.
 * Also checks if user needs ERC20 approval
 * @returns
 * isValid -
 * errorMessage -
 * submitType - 'approve' | 'mint'
 */
export const useMintFormValidation = ({
  deposit,
  tokenAllowance,
  mintFetching,
  requests,
  approveFetching,
  tokenBalance,
  ethBalance,
  maxCollateralIn,
  useEth,
  decimals,
}: Props) => {
  const chainId = useChainId();
  const { isValid, errorMessage, submitType } = useMemo(() => {
    console.log(chainId, "chainId");
    if (chainId?.toString() !== env.NEXT_PUBLIC_CHAIN_ID && Boolean(chainId)) {
      return {
        isValid: false,
        errorMessage: "Wrong network!",
        submitType: ESubmitType.mint,
      };
    }

    if (parseUnits(deposit ?? "0", decimals) <= 0n) {
      return {
        isValid: false,
        errorMessage: "Enter amount greater than 0.",
        submitType: ESubmitType.mint,
      };
    }
    if (maxCollateralIn) {
      if (parseUnits(deposit ?? "0", decimals) > maxCollateralIn) {
        return {
          isValid: false,
          errorMessage: "Insufficient liquidity in the vault.",
          submitType: ESubmitType.mint,
        };
      }
    }
    if (useEth) {
      if ((ethBalance ?? 0n) < parseUnits(deposit ?? "0", decimals)) {
        return {
          isValid: false,
          errorMessage: "Insufficient Balance.",
          submitType: ESubmitType.mint,
        };
      }
      if (requests.mintRequest) {
        return {
          isValid: true,
          errorMessage: "",
          submitType: ESubmitType.mint,
        };
      }
      return {
        isValid: false,
        errorMessage: "",
        submitType: ESubmitType.mint,
      };
    }

    if ((tokenBalance ?? 0n) < parseUnits(deposit ?? "0", decimals)) {
      return {
        isValid: false,
        errorMessage: "Insufficient Balance.",
        submitType: ESubmitType.mint,
      };
    }
    // CHECK ALLOWANCE FIRST
    if (
      parseUnits(deposit ?? "0", decimals) > (tokenAllowance ?? 0n) &&
      requests.approveWriteRequest
    ) {
      if (requests.approveWriteRequest)
        return {
          isValid: true,
          errorMessage: null,
          submitType: ESubmitType.approve,
        };
      else {
        if (approveFetching) {
          return {
            isValid: false,
            errorMessage: "",
            submitType: ESubmitType.approve,
          };
        } else {
          return {
            isValid: false,
            errorMessage: "An Approve Error Occured.",
            submitType: ESubmitType.approve,
          };
        }
      }
    }
    if (requests.mintRequest)
      return {
        isValid: true,
        errorMessage: null,
        submitType: ESubmitType.mint,
      };
    else {
      if (mintFetching) {
        return {
          isValid: false,
          errorMessage: "",
          submitType: ESubmitType.mint,
        };
      } else {
        return {
          isValid: false,
          errorMessage: "Unexpected mint error.",
          submitType: ESubmitType.mint,
        };
      }
    }
  }, [
    chainId,
    deposit,
    decimals,
    maxCollateralIn,
    useEth,
    tokenBalance,
    tokenAllowance,
    requests.approveWriteRequest,
    requests.mintRequest,
    ethBalance,
    approveFetching,
    mintFetching,
  ]);
  return { isValid, errorMessage, submitType };
};
