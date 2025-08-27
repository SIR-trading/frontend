"use client";
import React, { useCallback, useMemo, useState } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { motion } from "motion/react";
import { formatUnits, parseUnits } from "viem";
import { type TVaults } from "@/lib/types";
import DepositInputs from "./deposit-inputs";
import VaultParamsInputSelects from "./vaultParamsInputSelects";
import { useQuoteMint } from "./hooks/useQuoteMint";
import useSetRootError from "./hooks/useSetRootError";
import { Card } from "@/components/ui/card";
import { parseAddress } from "@/lib/utils";
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
import { useCalculateMaxApe } from "./hooks/useCalculateMaxApe";
import useCalculateVaultHealth from "../vaultTable/hooks/useCalculateVaultHealth";
import { useFilterVaults } from "./hooks/useFilterVaults";
import { useMintFormValidation } from "./hooks/useMintFormValidation";
import Dropdown from "@/components/shared/dropDown";
import { useIsWeth } from "./hooks/useIsWeth";
import useSetDepositTokenDefault from "./hooks/useSetDepositTokenDefault";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
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
import useVaultFilterStore from "@/lib/store";

interface Props {
  vaultsQuery?: TVaults;
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
    collateralDecimals,
    depositDecimals,
  } = useGetFormTokensInfo();
  const isWeth = useIsWeth();
  const setDepositToken = useVaultFilterStore((state) => state.setDepositToken);

  // Ensure use eth toggle is not used on non-weth tokens
  const { setError, formState, watch, handleSubmit, setValue } =
    useFormContext<TMintFormFields>();
  const { deposit, leverageTier, long: longInput, versus: versusInput } = watch();
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
  
  // Parse token info safely
  const longTokenAddress = longInput ? longInput.split(",")[0] : "";
  const longTokenSymbol = longInput ? longInput.split(",")[1] : "";
  const versusTokenAddress = versusInput ? versusInput.split(",")[0] : "";
  const versusTokenSymbol = versusInput ? versusInput.split(",")[1] : "";
  
  // Check if we have enough info to show deposit token options
  const hasVaultInfo = Boolean(
    selectedVault.result ?? (longInput && versusInput && leverageTier)
  );

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
  
  // Use different hooks based on whether this is leverage (isApe=true) or liquidity (isApe=false)
  const leverageHookResult = useCalculateMaxApe({
    usingDebtToken,
    collateralDecimals: collateralDecimals ?? 18,
    vaultId: Number.parseInt(selectedVault.result?.vaultId ?? "-1"),
    taxAmount: selectedVault.result?.taxAmount ?? "0",
  });
  
  // Always calculate vault health to check for red status
  const vaultHealthResult = useCalculateVaultHealth({
    vaultId: Number.parseInt(selectedVault.result?.vaultId ?? "-1"),
    isApe: true,
    leverageTier: selectedVault.result?.leverageTier,
    apeCollateral: selectedVault.result?.apeCollateral,
    teaCollateral: selectedVault.result?.teaCollateral,
  });
  
  // Determine which results to use based on page type
  const { maxCollateralIn, maxDebtIn, isLoading } = isApe 
    ? leverageHookResult 
    : { 
        maxCollateralIn: undefined, 
        maxDebtIn: undefined, 
        isLoading: vaultHealthResult.isLoading 
      };
  const maxIn = usingDebtToken ? maxDebtIn : maxCollateralIn;
  
  // Check if vault is already in red status (only when vault is selected and data is loaded)
  const isVaultRed = useMemo(() => {
    if (!selectedVault.result?.vaultId || vaultHealthResult.isLoading) return false;
    return vaultHealthResult.variant === "red";
  }, [selectedVault.result?.vaultId, vaultHealthResult.variant, vaultHealthResult.isLoading]);
  
  // Check if user's input exceeds the optimal amount for constant leverage
  const isExceedingOptimal = useMemo(() => {
    if (!isApe || !maxIn || !deposit) return false;
    const depositAmount = parseUnits(deposit, depositDecimals ?? 18);
    return depositAmount > maxIn;
  }, [isApe, maxIn, deposit, depositDecimals]);
  const { isValid, errorMessage } = useMintFormValidation({
    ethBalance: userEthBalance,
    decimals: depositDecimals ?? 18,
    useEth,
    requests,
    tokenBalance: userBalance?.tokenBalance?.result,
    tokenAllowance: userBalance?.tokenAllowance?.result,
    mintFetching: isMintFetching,
    approveFetching: isApproveFetching,
  });

  useSetRootError({
    setError: setError,
    errorMessage,
    rootErrorMessage: formState.errors.root?.message,
  });
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

  useResetAfterApprove({
    isConfirmed,
    reset,
    needsApproval,
  });
  const depositTokenSymbol = !usingDebtToken
    ? selectedVault.result?.collateralSymbol
    : selectedVault.result?.debtSymbol;
  return (
    <Card>
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
                  value={
                    <span>
                      <DisplayFormattedNumber
                        num={fee ? fee.toString() : "0"}
                      />
                      <span>%</span>
                    </span>
                  }
                />
                <TransactionModal.StatRow
                  title="Fee Amount"
                  value={
                    <span>
                      <DisplayFormattedNumber
                        num={(parseFloat(deposit ?? "0") * (parseFloat(fee ?? "0") / 100)).toString()}
                      />
                      <span className="ml-1">{depositTokenSymbol ?? ""}</span>
                    </span>
                  }
                />

                <div className="text-gray-400 flex w-full   justify-start text-[14px]">
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
            <Show when={needsApproval && !needs0Approval && !isConfirmed}>
              <div className="flex w-full justify-between gap-x-1">
                <div className="flex items-center gap-x-1">
                  <span className="text-sm text-foreground/60">
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
                  className="border border-foreground bg-foreground/5"
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
            inputLoading={isLoading ?? false}
            disabled={false}
            decimals={collateralDecimals ?? 18}
            useEth={useEth}
            setUseEth={(b: boolean) => {
              setUseEth(b);
            }}
            balance={formatUnits(balance ?? 0n, depositDecimals ?? 18)}
          >
            <Dropdown.Root
              colorScheme="dark"
              name="depositToken"
              title=""
              disabled={!hasVaultInfo}
              onChange={setDepositToken}
            >
              <Show when={hasVaultInfo}>
                <Dropdown.Item
                  tokenAddress={selectedVault.result?.collateralToken ?? longTokenAddress ?? ""}
                  value={selectedVault.result?.collateralToken ?? longTokenAddress ?? ""}
                >
                  {selectedVault.result?.collateralSymbol ?? longTokenSymbol ?? ""}
                </Dropdown.Item>
                <Dropdown.Item
                  tokenAddress={selectedVault.result?.debtToken ?? versusTokenAddress ?? ""}
                  value={selectedVault.result?.debtToken ?? versusTokenAddress ?? ""}
                >
                  {selectedVault.result?.debtSymbol ?? versusTokenSymbol ?? ""}
                </Dropdown.Item>
              </Show>
            </Dropdown.Root>
          </DepositInputs.Inputs>
        </DepositInputs.Root>
        
        {/* Warning when vault is already in red status */}
        <Show when={isApe && isVaultRed}>
          <div className="my-3 rounded-md border border-orange-500/50 bg-orange-500/10 p-3">
            <div className="flex items-start gap-2">
              <div className="text-orange-500">⚠️</div>
              <div className="text-sm">
                <strong className="text-orange-300">Leverage Variability Warning:</strong>
                <span className="text-foreground/80 ml-1">
                  This vault has limited liquidity. The non-constant leverage could impact your returns, especially in volatile markets.
                </span>
              </div>
            </div>
          </div>
        </Show>
        
        {/* Warning when exceeding optimal amount for constant leverage (only show if vault is not red) */}
        <Show when={isExceedingOptimal && !isVaultRed}>
          <div className="my-3 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3">
            <div className="flex items-start gap-2">
              <div className="text-yellow-500">⚠️</div>
              <div className="text-sm text-yellow-200">
                <strong>Leverage Variability Warning:</strong> The amount you&apos;ve entered exceeds the vault&apos;s optimal liquidity threshold of{" "}
                <button
                  type="button"
                  onClick={() => {
                    const maxAmount = formatUnits(maxIn ?? 0n, depositDecimals ?? 18);
                    setValue("deposit", maxAmount);
                  }}
                  className="font-bold text-yellow-100 underline hover:text-white transition-colors"
                >
                  <span>
                    <DisplayFormattedNumber 
                      num={formatUnits(maxIn ?? 0n, depositDecimals ?? 18)} 
                    />
                    {" "}{depositTokenSymbol}
                  </span>
                </button>. 
                Beyond this point, your leverage ratio may not remain constant and could vary with market conditions.
              </div>
            </div>
          </div>
        </Show>
        
        {
          /* Calculator link */
          isApe && (
            <div className="my-2 flex w-full justify-start">
              <Link className="hover:underline" href={"/leverage-calculator"}>
                <div className="flex flex-row items-center text-foreground">
                  <IonCalculator className="mr-1 h-5 w-5" />
                  Profit Calculator
                </div>
              </Link>
            </div>
          )
        }
        <Estimations
          isApe={isApe}
          disabled={!Boolean(amountTokens)}
          ape={formatUnits(amountTokens ?? 0n, collateralDecimals ?? 18)}
        />
        <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0.2 }}>
          <MintFormSubmit.Root>
            <Show when={isApe} fallback={<div className="py-3" />}>
              <p className="py-2 text-left text-sm text-foreground">{`SIR mitigates volatility decay and eliminates liquidation risks, but as a new primitive, it isn't risk-free — volatility can still result in losses.`}</p>
            </Show>

            <MintFormSubmit.FeeInfo
              error={formState.errors.root?.message}
              feeValue={parseAddress(longInput)}
              isValid={isValid}
              feeAmount={(parseFloat(deposit ?? "0") * (parseFloat(fee ?? "0") / 100)).toString()}
              feePercent={fee}
              symbol={depositTokenSymbol}
              deposit={deposit}
            />
          </MintFormSubmit.Root>
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
        </motion.div>
      </form>
    </Card>
  );
}
