import useGetChainId from "@/components/shared/hooks/useGetChainId";
import { env } from "@/env";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { parseUnits } from "viem";
import { usingDebtToken } from "../utils";
import type { TMintFormFields } from "@/components/providers/mintFormProvider";

interface Props {
  tokenAllowance?: bigint | undefined;
  tokenBalance: bigint | undefined;
  nativeTokenBalance?: bigint | undefined;
  useNativeToken?: boolean;
  decimals: number;
}

/**
 * Checks if user can submit transaction.
 * Following CLAUDE.md guidelines: enable buttons as soon as form data is valid.
 * Don't gate on simulation/quote results - let Wagmi handle that internally.
 * @returns
 * isValid - true when form is valid and user can attempt transaction
 * errorMessage - user-facing error message if invalid
 */
export const useMintFormValidation = ({
  tokenAllowance,
  tokenBalance,
  nativeTokenBalance,
  useNativeToken,
  decimals,
}: Props) => {
  const chainId = useGetChainId();
  const form = useFormContext<TMintFormFields>();
  const formData = form.watch();
  const { deposit, slippage, depositToken, versus } = formData;

  const { isValid, errorMessage, needsApproval } = useMemo(() => {
    // Validate slippage if using debt token
    if (usingDebtToken(versus, depositToken)) {
      const num = Number.parseFloat(slippage ?? "0");
      if (num < 0 || num > 50) {
        return {
          isValid: false,
          errorMessage: "Slippage must be between 0% and 50%.",
          needsApproval: false,
        };
      }
    }

    // Check network
    if (chainId?.toString() !== env.NEXT_PUBLIC_CHAIN_ID && Boolean(chainId)) {
      return {
        isValid: false,
        errorMessage: "Wrong network!",
        needsApproval: false,
      };
    }

    // Check deposit amount > 0
    const depositAmount = parseUnits(deposit ?? "0", decimals);
    if (depositAmount <= 0n) {
      return {
        isValid: false,
        errorMessage: "Enter amount greater than 0.",
        needsApproval: false,
      };
    }

    // Check balance based on token type
    if (useNativeToken) {
      if ((nativeTokenBalance ?? 0n) < depositAmount) {
        return {
          isValid: false,
          errorMessage: "Insufficient Balance.",
          needsApproval: false,
        };
      }
      // Native token doesn't need approval
      return {
        isValid: true,
        errorMessage: "",
        needsApproval: false,
      };
    }

    // ERC20 token checks
    if ((tokenBalance ?? 0n) < depositAmount) {
      return {
        isValid: false,
        errorMessage: "Insufficient Balance.",
        needsApproval: false,
      };
    }

    // Check if approval is needed (but don't gate on simulation result)
    const needsApproval = depositAmount > (tokenAllowance ?? 0n);

    return {
      isValid: true,
      errorMessage: "",
      needsApproval,
    };
  }, [
    versus,
    depositToken,
    chainId,
    deposit,
    decimals,
    useNativeToken,
    tokenBalance,
    tokenAllowance,
    slippage,
    nativeTokenBalance,
  ]);

  return { isValid, errorMessage, needsApproval };
};
