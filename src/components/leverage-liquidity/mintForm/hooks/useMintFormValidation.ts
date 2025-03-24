import useGetChainId from "@/components/shared/hooks/useGetChainId";
import { env } from "@/env";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type { SimulateContractReturnType } from "viem";
import { parseUnits } from "viem";
import { usingDebtToken } from "../utils";
import type { TMintFormFields } from "@/components/providers/mintFormProvider";

interface Props {
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
  isApe: boolean;
  decimals: number;
  maxCollateralIn?: bigint;
}

/**
 * Checks if user can submit transaction.
 * Also checks if user needs ERC20 approval
 * @returns
 * isValid -
 * errorMessage -
 */
export const useMintFormValidation = ({
  tokenAllowance,
  mintFetching,
  requests,
  approveFetching,
  tokenBalance,
  ethBalance,
  maxCollateralIn,
  useEth,
  decimals,
  isApe,
}: Props) => {
  const chainId = useGetChainId();
  const form = useFormContext<TMintFormFields>();
  const formData = form.watch();
  const { deposit, slippage, depositToken, versus } = formData;
  const { isValid, errorMessage } = useMemo(() => {
    if (usingDebtToken(versus, depositToken)) {
      const num = Number.parseFloat(slippage ?? "0");
      if (num < 0 || num > 10) {
        return {
          isValid: false,
          errorMessage: "Slippage must be between 0% and 10%.",
        };
      }
    }
    if (chainId?.toString() !== env.NEXT_PUBLIC_CHAIN_ID && Boolean(chainId)) {
      return {
        isValid: false,
        errorMessage: "Wrong network!",
      };
    }

    if (parseUnits(deposit ?? "0", decimals) <= 0n) {
      return {
        isValid: false,
        errorMessage: "Enter amount greater than 0.",
      };
    }
    if (maxCollateralIn && isApe) {
      if (parseUnits(deposit ?? "0", decimals) > maxCollateralIn) {
        return {
          isValid: false,
          errorMessage: "Insufficient Collateral in Vault.",
        };
      }
    } else if (!maxCollateralIn && isApe) {
      return {
        isValid: false,
        errorMessage: "",
      };
    }
    if (useEth) {
      if ((ethBalance ?? 0n) < parseUnits(deposit ?? "0", decimals)) {
        return {
          isValid: false,
          errorMessage: "Insufficient Balance.",
        };
      }
      if (requests.mintRequest) {
        return {
          isValid: true,
          errorMessage: "",
        };
      }
      return {
        isValid: false,
        errorMessage: "",
      };
    }

    if ((tokenBalance ?? 0n) < parseUnits(deposit ?? "0", decimals)) {
      return {
        isValid: false,
        errorMessage: "Insufficient Balance.",
      };
    }
    // CHECK ALLOWANCE FIRST
    if (
      parseUnits(deposit ?? "0", decimals) >= (tokenAllowance ?? 0n) &&
      requests.approveWriteRequest
    ) {
      if (requests.approveWriteRequest)
        return {
          isValid: true,
          errorMessage: null,
        };
      else {
        if (approveFetching) {
          return {
            isValid: false,
            errorMessage: "",
          };
        } else {
          return {
            isValid: false,
            errorMessage: "An Approve Error Occured.",
          };
        }
      }
    } else {
      if (requests.mintRequest)
        return {
          isValid: true,
          errorMessage: null,
        };
      else {
        if (mintFetching) {
          return {
            isValid: false,
            errorMessage: "",
          };
        } else {
          console.log(
            parseUnits(deposit ?? "0", decimals),
            tokenAllowance,
            "))))",
          );
          return {
            isValid: false,
            errorMessage: "Unexpected Mint error.",
          };
        }
      }
    }
  }, [
    versus,
    depositToken,
    chainId,
    deposit,
    decimals,
    maxCollateralIn,
    isApe,
    useEth,
    tokenBalance,
    tokenAllowance,
    requests.approveWriteRequest,
    requests.mintRequest,
    slippage,
    ethBalance,
    approveFetching,
    mintFetching,
  ]);
  return { isValid, errorMessage };
};
