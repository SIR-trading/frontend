"use client";
import React, { useCallback, useMemo, useState } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { motion } from "motion/react";
import { formatUnits } from "viem";
import { type TVaults } from "@/lib/types";
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
import { IonCalculator } from "@/components/ui/icons/calculator-icon";
import Link from "next/link";
import { useVaultProvider } from "@/components/providers/vaultProvider";
import SubmitButton from "@/components/shared/submitButton";
import { FxemojiMonkeyface } from "@/components/ui/icons/monkey-icon";
import { NotoTeapot } from "@/components/ui/icons/teapot-icon";
import { Checkbox } from "@/components/ui/checkbox";
import ToolTip from "@/components/ui/tooltip";

interface Props {
  vaultsQuery: TVaults;
  isApe: boolean;
}

/**
 * Contains form actions and validition.
 */
export default function MintForm({ isApe }: Props) {
  const [useEthRaw, setUseEth] = useState(false);
  const { vaults: vaultsQuery } = useVaultProvider();
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
  const { setError, formState, setValue, watch, handleSubmit } =
    useFormContext<TMintFormFields>();
  const { deposit, leverageTier, long: longInput } = watch();
  const useEth = useMemo(() => {
    return isWeth ? useEthRaw : false;
  }, [isWeth, useEthRaw]);

  const { amountTokens, minCollateralOut } = useQuoteMint({
    isApe,
    decimals: depositDecimals ?? 0,
  });

  const selectedVault = useFindVault();
  const [maxApprove, setMaxApprove] = useState(false);
  const {
    requests,
    isApproveFetching,
    isMintFetching,
    needsApproval,
    needs0Approval,
  } = useTransactions({
    useEth,
    maxApprove,
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
  const { isValid, errorMessage } = useMintFormValidation({
    ethBalance: userEthBalance,
    isApe,
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
  console.log(requests.mintRequest, "requests.mintRequest");
  const onSubmit = useCallback(() => {
    if (requests.approveWriteRequest && needsApproval) {
      setCurrentTxType("approve");
      writeContract(requests.approveWriteRequest);
      return;
    }
    if (requests.mintRequest) {
      setCurrentTxType("mint");
      writeContract?.(requests.mintRequest);
      return;
    }
  }, [
    needsApproval,
    requests.approveWriteRequest,
    requests.mintRequest,
    writeContract,
  ]);

  let balance = userBalance?.tokenBalance?.result;
  if (useEth) {
    balance = userEthBalance;
  }

  const { openTransactionModal, setOpenTransactionModal } =
    useResetTransactionModal({ reset, isConfirmed });

  const fee = useFormFee({ leverageTier, isApe });
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

  useResetAfterApprove({
    isConfirmed,
    reset,
    needsApproval,
  });
  const depositTokenSymbol = !usingDebtToken
    ? selectedVault.result?.collateralSymbol
    : selectedVault.result?.debtSymbol;
  let maxTokenIn;
  if (isApe) {
    maxTokenIn = usingDebtToken
      ? formatUnits(maxDebtIn ?? 0n, debtDecimals ?? 18)
      : formatUnits(maxCollateralIn ?? 0n, collateralDecimals ?? 18);
  }
  return (
    <Card className="md:p-[18px] md:pb-[10px]">
      <form onSubmit={handleSubmit(onSubmit)}>
        <TransactionModal.Root
          title="Mint"
          setOpen={setOpenTransactionModal}
          open={openTransactionModal}
        >
          <TransactionModal.Close setOpen={setOpenTransactionModal} />
          <TransactionModal.InfoContainer
            isConfirming={isConfirming}
            hash={hash}
          >
            <TransactionInfo
              needs0Approval={needs0Approval ?? false}
              transactionHash={hash}
              needsApproval={needsApproval}
              vaultId={selectedVault.result?.vaultId ?? "0"}
              decimals={collateralDecimals ?? 18}
              isConfirmed={isConfirmed}
              isApproving={needsApproval}
              isConfirming={isConfirming}
              userBalanceFetching={userBalanceFetching}
              isPending={isPending}
              isApe={isApe}
              useEth={useEth}
              quoteData={amountTokens}
              tokenReceived={tokenReceived}
            />
          </TransactionModal.InfoContainer>
          <TransactionModal.StatSubmitContainer>
            <Show when={!needsApproval && !isConfirmed}>
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
            <Show when={needsApproval && !isConfirmed}>
              <div className="flex w-full justify-between gap-x-1">
                <div className="flex items-center gap-x-1">
                  <span className="text-sm text-neutral-300">
                    Approve for maximum amount
                  </span>
                  <ToolTip>
                    Max approval avoids repeat approvals but grants full fund
                    access. Only use with trusted contracts.
                  </ToolTip>
                </div>{" "}
                <Checkbox
                  checked={maxApprove}
                  onCheckedChange={(e) => {
                    setMaxApprove(Boolean(e));
                  }}
                  className="border border-white bg-secondary-600"
                ></Checkbox>
              </div>
            </Show>
            <TransactionModal.SubmitButton
              onClick={modalSubmit}
              disabled={
                (!isValid && !isConfirmed) ||
                isPending ||
                isConfirming ||
                (isConfirmed && needsApproval)
              }
              isPending={isPending}
              loading={isConfirming}
              isConfirmed={isConfirmed && !needsApproval}
            >
              <Show
                when={!needsApproval || isConfirmed}
                fallback={
                  isConfirmed
                    ? "Confirm Mint"
                    : needs0Approval
                      ? "Confirm Remove Approval"
                      : "Confirm Approve"
                } // if approval confirmed there will be invalidation lag
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
            disabled={false}
            decimals={collateralDecimals ?? 18}
            useEth={useEth}
            setUseEth={(b: boolean) => {
              setUseEth(b);
            }}
            maxTokenIn={badHealth ? undefined : maxTokenIn}
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
        {
          /* Calculator link */
          isApe && (
            <div className="my-2 flex w-full justify-start">
              <Link className="hover:underline" href={"/leverage-calculator"}>
                <div className="flex flex-row items-center">
                  <IonCalculator className="mr-1 h-5 w-5" />
                  Profit Calculator
                </div>
              </Link>
            </div>
          )
        }
        {/* opacity-0 */}
        <div
          className={`py-3 ${Boolean(disabledInputs && !isLoading) === true ? "" : "opacity-0"}`}
        >
          {/* <Show when={Boolean(disabledInputs && !isLoading)}> */}
          <ErrorMessage>Insufficient liquidity in the vault.</ErrorMessage>
          {/* </Show> */}
        </div>
        <Estimations
          isApe={isApe}
          disabled={!Boolean(amountTokens)}
          ape={formatUnits(amountTokens ?? 0n, collateralDecimals ?? 18)}
        />
        <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0.2 }}>
          <MintFormSubmit.Root>
            <Show when={isApe} fallback={<div className="py-3" />}>
              <p className="pb-2 text-center text-sm text-gray-500 md:w-[450px]">{`SIR mitigates volatility decay and eliminates liquidation risks, but as a new primitive, it isn't risk-free — volatility can still result in losses.`}</p>
            </Show>
            <SubmitButton
              disabled={!isValid}
              onClick={() => {
                if (isValid) {
                  setOpenTransactionModal(true);
                }
              }}
            >
              <Show when={!needsApproval} fallback={"Approve"}>
                <div className="flex items-center gap-x-1">
                  <span>{isApe ? "Go Long" : "Provide Liquidity"}</span>
                  <span>{isApe ? <FxemojiMonkeyface /> : <NotoTeapot />}</span>
                </div>
              </Show>
            </SubmitButton>
            <MintFormSubmit.FeeInfo
              error={formState.errors.root?.message}
              feeValue={parseAddress(longInput)}
              isValid={isValid}
              feeAmount={`${formatNumber(
                parseFloat(deposit ?? "0") * (parseFloat(fee ?? "0") / 100),
              )} ${depositTokenSymbol}`}
              feePercent={fee}
              deposit={deposit}
            />
          </MintFormSubmit.Root>
        </motion.div>
      </form>
    </Card>
  );
}
