"use client";
import React, { useCallback, useMemo, useState } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { motion } from "motion/react";
import { formatUnits } from "viem";
import { ESubmitType, type TVaults } from "@/lib/types";
import DepositInputs from "./deposit-inputs";
import VaultParamsInputSelects from "./vaultParamsInputSelects";
import { useQuoteMint } from "./hooks/useQuoteMint";
import useSetRootError from "./hooks/useSetRootError";
import { Card } from "@/components/ui/card";
import { formatNumber, parseAddress } from "@/lib/utils";
import Estimations from "./estimations";
import MintFormSubmit from "./submit";
import { useFormSuccessReset } from "./hooks/useFormSuccessReset";
import { useTransactions } from "./hooks/useTransactions";
import TransactionModal from "@/components/shared/transactionModal";
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
import Dropdown from "@/components/shared/dropDown";
import { useIsWeth } from "./hooks/useIsWeth";
import useSetDepositTokenDefault from "./hooks/useSetDepositTokenDefault";
import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import { useFormContext } from "react-hook-form";
import { useFindVault } from "./hooks/useFindVault";
import useIsDebtToken from "./hooks/useIsDebtToken";
import useGetFormTokensInfo from "./hooks/useGetUserBals";
interface Props {
  vaultsQuery: TVaults;
  isApe: boolean;
}

/**
 * Contains form actions and validition.
 */
export default function MintForm({ vaultsQuery, isApe }: Props) {
  const [useEthRaw, setUseEth] = useState(false);
  const {
    userEthBalance,
    userBalanceFetching,
    userBalance,
    debtDecimals,
    collateralDecimals,
    depositDecimals,
  } = useGetFormTokensInfo();
  const isWeth = useIsWeth();

  // Ensure use eth toggle is not used on non-weth tokens
  const { getValues, setError, formState, setValue, handleSubmit } =
    useFormContext<TMintFormFields>();
  const useEth = useMemo(() => {
    return isWeth ? useEthRaw : false;
  }, [isWeth, useEthRaw]);

  const { amountTokens, minCollateralOut } = useQuoteMint({
    isApe,
    decimals: depositDecimals ?? 0,
  });

  const selectedVault = useFindVault(vaultsQuery);
  const { requests, isApproveFetching, isMintFetching } = useTransactions({
    useEth,
    tokenAllowance: userBalance?.tokenAllowance?.result,
    vaultId: selectedVault.result?.vaultId,
    minCollateralOut,
    isApe,
    vaultsQuery,
    decimals: depositDecimals ?? 18,
  });
  const { versus, leverageTiers, long } = useFilterVaults({
    vaultsQuery,
  });

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: transactionData,
  } = useWaitForTransactionReceipt({ hash });
  useSetDepositTokenDefault({
    collToken: selectedVault.result?.collateralToken,
  });
  const { tokenReceived } = useGetReceivedTokens({
    apeAddress: selectedVault.result?.apeAddress ?? "0x",
    logs: transactionData?.logs,
    isApe,
  });
  console.log("====================");
  console.log({ amountTokens });

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
  const usingDebtToken = useIsDebtToken();
  const { maxCollateralIn, maxDebtIn, badHealth, isLoading } =
    useCalculateMaxApe({
      usingDebtToken,
      collateralDecimals: collateralDecimals ?? 18,
      vaultId: Number.parseInt(selectedVault.result?.vaultId ?? "-1"),
    });
  const maxIn = usingDebtToken ? maxDebtIn : maxCollateralIn;
  const { isValid, errorMessage, submitType } = useMintFormValidation({
    ethBalance: userEthBalance,
    decimals: depositDecimals ?? 18,
    useEth,
    requests,
    tokenBalance: userBalance?.tokenBalance?.result,
    tokenAllowance: userBalance?.tokenAllowance?.result,
    mintFetching: isMintFetching,
    approveFetching: isApproveFetching,
    maxCollateralIn: isApe ? maxIn : 0n,
  });

  useSetRootError({
    setError: setError,
    errorMessage,
    rootErrorMessage: formState.errors.root?.message,
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

  const levTier = getValues("leverageTier");
  const fee = useFormFee({ levTier, isApe });
  const modalSubmit = () => {
    if (!isConfirmed) {
      onSubmit();
    } else {
      setOpenTransactionModal(false);
    }
  };
  const disabledInputs = useMemo(() => {
    if (!selectedVault.result?.vaultId || !isApe) {
      setValue("deposit", "");
      return false;
    }
    if (badHealth) {
      return true;
    }
  }, [selectedVault.result?.vaultId, isApe, badHealth, setValue]);

  const isApproving = useResetAfterApprove({
    isConfirmed,
    reset,
    submitType,
  });
  const deposit = getValues("deposit");
  const depositTokenSymbol = !usingDebtToken
    ? selectedVault.result?.collateralSymbol
    : selectedVault.result?.debtSymbol;
  const maxTokenIn = usingDebtToken
    ? formatUnits(maxDebtIn ?? 0n, debtDecimals ?? 18)
    : formatUnits(maxCollateralIn ?? 0n, collateralDecimals ?? 18);
  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <TransactionModal.Root
          setOpen={setOpenTransactionModal}
          open={openTransactionModal}
        >
          <TransactionModal.Close setOpen={setOpenTransactionModal} />
          <TransactionModal.InfoContainer>
            <TransactionInfo
              vaultId={selectedVault.result?.vaultId ?? "0"}
              decimals={collateralDecimals ?? 18}
              isConfirmed={isConfirmed}
              isConfirming={isConfirming}
              userBalanceFetching={userBalanceFetching}
              isPending={isPending}
              submitType={submitType}
              isApe={isApe}
              useEth={useEth}
              quoteData={amountTokens}
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
                  )} ${depositTokenSymbol}`}
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
          versus={versus}
          leverageTiers={leverageTiers}
          long={long}
        />
        <DepositInputs.Root>
          <DepositInputs.Inputs
            inputLoading={isLoading}
            disabled={Boolean(disabledInputs) && !isLoading}
            decimals={collateralDecimals ?? 18}
            useEth={useEth}
            setUseEth={(b: boolean) => {
              setUseEth(b);
            }}
            maxTokenIn={maxTokenIn}
            balance={formatUnits(balance ?? 0n, depositDecimals ?? 18)}
          >
            <Dropdown.Root
              colorScheme="dark"
              name="depositToken"
              title=""
              disabled={!Boolean(selectedVault.result)}
            >
              <Show when={Boolean(selectedVault.result)}>
                <Dropdown.Item
                  tokenAddress={selectedVault.result?.collateralToken ?? ""}
                  value={selectedVault.result?.collateralToken ?? ""}
                >
                  {selectedVault.result?.collateralSymbol}
                </Dropdown.Item>
                <Dropdown.Item
                  tokenAddress={selectedVault.result?.debtToken ?? ""}
                  value={selectedVault.result?.debtToken ?? ""}
                >
                  {selectedVault.result?.debtSymbol}
                </Dropdown.Item>
              </Show>
            </Dropdown.Root>
          </DepositInputs.Inputs>
        </DepositInputs.Root>
        <div className="py-3 ">
          <Show when={Boolean(disabledInputs && !isLoading)}>
            <ErrorMessage>Insufficient liquidity in the vault.</ErrorMessage>
          </Show>
        </div>
        <Estimations
          isApe={isApe}
          disabled={!Boolean(amountTokens)}
          ape={formatUnits(amountTokens ?? 0n, collateralDecimals ?? 18)}
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
              feeValue={parseAddress(getValues("long"))}
              isApe={isApe}
              isValid={isValid}
              feeAmount={`${formatNumber(
                parseFloat(deposit ?? "0") * (parseFloat(fee ?? "0") / 100),
              )} ${depositTokenSymbol}`}
              feePercent={fee}
              deposit={getValues("deposit")}
            />
            <MintFormSubmit.Errors>
              {formState.errors.root?.message}
            </MintFormSubmit.Errors>
          </MintFormSubmit.Root>
        </motion.div>
      </form>
    </Card>
  );
}
