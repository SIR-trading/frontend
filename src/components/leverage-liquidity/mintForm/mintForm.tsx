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
import Dropdown from "@/components/shared/dropDown";
interface Props {
  vaultsQuery: TVaults;
  isApe: boolean;
}

/**
 * Form inputs long and versus are both formatted address,symbol.
 * This function parses the address from them.
 */
function parseAddress(s: string) {
  return s.split(",")[0];
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
  const useEth = useMemo(() => {
    // Ensure use eth toggle is not used on non-weth tokens
    const isWeth =
      formData.depositToken?.toLowerCase() === WETH_ADDRESS.toLowerCase();
    return isWeth ? useEthRaw : false;
  }, [formData.depositToken, useEthRaw]);

  const decimals =
    formData.depositToken === parseAddress(formData.long)
      ? collateralDecimals
      : debtDecimals;

  const { amountTokens, minCollateralOut } = useQuoteMint({
    formData,
    isApe,
    decimals: debtDecimals ?? 18,
  });
  const {
    requests,
    userBalanceFetching,
    isApproveFetching,
    isMintFetching,
    userBalance,
  } = useTransactions({
    useEth,
    minCollateralOut,
    isApe,
    vaultsQuery,
    decimals: decimals ?? 18,
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
  useEffect(() => {
    form.setValue("depositToken", selectedVault.result?.collateralToken ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVault.result?.collateralToken, form.setValue]);
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
    decimals: collateralDecimals ?? 18,
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
  // useEffect(() => {
  //   if (!isPending && !isConfirming && !isConfirmed) {
  //     console.log("ran here");
  //     setOpenTransactionModal(false);
  //   }
  // }, [isPending, setOpenTransactionModal, isConfirming, isConfirmed]);
  const depositTokenSymbol =
    formData.depositToken === parseAddress(formData.long)
      ? selectedVault.result?.collateralSymbol
      : selectedVault.result?.debtSymbol;
  console.log(collateralDecimals, "collateralDecimals");
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
          form={form}
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
            maxCollateralIn={
              maxCollateralIn
                ? formatUnits(maxCollateralIn, decimals ?? 18)
                : undefined
            }
            balance={formatUnits(balance ?? 0n, decimals ?? 18)}
            form={form}
            depositAsset={formData.depositToken}
          >
            <Dropdown.Root
              colorScheme="dark"
              name="depositToken"
              title=""
              disabled={!Boolean(selectedVault.result)}
              form={form}
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
              feeValue={form.getValues("long").split(",")[1]}
              isApe={isApe}
              isValid={isValid}
              feeAmount={`${formatNumber(
                parseFloat(deposit ?? "0") * (parseFloat(fee ?? "0") / 100),
              )} ${depositTokenSymbol}`}
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
