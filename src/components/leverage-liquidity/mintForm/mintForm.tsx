"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/trpc/react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { motion } from "motion/react";
import { formatUnits } from "viem";
import { useFormContext } from "react-hook-form";
import { ESubmitType, type TMintFormFields, type TVaults } from "@/lib/types";
import DepositInputs from "./deposit-inputs";
import VaultParamsInputSelects from "./vaultParamsInputSelects";
import { useQuoteMint } from "./hooks/useQuoteMint";
import useSetRootError from "./hooks/useSetRootError";
import { Card } from "@/components/ui/card";
import { findVault, formatNumber } from "@/lib/utils";
import Estimations from "./estimations";
import MintFormSubmit from "./submit";
import { useFormSuccessReset } from "./hooks/useFormSuccessReset";
import { useTransactions } from "./hooks/useTransactions";
import TransactionModal from "@/components/shared/transactionModal";
import { WETH_ADDRESS } from "@/data/constants";
import { useGetReceivedTokens } from "./hooks/useGetReceivedTokens";
import { useResetAfterApprove } from "./hooks/useResetAfterApprove";
import TransactionInfo from "./transactionInfo";
import Show from "@/components/shared/show";
import useFormFee from "./hooks/useFormFee";
import { useResetTransactionModal } from "./hooks/useResetTransactionModal";
import ErrorMessage from "@/components/ui/error-message";
import { useCalculateMaxApe } from "./hooks/useCalculateMaxApe";
import { useFilterVaults } from "./hooks/useFilterVaults";
import { useMintFormValidation } from "./hooks/useMintFormValidation";
interface Props {
  vaultsQuery: TVaults;
  isApe: boolean;
}

/**
 * Contains form actions and validity.
 */
export default function MintForm({ vaultsQuery, isApe }: Props) {
  const [useEthRaw, setUseEth] = useState(false);
  const { address } = useAccount();
  const form = useFormContext<TMintFormFields>();
  const formData = form.watch();
  const { data: userEthBalance } = api.user.getEthBalance.useQuery(
    { userAddress: address },
    { enabled: Boolean(address) && Boolean(formData.long) },
  );

  const { data: decimalData } = api.erc20.getErc20Decimals.useQuery(
    {
      tokenAddress: formData.long.split(",")[0] ?? "0x",
    },
    {
      enabled: Boolean(formData.long),
    },
  );

  const useEth = useMemo(() => {
    // Ensure use eth toggle is not used on non-weth tokens
    const isWeth =
      formData.long.split(",")[0]?.toLowerCase() === WETH_ADDRESS.toLowerCase();
    return isWeth ? useEthRaw : false;
  }, [useEthRaw, formData.long]);

  const decimals = useEth ? 18 : decimalData ?? 18;

  const {
    requests,
    userBalanceFetching,
    isApproveFetching,
    isMintFetching,
    userBalance,
  } = useTransactions({
    useEth,
    isApe,
    vaultsQuery,
    decimals,
  });
  const { versus, leverageTiers, long } = useFilterVaults({
    formData,
    vaultsQuery,
  });

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: transactionData,
  } = useWaitForTransactionReceipt({ hash });
  const selectedVault = useMemo(() => {
    return findVault(vaultsQuery, formData);
  }, [formData, vaultsQuery]);

  const { tokenReceived } = useGetReceivedTokens({
    apeAddress: selectedVault.result?.apeAddress ?? "0x",
    logs: transactionData?.logs,
    isApe,
  });

  // Invalidate if approve or mint tx is successful.
  const [currentTxType, setCurrentTxType] = useState<
    // Used to know which
    "approve" | "mint" | undefined
  >();
  useFormSuccessReset({
    isConfirming,
    isConfirmed,
    currentTxType,
    useEth,
    txBlock: parseInt(transactionData?.blockNumber.toString() ?? "0"),
  });

  const { maxCollateralIn, badHealth, isLoading } = useCalculateMaxApe({
    leverageTier: formData.leverageTier,
    vaultId: Number.parseInt(selectedVault.result?.vaultId ?? "-1"),
  });

  const { isValid, errorMessage, submitType } = useMintFormValidation({
    ethBalance: userEthBalance,
    decimals,
    useEth,
    deposit: formData.deposit ?? "0",
    depositToken: formData.depositToken,
    requests,
    tokenBalance: userBalance?.tokenBalance?.result,
    tokenAllowance: userBalance?.tokenAllowance?.result,
    mintFetching: isMintFetching,
    approveFetching: isApproveFetching,
    maxCollateralIn: isApe ? maxCollateralIn : 0n,
  });

  const { quoteData } = useQuoteMint({ formData, isApe });
  useSetRootError({
    formData,
    setError: form.setError,
    errorMessage,
    rootErrorMessage: form.formState.errors.root?.message,
  });

  const onSubmit = useCallback(() => {
    if (submitType === null) {
      return;
    }
    if (submitType === ESubmitType.mint && requests.mintRequest) {
      setCurrentTxType("mint");
      writeContract?.(requests.mintRequest);
      return;
    }
    if (submitType === ESubmitType.approve && requests.approveWriteRequest) {
      setCurrentTxType("approve");
      writeContract(requests.approveWriteRequest);
      return;
    }
  }, [
    requests.approveWriteRequest,
    requests.mintRequest,
    submitType,
    writeContract,
  ]);

  let balance = userBalance?.tokenBalance?.result;
  if (useEth) {
    balance = userEthBalance;
  }

  const { openTransactionModal, setOpenTransactionModal } =
    useResetTransactionModal({ reset, isConfirmed });

  const levTier = form.getValues("leverageTier");
  const fee = useFormFee({ levTier, isApe });
  const modalSubmit = () => {
    if (!isConfirmed) {
      onSubmit();
    } else {
      setOpenTransactionModal(false);
    }
  };
  const disabledInputs = useMemo(() => {
    if (!isApe) return false;
    if (!selectedVault.result?.vaultId) {
      return false;
    }
    if (badHealth) {
      return true;
    }
  }, [badHealth, selectedVault.result?.vaultId, isApe]);
  const isApproving = useResetAfterApprove({
    isConfirmed,
    reset,
    submitType,
  });
  useEffect(() => {
    if (formData.deposit !== "" && disabledInputs) {
      form.setValue("deposit", "");
    }
  }, [disabledInputs, form, form.setValue, formData.deposit]);
  const deposit = form.getValues("deposit");
  useEffect(() => {
    if (!isPending && !isConfirming && !isConfirmed) {
      setOpenTransactionModal(false);
    }
  }, [isPending, setOpenTransactionModal, isConfirming, isConfirmed]);
  return (
    <Card>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <TransactionModal.Root
          setOpen={setOpenTransactionModal}
          open={openTransactionModal}
        >
          <TransactionModal.Close setOpen={setOpenTransactionModal} />
          <TransactionModal.InfoContainer>
            <TransactionInfo
              vaultId={selectedVault.result?.vaultId ?? "0"}
              decimals={decimals}
              isConfirmed={isConfirmed}
              isConfirming={isConfirming}
              userBalanceFetching={userBalanceFetching}
              isPending={isPending}
              submitType={submitType}
              isApe={isApe}
              useEth={useEth}
              quoteData={quoteData}
              isApproving={isApproving}
              tokenReceived={tokenReceived}
            />
          </TransactionModal.InfoContainer>
          <TransactionModal.StatSubmitContainer>
            <Show when={submitType === ESubmitType.mint && !isConfirmed}>
              <TransactionModal.StatContainer>
                <TransactionModal.StatRow
                  title={"Fee Percent"}
                  value={fee ? fee.toString() + "%" : "0%"}
                />
                <TransactionModal.StatRow
                  title="Fee Amount"
                  value={`${formatNumber(
                    parseFloat(deposit ?? "0") * (parseFloat(fee ?? "0") / 100),
                  )} ${form.getValues("long").split(",")[1]}`}
                />

                <div className="flex w-full justify-start   text-[14px] text-gray-400">
                  <div className="flex w-[300px]">
                    <p>
                      {isApe
                        ? "You pay a one-time fee. No recurring fees are charged while holding APE tokens regardless of the duration."
                        : "As an LPer, you pay a one-time fee to mitigate some types of economic attacks, which you will recover over time as you earn fees."}
                    </p>
                  </div>
                </div>
              </TransactionModal.StatContainer>
            </Show>

            <TransactionModal.SubmitButton
              onClick={modalSubmit}
              disabled={(!isValid && !isConfirmed) || isPending}
              loading={isPending || isConfirming}
              isConfirmed={isConfirmed}
            >
              <Show
                when={submitType === ESubmitType.mint}
                fallback="Confirm Approve"
              >
                {"Confirm Mint"}
              </Show>
            </TransactionModal.SubmitButton>
          </TransactionModal.StatSubmitContainer>
        </TransactionModal.Root>

        {/* Versus, Long, and Leverage Dropdowns */}
        <VaultParamsInputSelects
          form={form}
          versus={versus}
          leverageTiers={leverageTiers}
          long={long}
        />
        <DepositInputs.Root>
          <DepositInputs.Inputs
            inputLoading={isLoading}
            disabled={Boolean(disabledInputs) && !isLoading}
            decimals={decimals}
            useEth={useEth}
            setUseEth={(b: boolean) => {
              setUseEth(b);
            }}
            maxCollateralIn={
              maxCollateralIn
                ? formatUnits(maxCollateralIn, decimals)
                : undefined
            }
            balance={formatUnits(balance ?? 0n, decimals)}
            form={form}
            depositAsset={formData.long}
          />
        </DepositInputs.Root>
        <div className="py-3">
          <Show when={Boolean(disabledInputs && !isLoading)}>
            <ErrorMessage>Insufficient liquidity in the vault.</ErrorMessage>
          </Show>
        </div>
        <Estimations
          isApe={isApe}
          disabled={!Boolean(quoteData)}
          ape={formatUnits(quoteData ?? 0n, decimals)}
        />
        <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0.2 }}>
          <MintFormSubmit.Root>
            <Show when={isApe} fallback={<div className="py-3" />}>
              <p className="pb-2 text-center text-sm text-gray-500 md:w-[450px]">{`With leveraging you risk losing up to 100% of your deposit, you can not lose more than your deposit`}</p>
            </Show>
            <MintFormSubmit.OpenTransactionModalButton
              isValid={isValid}
              onClick={() => {
                setOpenTransactionModal(true);
                // onSubmit();
              }}
              submitType={submitType}
            />
            <MintFormSubmit.ConnectButton />
            <MintFormSubmit.FeeInfo
              feeValue={form.getValues("long").split(",")[1]}
              isApe={isApe}
              isValid={isValid}
              feeAmount={`${formatNumber(
                parseFloat(deposit ?? "0") * (parseFloat(fee ?? "0") / 100),
              )} ${form.getValues("long").split(",")[1]}`}
              feePercent={fee}
              deposit={form.getValues("deposit")}
            />
            <MintFormSubmit.Errors>
              {form.formState.errors.root?.message}
            </MintFormSubmit.Errors>
          </MintFormSubmit.Root>
        </motion.div>
      </form>
    </Card>
  );
}
