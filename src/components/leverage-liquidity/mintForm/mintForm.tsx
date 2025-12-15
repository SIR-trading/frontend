"use client";
import React, { useCallback, useMemo, useState, useEffect } from "react";
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
import { VaultContract } from "@/contracts/vault";
import { formatDataInput } from "@/lib/utils/index";
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
import { WRAPPED_NATIVE_TOKEN_ADDRESS } from "@/data/constants";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import { useFormContext } from "react-hook-form";
import { useFindVault } from "./hooks/useFindVault";
import useIsDebtToken from "./hooks/useIsDebtToken";
import useGetFormTokensInfo from "./hooks/useGetUserBals";
import { useVaultProvider } from "@/components/providers/vaultProvider";
import SubmitButton from "@/components/shared/submitButton";
import { FxemojiMonkeyface } from "@/components/ui/icons/monkey-icon";
import { NotoTeapot } from "@/components/ui/icons/teapot-icon";
import { Checkbox } from "@/components/ui/checkbox";
import ToolTip from "@/components/ui/tooltip";
import useVaultFilterStore from "@/lib/store";
import { api } from "@/trpc/react";
import {
  calculateBreakevenTime,
  calculateValueGainFromPriceGain,
} from "@/lib/utils/breakeven";
import { PriceIncreaseDisplay } from "@/components/portfolio/burnTable/PriceIncreaseDisplay";
import { TimeDisplay } from "@/components/portfolio/burnTable/TimeDisplay";
import { getLeverageRatio } from "@/lib/utils/calculations";
import { VaultUrlSync } from "./VaultUrlSync";
import ConvexReturnsChart from "./ConvexReturnsChart";
import buildData from "@/../public/build-data.json";

const BASE_FEE = buildData.systemParams.baseFee;

interface Props {
  vaultsQuery?: TVaults;
  isApe: boolean;
}

/**
 * Contains form actions and validition.
 */
export default function MintForm({ isApe }: Props) {
  const [useNativeTokenRaw, setUseNativeToken] = useState(false);
  const { vaults: vaultsQuery } = useVaultProvider();
  const {
    userNativeTokenBalance,
    userBalance,
    collateralDecimals,
    depositDecimals,
  } = useGetFormTokensInfo();
  const isWeth = useIsWeth();
  const setDepositToken = useVaultFilterStore((state) => state.setDepositToken);

  // Reset and auto-enable native token toggle based on token selection and balances
  useEffect(() => {
    // Reset to default (false = wrapped token)
    setUseNativeToken(false);

    // Then auto-enable only if it's WETH, wrapped balance is 0, and native balance > 0
    if (
      isWeth &&
      userBalance?.tokenBalance?.result === 0n &&
      userNativeTokenBalance &&
      userNativeTokenBalance > 0n
    ) {
      setUseNativeToken(true);
    }
  }, [isWeth, userBalance?.tokenBalance?.result, userNativeTokenBalance]);

  // Ensure use eth toggle is not used on non-weth tokens
  const { setError, formState, watch, handleSubmit, setValue } =
    useFormContext<TMintFormFields>();
  const {
    deposit,
    leverageTier,
    long: longInput,
    versus: versusInput,
    depositToken,
    slippage,
  } = watch();
  const useNativeToken = useMemo(() => {
    return isWeth ? useNativeTokenRaw : false;
  }, [isWeth, useNativeTokenRaw]);

  const { amountTokens, amountCollateral, amountCollateralIdeal } =
    useQuoteMint({
      isApe,
      decimals: depositDecimals ?? 0,
    });

  const selectedVault = useFindVault();
  const [maxApprove, setMaxApprove] = useState(false);
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
    selectedVault.result ?? (longInput && versusInput && leverageTier),
  );

  const {
    writeContract,
    data: hash,
    isPending,
    reset,
    error: writeError,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: transactionData,
  } = useWaitForTransactionReceipt({ hash });

  const { requests, isApproveFetching, needsApproval, needs0Approval } =
    useTransactions({
      depositToken: depositToken ?? "",
      deposit: deposit ?? "0",
      useNativeToken,
      maxApprove,
      tokenAllowance: userBalance?.tokenAllowance?.result,
      decimals: depositDecimals ?? 18,
    });

  useSetDepositTokenDefault({
    collToken: selectedVault.result?.collateralToken.id,
  });
  const { tokenReceived } = useGetReceivedTokens({
    apeAddress: selectedVault.result?.ape.id ?? "0x",
    logs: transactionData?.logs,
    isApe,
  });
  // Invalidate if approve or mint tx is successful.
  const [currentTxType, setCurrentTxType] = useState<
    // Used to know which
    "approve" | "mint" | undefined
  >();
  useFormSuccessReset({
    isConfirmed,
    currentTxType,
    useNativeToken,
    txBlock: parseInt(transactionData?.blockNumber.toString() ?? "0"),
  });
  const usingDebtToken = useIsDebtToken();

  // Always calculate vault health to check for red status
  const vaultHealthResult = useCalculateVaultHealth({
    vaultId: Number.parseInt(selectedVault.result?.id ?? "-1"),
    isApe: true,
    leverageTier: selectedVault.result?.leverageTier,
    apeCollateral: selectedVault.result
      ? BigInt(selectedVault.result.reserveApes || 0)
      : undefined,
    teaCollateral: selectedVault.result
      ? BigInt(selectedVault.result.reserveLPers || 0)
      : undefined,
  });

  // Check if vault is already in red status (only when vault is selected and data is loaded)
  const isVaultRed = useMemo(() => {
    if (!selectedVault.result?.id || vaultHealthResult.isLoading) return false;
    return vaultHealthResult.variant === "red";
  }, [
    selectedVault.result?.id,
    vaultHealthResult.variant,
    vaultHealthResult.isLoading,
  ]);

  // Only calculate max amounts for leverage page when vault is not red
  // For red vaults, we don't need these calculations as the vault already has insufficient liquidity
  const shouldCalculateMax = isApe && !isVaultRed;

  const leverageHookResult = useCalculateMaxApe({
    usingDebtToken,
    collateralDecimals: collateralDecimals ?? 18,
    vaultId: shouldCalculateMax
      ? Number.parseInt(selectedVault.result?.id ?? "-1")
      : -1,
    taxAmount: selectedVault.result?.tax ?? "0",
  });

  // Determine which results to use based on page type and vault status
  const { maxCollateralIn, maxDebtIn } = shouldCalculateMax
    ? leverageHookResult
    : {
        maxCollateralIn: undefined,
        maxDebtIn: undefined,
      };
  const maxIn = usingDebtToken ? maxDebtIn : maxCollateralIn;

  // Check if user's input exceeds the optimal amount for constant leverage
  const isExceedingOptimal = useMemo(() => {
    if (!isApe || !maxIn || !deposit) return false;
    const depositAmount = parseUnits(deposit, depositDecimals ?? 18);
    return depositAmount > maxIn;
  }, [isApe, maxIn, deposit, depositDecimals]);

  // Calculate minimum collateral based on user's slippage setting
  const minCollateralOut = useMemo(() => {
    if (!amountCollateralIdeal || amountCollateralIdeal === 0n) return 0n;

    const trimmedSlippage = slippage?.trim() ?? "0.5";
    // Handle edge cases like "." or empty values
    const userSlippage = parseFloat(trimmedSlippage) || 0.5;
    const slippageBasisPoints = Math.floor(userSlippage * 100);
    const slippageAmount =
      (amountCollateralIdeal * BigInt(slippageBasisPoints)) / 10000n;
    return amountCollateralIdeal - slippageAmount;
  }, [amountCollateralIdeal, slippage]);

  // Calculate expected slippage and check if user's slippage is sufficient
  const slippageWarning = useMemo(() => {
    if (
      !amountCollateralIdeal ||
      !amountCollateral ||
      amountCollateralIdeal === 0n
    ) {
      return null;
    }

    // Calculate the actual/expected slippage from market conditions
    const expectedSlippageAmount = amountCollateralIdeal - amountCollateral;
    const expectedSlippagePercent =
      Number((expectedSlippageAmount * 10000n) / amountCollateralIdeal) / 100;

    // Get user's selected slippage (handle edge cases like "." or empty values)
    const trimmedSlippage = slippage?.trim() ?? "0.5";
    const userSlippage = parseFloat(trimmedSlippage) || 0.5;

    // Check if expected slippage exceeds 40% - prevent minting
    if (expectedSlippagePercent > 40) {
      return {
        showWarning: false,
        showError: true,
        expectedSlippage: expectedSlippagePercent.toFixed(1),
        userSlippage: userSlippage.toFixed(1),
        errorMessage: `Estimated slippage of ${expectedSlippagePercent.toFixed(1)}% exceeds the maximum allowed 40%. Please reduce your deposit amount or try a different vault.`,
      };
    }

    // Check if user's slippage is less than expected slippage * 1.2 (20% buffer)
    // Round up to 1 decimal place
    const minimumRequiredSlippage =
      Math.ceil(expectedSlippagePercent * 1.2 * 10) / 10; // 20% buffer, rounded up

    if (userSlippage < minimumRequiredSlippage) {
      return {
        showWarning: true,
        showError: false,
        expectedSlippage: expectedSlippagePercent.toFixed(1),
        suggestedSlippage: minimumRequiredSlippage.toFixed(1),
        userSlippage: userSlippage.toFixed(1),
      };
    }

    return null;
  }, [amountCollateralIdeal, amountCollateral, slippage]);

  const { openTransactionModal, setOpenTransactionModal } =
    useResetTransactionModal({ reset, isConfirmed });

  const onSubmit = useCallback(() => {
    if (requests.approveWriteRequest && needsApproval) {
      setCurrentTxType("approve");
      writeContract(requests.approveWriteRequest);
      return;
    }

    // Create mint request using the quote data
    // Check if we're depositing the debt token (either as ERC20 or native ETH)
    const debtTokenAddress = versusInput.split(",")[0];
    const isDebtTokenDeposit =
      depositToken === debtTokenAddress && versusInput !== "";

    // When using ETH and the debt token is WETH, it's also a debt token deposit
    const isNativeDebtTokenDeposit =
      useNativeToken &&
      debtTokenAddress?.toLowerCase() ===
        WRAPPED_NATIVE_TOKEN_ADDRESS.toLowerCase();
    const isAnyDebtTokenDeposit =
      isDebtTokenDeposit || isNativeDebtTokenDeposit;

    // Use the calculated minCollateralOut based on user's slippage
    const minCollateralOutWithSlippage = isAnyDebtTokenDeposit
      ? minCollateralOut
      : 0n;

    const mintRequest = {
      address: VaultContract.address,
      abi: VaultContract.abi,
      functionName: "mint" as const,
      args: [
        isApe,
        {
          debtToken: formatDataInput(versusInput),
          collateralToken: formatDataInput(longInput),
          leverageTier: Number(leverageTier),
        },
        useNativeToken ? 0n : parseUnits(deposit ?? "0", depositDecimals ?? 18),
        minCollateralOutWithSlippage,
        Math.floor(Date.now() / 1000) + 600, // 10 minutes deadline
      ],
      value: useNativeToken
        ? parseUnits(deposit ?? "0", depositDecimals ?? 18)
        : 0n,
    };

    setCurrentTxType("mint");
    // @ts-expect-error - writeContract types are complex, but this matches the expected shape
    writeContract(mintRequest);
  }, [
    needsApproval,
    requests.approveWriteRequest,
    writeContract,
    isApe,
    versusInput,
    longInput,
    leverageTier,
    deposit,
    depositDecimals,
    useNativeToken,
    depositToken,
    minCollateralOut,
  ]);

  let balance = userBalance?.tokenBalance?.result;
  if (useNativeToken) {
    balance = userNativeTokenBalance;
  }

  const { isValid, errorMessage } = useMintFormValidation({
    nativeTokenBalance: userNativeTokenBalance,
    decimals: depositDecimals ?? 18,
    useNativeToken,
    requests,
    tokenBalance: userBalance?.tokenBalance?.result,
    tokenAllowance: userBalance?.tokenAllowance?.result,
    approveFetching: isApproveFetching,
    hasValidQuote: Boolean(amountTokens && amountTokens > 0n),
  });

  useSetRootError({
    setError: setError,
    errorMessage,
    rootErrorMessage: formState.errors.root?.message,
  });

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
    ? selectedVault.result?.collateralToken.symbol
    : selectedVault.result?.debtToken.symbol;

  const collateralTokenSymbol =
    selectedVault.result?.collateralToken.symbol ?? "";
  const debtTokenSymbol = selectedVault.result?.debtToken.symbol ?? "";

  // Fetch APY for TEA positions
  const { data: apyData } = api.vault.getVaultApy.useQuery(
    { vaultId: selectedVault.result?.id ?? "" },
    {
      enabled: !isApe && Boolean(selectedVault.result?.id),
      staleTime: 60000, // Cache for 1 minute
    },
  );

  // Fetch current market price for convex returns chart (APE only)
  const { data: poolPrice } = api.quote.getMostLiquidPoolPrice.useQuery(
    {
      tokenA: selectedVault.result?.collateralToken.id ?? "",
      tokenB: selectedVault.result?.debtToken.id ?? "",
      decimalsA: selectedVault.result?.collateralToken.decimals,
      decimalsB: selectedVault.result?.debtToken.decimals,
    },
    {
      enabled:
        isApe &&
        Boolean(
          selectedVault.result?.collateralToken.id &&
            selectedVault.result?.debtToken.id &&
            selectedVault.result?.collateralToken.decimals &&
            selectedVault.result?.debtToken.decimals,
        ),
      staleTime: 60000, // Cache for 1 minute
    },
  );

  // Calculate collateral amount after fees (for stats display)
  const collateralAmountAfterFees = useMemo(() => {
    if (!deposit || !fee || !depositDecimals) return undefined;

    const depositAmount = parseFloat(deposit);
    const feePercent = parseFloat(fee) / 100;
    const amountAfterFees = depositAmount * (1 - feePercent);

    return amountAfterFees;
  }, [deposit, fee, depositDecimals]);

  // Calculate stats for Required Price Gain or Required Time
  const stats = useMemo(() => {
    // Check if we have valid values to calculate stats
    if (
      !deposit ||
      parseFloat(deposit) === 0 ||
      !fee ||
      !collateralAmountAfterFees ||
      collateralAmountAfterFees === 0
    ) {
      return null;
    }

    const initialDeposit = parseFloat(deposit); // What user actually deposits
    const collateralValue = collateralAmountAfterFees; // What they get after fees

    if (isApe && leverageTier !== undefined && leverageTier !== "") {
      const leverageTierNum = parseFloat(leverageTier);
      if (!isFinite(leverageTierNum)) return null;

      // Convert leverageTier (k) to actual leverage ratio (1 + 2^k)
      const leverage = getLeverageRatio(leverageTierNum);

      // Get fee percentage
      const feePercent = parseFloat(fee ?? "0");

      // Calculate value gains for fixed price gains
      // Fixed price gains: +50%, +100%, +400%
      const priceGains = [50, 100, 400];

      const gains = priceGains.map((priceGain) => ({
        priceGain,
        debtGain: calculateValueGainFromPriceGain(
          priceGain,
          leverage,
          feePercent,
        ),
      }));

      return {
        type: "priceGain" as const,
        gains,
      };
    } else if (!isApe && apyData?.apy !== undefined) {
      // Calculate Required Time for TEA tokens
      if (apyData.apy === 0) {
        return {
          type: "time" as const,
          breakeven: Infinity,
          double: Infinity,
          tenx: Infinity,
        };
      }

      // Break-even: time to recover initial deposit from post-fee amount
      const breakeven = calculateBreakevenTime(
        initialDeposit, // target
        collateralValue, // current (post-fee)
        apyData.apy,
      );

      const double = calculateBreakevenTime(
        initialDeposit * 2,
        collateralValue,
        apyData.apy,
      );

      const tenx = calculateBreakevenTime(
        initialDeposit * 10,
        collateralValue,
        apyData.apy,
      );

      return {
        type: "time" as const,
        breakeven: breakeven ?? 0,
        double: double,
        tenx: tenx,
      };
    }

    return null;
  }, [
    collateralAmountAfterFees,
    deposit,
    isApe,
    leverageTier,
    apyData?.apy,
    fee,
  ]);

  return (
    <Card className="relative overflow-visible h-full">
      {/* Handle vault URL synchronization (wrapped in Suspense for SSR) */}
      <VaultUrlSync />
      <form onSubmit={handleSubmit(onSubmit)}>
        <TransactionModal.Root
          title="Mint"
          setOpen={(open) => {
            setOpenTransactionModal(open);
            // Reset the write error when closing the modal
            if (!open && writeError) {
              reset();
            }
          }}
          open={openTransactionModal}
        >
          <TransactionModal.Close
            setOpen={(open) => {
              setOpenTransactionModal(open);
              // Reset the write error when closing the modal
              if (!open && writeError) {
                reset();
              }
            }}
          />
          <TransactionModal.InfoContainer
            isConfirming={isConfirming}
            hash={hash}
          >
            <TransactionInfo
              needs0Approval={needs0Approval ?? false}
              transactionHash={hash}
              needsApproval={needsApproval}
              vaultId={selectedVault.result?.id ?? "0"}
              decimals={collateralDecimals ?? 18}
              isConfirmed={isConfirmed}
              isApproving={needsApproval}
              isConfirming={isConfirming}
              userBalanceFetching={false}
              isPending={isPending}
              isApe={isApe}
              useNativeToken={useNativeToken}
              quoteData={amountTokens}
              tokenReceived={tokenReceived}
            />
            {writeError &&
              !isConfirming &&
              !isConfirmed &&
              (() => {
                // Check if this is a simulation error (not user rejection)
                const errorMessage = writeError.message || "";
                const isUserRejection =
                  errorMessage.toLowerCase().includes("user rejected") ||
                  errorMessage.toLowerCase().includes("user denied") ||
                  errorMessage.toLowerCase().includes("rejected the request");

                // Only show error for simulation failures, not user rejections
                if (!isUserRejection) {
                  return (
                    <div className="mt-3 px-4">
                      <p
                        className="text-center text-xs"
                        style={{ color: "#ef4444" }}
                      >
                        Transaction simulation failed. Please check your inputs
                        and try again.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
          </TransactionModal.InfoContainer>
          <div className="mx-4 border-t border-foreground/10" />
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
                        num={(
                          parseFloat(deposit ?? "0") *
                          (parseFloat(fee ?? "0") / 100)
                        ).toString()}
                      />
                      <span className="ml-1">{depositTokenSymbol ?? ""}</span>
                    </span>
                  }
                />

                <div className="mt-1 text-[10px] text-muted-foreground">
                  {isApe
                    ? "You pay a one-time fee. No recurring fees are charged while holding APE tokens regardless of the duration."
                    : "As an LPer, you pay a one-time fee to mitigate some types of economic attacks, which you will recover over time as you earn fees."}
                </div>

                {/* Stats for Required Price Gain or Required Time */}
                {stats && (
                  <>
                    <div className="mt-2 border-t border-foreground/10 pt-2" />
                    {stats.type === "priceGain" ? (
                      <>
                        {/* Simplified two-column display for APE tokens */}
                        <div className="mb-2 flex justify-between text-[11px]">
                          <div className="text-foreground/70">
                            If {collateralTokenSymbol}/{debtTokenSymbol} gains:
                          </div>
                          <div className="text-foreground/70">
                            Your position gains:
                          </div>
                        </div>

                        {/* Display each price gain and corresponding debt token gain */}
                        {stats.gains.map((gain, index) => (
                          <div
                            key={index}
                            className="mb-0.5 flex justify-between text-[13px]"
                          >
                            <div className="text-gray-300">
                              +{gain.priceGain}%
                            </div>
                            <div>
                              <PriceIncreaseDisplay
                                percentage={gain.debtGain}
                              />
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        {/* Single column for TEA tokens */}
                        <TransactionModal.StatRow
                          title="Time to Break-Even"
                          value={<TimeDisplay days={stats.breakeven} />}
                        />
                        <TransactionModal.StatRow
                          title="Time to 2x"
                          value={<TimeDisplay days={stats.double} />}
                        />
                        <TransactionModal.StatRow
                          title="Time to 10x"
                          value={<TimeDisplay days={stats.tenx} />}
                        />
                      </>
                    )}
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {isApe
                        ? `Position gains calculated in ${debtTokenSymbol} terms, assuming constant leverage.`
                        : "Time calculations assume price and APY remain constant"}
                    </div>
                  </>
                )}
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
              disabled={useMemo(() => {
                // Disable while confirming
                if (isConfirming) return true;

                if (writeError && !isConfirming && !isConfirmed) {
                  const errorMessage = writeError.message || "";
                  const isUserRejection =
                    errorMessage.toLowerCase().includes("user rejected") ||
                    errorMessage.toLowerCase().includes("user denied") ||
                    errorMessage.toLowerCase().includes("rejected the request");
                  // Disable button only for simulation failures, not user rejections
                  return !isUserRejection;
                }
                return false;
              }, [writeError, isConfirming, isConfirmed])}
              isPending={false}
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
            inputLoading={false}
            disabled={false}
            decimals={collateralDecimals ?? 18}
            useNativeToken={useNativeToken}
            setUseNativeToken={(b: boolean) => {
              setUseNativeToken(b);
            }}
            balance={formatUnits(balance ?? 0n, depositDecimals ?? 18)}
          >
            <Dropdown.Root
              colorScheme="dark"
              name="depositToken"
              title=""
              disabled={!hasVaultInfo}
              onChange={setDepositToken}
              useNativeToken={useNativeToken}
            >
              <Show when={hasVaultInfo}>
                <Dropdown.Item
                  tokenAddress={
                    selectedVault.result?.collateralToken.id ??
                    longTokenAddress ??
                    ""
                  }
                  value={
                    selectedVault.result?.collateralToken.id ??
                    longTokenAddress ??
                    ""
                  }
                >
                  {selectedVault.result?.collateralToken.symbol ??
                    longTokenSymbol ??
                    ""}
                </Dropdown.Item>
                <Dropdown.Item
                  tokenAddress={
                    selectedVault.result?.debtToken.id ??
                    versusTokenAddress ??
                    ""
                  }
                  value={
                    selectedVault.result?.debtToken.id ??
                    versusTokenAddress ??
                    ""
                  }
                >
                  {selectedVault.result?.debtToken.symbol ??
                    versusTokenSymbol ??
                    ""}
                </Dropdown.Item>
              </Show>
            </Dropdown.Root>
          </DepositInputs.Inputs>
        </DepositInputs.Root>

        {/* Convex Returns Chart - only show for APE */}
        {isApe && (
          selectedVault.result &&
          poolPrice?.price &&
          poolPrice.price > 0 &&
          selectedVault.result.reserveLPers !== "0" ? (
            <ConvexReturnsChart
              leverageTier={parseFloat(leverageTier ?? "0")}
              baseFee={BASE_FEE}
              apeReserve={BigInt(selectedVault.result.reserveApes || 0)}
              teaReserve={BigInt(selectedVault.result.reserveLPers || 0)}
              currentPrice={poolPrice.price}
              collateralSymbol={collateralTokenSymbol}
              debtSymbol={debtTokenSymbol}
              depositAmount={
                usingDebtToken && poolPrice.price > 0
                  ? parseFloat(deposit ?? "0") / poolPrice.price
                  : parseFloat(deposit ?? "0")
              }
              tax={parseInt(selectedVault.result.tax ?? "0")}
              collateralDecimals={selectedVault.result.collateralToken.decimals}
            />
          ) : (
            <div className="pt-2">
              <h4 className="text-sm text-foreground">Potential Returns</h4>
              <div className="pt-1"></div>
              <div className="rounded-md bg-primary/5 p-4 dark:bg-primary">
                <p className="text-sm text-on-bg-subdued">
                  Select a vault to see returns chart
                </p>
              </div>
            </div>
          )
        )}

        {/* Warning when vault has 0 LP liquidity (check actual reserves, not USD value) */}
        <Show when={!!(isApe && selectedVault.result && selectedVault.result.reserveLPers === "0")}>
          <div className="bg-orange-500/10 my-3 rounded-md border-2 border-foreground/20 p-3">
            <div className="flex items-start gap-2">
              <div className="text-orange-500">⚠️</div>
              <div className="text-sm">
                <strong className="text-orange-300">Warning:</strong>
                <span className="ml-1 text-foreground/80">
                  This vault has no liquidity. You cannot make any leverage gains without LPers providing liquidity first. Consider providing liquidity on the Liquidity page before taking a leveraged position.
                </span>
              </div>
            </div>
          </div>
        </Show>

        {/* Warning when vault has limited liquidity (red status but has some LP reserves) */}
        <Show when={!!(isApe && isVaultRed && selectedVault.result && selectedVault.result.reserveLPers !== "0")}>
          <div className="bg-orange-500/10 my-3 rounded-md border-2 border-foreground/20 p-3">
            <div className="flex items-start gap-2">
              <div className="text-orange-500">⚠️</div>
              <div className="text-sm">
                <strong className="text-orange-300">Warning:</strong>
                <span className="ml-1 text-foreground/80">
                  Because this vault has limited liquidity, its leverage may
                  vary over time, potentially eroding long-term returns.
                </span>
              </div>
            </div>
          </div>
        </Show>

        {/* Warning when exceeding optimal amount for constant leverage (only show if vault is not red) */}
        <Show when={isExceedingOptimal && !isVaultRed}>
          <div className="bg-yellow-500/10 my-3 rounded-md border-2 border-foreground/20 p-3">
            <div className="flex items-start gap-2">
              <div className="text-yellow-500">⚠️</div>
              <div className="text-yellow-200 text-sm">
                <strong>Leverage Variability Warning:</strong>
                <span className="text-foreground/80">
                  The amount you&apos;ve entered exceeds the vault&apos;s
                  optimal liquidity threshold of{" "}
                  <button
                    type="button"
                    onClick={() => {
                      const maxAmount = formatUnits(
                        maxIn ?? 0n,
                        depositDecimals ?? 18,
                      );
                      setValue("deposit", maxAmount);
                    }}
                    className="text-yellow-100 font-bold underline transition-colors hover:text-white"
                  >
                    <span>
                      <DisplayFormattedNumber
                        num={formatUnits(maxIn ?? 0n, depositDecimals ?? 18)}
                      />{" "}
                      {depositTokenSymbol}
                    </span>
                  </button>
                  . Beyond this point, your leverage ratio may not remain
                  constant and could vary with market conditions.
                </span>
              </div>
            </div>
          </div>
        </Show>

        {/* Warning when slippage tolerance is too low */}
        <Show when={slippageWarning?.showWarning ?? false}>
          <div className="bg-amber-500/10 my-3 rounded-md border-2 border-foreground/20 p-3">
            <div className="flex items-start gap-2">
              <div className="text-amber-500">⚠️</div>
              <div className="text-sm">
                <strong className="text-amber-300">Slippage Warning:</strong>
                <span className="ml-1 text-foreground/80">
                  Current market slippage is approximately{" "}
                  {slippageWarning?.expectedSlippage}%. Your setting of{" "}
                  {slippageWarning?.userSlippage}% may be insufficient. Consider
                  increasing it to{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setValue(
                        "slippage",
                        slippageWarning?.suggestedSlippage ?? "0.5",
                      );
                    }}
                    className="text-amber-100 font-bold underline transition-colors hover:text-white"
                  >
                    {slippageWarning?.suggestedSlippage}%
                  </button>{" "}
                  or higher to avoid transaction failure.
                </span>
              </div>
            </div>
          </div>
        </Show>

        {/* Error when slippage exceeds 40% */}
        <Show when={slippageWarning?.showError ?? false}>
          <div className="bg-red-500/10 border-red-500/50 my-3 rounded-md border-2 p-3">
            <div className="flex items-start gap-2">
              <div className="text-red-500">🚫</div>
              <div className="text-sm">
                <strong className="text-red-400">Slippage Too High:</strong>
                <span className="ml-1 text-foreground/80">
                  {slippageWarning?.errorMessage}
                </span>
              </div>
            </div>
          </div>
        </Show>

        <Estimations
          isApe={isApe}
          disabled={!Boolean(amountTokens)}
          ape={formatUnits(amountTokens ?? 0n, collateralDecimals ?? 18)}
          vaultId={selectedVault.result?.id}
          leverageTier={leverageTier}
          fee={fee ? parseFloat(fee) : undefined}
          collateralSymbol={collateralTokenSymbol}
          debtSymbol={debtTokenSymbol}
          hasSirRewards={
            !isApe && apyData?.sirRewardsApy !== undefined
              ? apyData.sirRewardsApy > 0
              : undefined
          }
        />

        <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0.2 }}>
          <MintFormSubmit.Root>
            <MintFormSubmit.FeeInfo
              error={formState.errors.root?.message}
              feeValue={parseAddress(longInput)}
              isValid={isValid}
              feeAmount={(
                parseFloat(deposit ?? "0") *
                (parseFloat(fee ?? "0") / 100)
              ).toString()}
              feePercent={fee}
              symbol={depositTokenSymbol ?? undefined}
              deposit={deposit}
            />
          </MintFormSubmit.Root>
          <SubmitButton
            disabled={!isValid || (slippageWarning?.showError ?? false)}
            onClick={() => {
              if (isValid && !slippageWarning?.showError) {
                setOpenTransactionModal(true);
              }
            }}
          >
            <Show
              when={slippageWarning?.showError ?? false}
              fallback={
                <Show when={!needsApproval} fallback={"Approve"}>
                  <span className="flex items-center gap-x-1">
                    <span>{isApe ? "Go Long" : "Provide Liquidity"}</span>
                    <span>
                      {isApe ? <FxemojiMonkeyface /> : <NotoTeapot />}
                    </span>
                  </span>
                </Show>
              }
            >
              <span>Slippage Too High</span>
            </Show>
          </SubmitButton>
        </motion.div>
      </form>
    </Card>
  );
}
