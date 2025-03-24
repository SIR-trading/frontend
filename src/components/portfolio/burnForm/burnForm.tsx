import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck } from "lucide-react";
import { SirContract } from "@/contracts/sir";
import type { UseFormReturn } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/trpc/react";
import { useBurnApe } from "./hooks/useBurnApe";
import { formatUnits, parseUnits } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import type { TUserPosition } from "@/server/queries/vaults";
import { Button } from "@/components/ui/button";
import TransactionModal from "@/components/shared/transactionModal";
import { TransactionEstimates } from "@/components/shared/transactionEstimates";
import TransactionSuccess from "@/components/shared/transactionSuccess";
import { useGetTxTokens } from "./hooks/useGetTxTokens";
import { X } from "lucide-react";
import { TransactionStatus } from "@/components/leverage-liquidity/mintForm/transactionStatus";
import { useClaimTeaRewards } from "./hooks/useClaimTeaRewards";
import { formatNumber } from "@/lib/utils";
import ClaimAndStakeToggle from "./claimAndStakeToggle";
import { DisplayCollateral } from "./displayCollateral";
import { TokenInput } from "./tokenInput";
import { subgraphSyncPoll } from "@/lib/utils/sync";
import { useBurnFormValidation } from "./hooks/useBurnFormValidation";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import ExplorerLink from "@/components/shared/explorerLink";
import ErrorMessage from "@/components/ui/error-message";

const BurnSchema = z.object({
  deposit: z.string().optional(),
});

export type TBurnForm = UseFormReturn<
  { deposit?: string | undefined },
  undefined
>;
export type TBurnFields = { deposit?: string | undefined };

export default function BurnForm({
  balance,
  row,
  isApe,
  close,
  teaRewardBalance,
  isClaiming,
}: {
  balance: bigint | undefined;
  isClaiming: boolean;
  teaRewardBalance: bigint | undefined;
  isApe: boolean;
  row: TUserPosition;
  close: () => void;
  levTier: string;
}) {
  const form = useForm<z.infer<typeof BurnSchema>>({
    resolver: zodResolver(BurnSchema),
  });
  const formData = form.watch();
  const [claimAndStake, setClaimAndStake] = useState(false);
  const { data: quoteBurn } = api.vault.quoteBurn.useQuery(
    {
      amount: formData.deposit ?? "0",
      isApe,
      debtToken: row.debtToken,
      leverageTier: parseInt(row.leverageTier),
      collateralToken: row.collateralToken,
      decimals: row.positionDecimals,
    },
    {
      enabled: Boolean(formData.deposit),
    },
  );

  const { writeContract, reset, data: hash, isPending } = useWriteContract();
  const {
    data: receiptData,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
  });
  const utils = api.useUtils();

  const reward = teaRewardBalance ?? 0n;

  const isClaimingRewards = isClaiming;
  useEffect(() => {
    if (receiptData) {
      if (isApe) {
        utils.user.getApeBalance.invalidate().catch((e) => {
          console.log(e);
        });
      } else {
        if (isClaimingRewards) {
          utils.user.getTeaRewards.invalidate().catch((e) => console.log(e));
          utils.user.getUnstakedSirBalance
            .invalidate()
            .catch((e) => console.log(e));
          utils.user.getTotalSirBalance.invalidate().catch((e) => {
            console.log(e);
          });
        } else {
          utils.user.getTeaBalance.invalidate().catch((e) => {
            console.log(e);
          });
        }
      }

      subgraphSyncPoll(Number.parseInt(receiptData.blockNumber.toString()))
        .then(() => {
          utils.vault.getTableVaults.invalidate().catch((e) => console.log(e));
        })
        .catch((e) => console.log(e));
    }
  }, [
    receiptData,
    utils.user.getApeBalance,
    utils.user.getTotalSirBalance,
    utils.user.getSirTotalSupply,
    utils.user.getUnstakedSirBalance,
    claimAndStake,
    isApe,
    utils.user.getTeaBalance,
    utils.user.getTeaRewards,
    isClaimingRewards,
    utils.vault.getTableVaults,
  ]);

  const { data: burnData } = useBurnApe({
    isApe: isApe,
    data: {
      collateralToken: row.collateralToken,
      debtToken: row.debtToken,
      leverageTier: parseFloat(row.leverageTier),
    },
    amount: parseUnits(
      formData.deposit?.toString() ?? "0",
      row.positionDecimals,
    ),
  });

  const { claimRewardRequest } = useClaimTeaRewards({
    vaultId: parseUnits(row.vaultId, 0),
    claimAndStake,
  });

  useEffect(() => {
    if (isConfirmed) {
      form.setValue("deposit", "");
    }
  }, [form, isConfirmed]);

  const { isValid, error } = useBurnFormValidation(
    formData,
    balance,
    row.positionDecimals,
  );

  const { tokenReceived } = useGetTxTokens({ logs: receiptData?.logs });
  const onSubmit = () => {
    if (isConfirmed) {
      setOpen(false);
      close();
      return;
    }
    if (isClaimingRewards && claimRewardRequest) {
      writeContract(claimRewardRequest);
      return;
    }
    if (burnData?.request) {
      writeContract(burnData.request);
    }
  };
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isConfirmed && !open) {
      reset();
    }
  }, [isConfirmed, reset, open]);

  const submitButtonText = isClaimingRewards ? "Confirm Claim" : "Confirm Burn";

  // let fee = useGetFee({ isApe, levTier });
  // fee = fee ?? "";

  return (
    <FormProvider {...form}>
      <TransactionModal.Root title="Burn" open={open} setOpen={setOpen}>
        <TransactionModal.Close setOpen={setOpen} />
        <TransactionModal.InfoContainer isConfirming={isConfirming} hash={hash}>
          {!isConfirmed && (
            <>
              <TransactionStatus
                action={isClaimingRewards ? "Claim Rewards" : "Burn"}
                waitForSign={isPending}
                showLoading={isConfirming}
              />
              {isClaimingRewards && (
                <div className=" pt-4 ">
                  <div className="space-x-1">
                    <span className="text-lg">
                      <DisplayFormattedNumber
                        num={formatNumber(formatUnits(reward, 12), 8)}
                      />
                    </span>
                    <span className="text-[14px] text-gray-500">SIR</span>
                  </div>
                </div>
              )}
              {!isClaimingRewards && (
                <TransactionEstimates
                  decimals={row.positionDecimals}
                  inAssetName={
                    isApe ? `APE-${row.vaultId}` : `TEA-${row.vaultId}`
                  }
                  outAssetName={row.collateralSymbol}
                  collateralEstimate={quoteBurn}
                  usingEth={false}
                />
              )}
            </>
          )}
          {isConfirmed && isClaimingRewards && (
            <div className="space-y-2">
              <div className="flex justify-center">
                <CircleCheck size={40} color="#F0C775" />
              </div>
              <h2 className="text-center">Transaction Successful!</h2>
              <ExplorerLink transactionHash={hash} />
            </div>
          )}
          {isConfirmed && !isClaimingRewards && (
            <TransactionSuccess
              hash={hash}
              assetAddress={row.collateralToken}
              assetReceived={row.collateralSymbol}
              amountReceived={tokenReceived}
            />
          )}
        </TransactionModal.InfoContainer>
        {/*----*/}
        <TransactionModal.StatSubmitContainer>
          {/* {!isClaimingRewards && !isConfirmed && ( */}
          {/*   <TransactionModal.StatContainer> */}
          {/*     <TransactionModal.StatRow */}
          {/*       title="Fee" */}
          {/*       value={fee + "%"} */}
          {/*     ></TransactionModal.StatRow> */}
          {/*   </TransactionModal.StatContainer> */}
          {/* )} */}
          <TransactionModal.SubmitButton
            disabled={isPending || isConfirming}
            isPending={isPending}
            loading={isConfirming}
            onClick={() => onSubmit()}
            isConfirmed={isConfirmed}
          >
            {submitButtonText}
          </TransactionModal.SubmitButton>
        </TransactionModal.StatSubmitContainer>
      </TransactionModal.Root>
      <form>
        <div className="w-[320px] space-y-2  p-2 md:w-full">
          <div className="flex justify-between">
            {isClaimingRewards && (
              <h2 className="w-full pl-[24px] text-center font-lora text-[24px]">
                Claim
              </h2>
            )}
            {!isClaimingRewards && (
              <h2 className="w-full pl-[24px] text-center font-lora text-[24px]">
                Burn
              </h2>
            )}

            <button
              type="button"
              onClick={() => close()}
              className="cursor-pointer text-white/80 transition-transform hover:scale-105 hover:text-white"
            >
              <X />
            </button>
          </div>

          {!isClaimingRewards && (
            <TokenInput
              positionDecimals={row.positionDecimals}
              balance={balance}
              bg="bg-secondary-600"
              form={form}
              vaultId={row.vaultId}
              isApe={isApe}
            />
          )}
          <div
            data-state={isClaimingRewards ? "claiming" : ""}
            className=" my-2 rounded-md px-4 py-2 data-[state=claiming]:bg-secondary-600"
          >
            <div className="pt-2"></div>
            <div>
              <div>
                <label htmlFor="a" className="">
                  {isClaimingRewards ? "Amount" : "Into"}
                </label>
              </div>

              <DisplayCollateral
                isClaiming={isClaimingRewards}
                data={{
                  leverageTier: parseFloat(row.leverageTier),
                  collateralToken: isClaimingRewards
                    ? SirContract.address
                    : row.collateralToken,
                  debtToken: row.debtToken,
                }}
                amount={
                  isClaimingRewards
                    ? formatUnits(reward, 12)
                    : formatUnits(quoteBurn ?? 0n, row.positionDecimals)
                }
                collateralSymbol={
                  isClaimingRewards ? "SIR" : row.collateralSymbol
                }
                bg=""
              />
            </div>

            {isClaimingRewards && (
              <div className="flex items-center justify-end gap-x-2 py-2">
                <h3 className="text-[14px] text-gray-200">Claim and Stake</h3>

                <ClaimAndStakeToggle
                  onChange={setClaimAndStake}
                  value={claimAndStake}
                />
              </div>
            )}
            <div className="pt-2"></div>
            <div className="flex justify-center">
              {/* <h4 className="w-[400px] text-center text-sm italic text-gray-400"> */}
              {/*   With leveraging you risk losing up to 100% of your deposit, you */}
              {/*   can not lose more than your deposit. */}
              {/* </h4> */}
            </div>
          </div>
          <div className="pt-1"></div>
          <div>
            <Button
              disabled={
                !isValid ||
                !Boolean(
                  isClaimingRewards ? claimRewardRequest : burnData?.request,
                )
              }
              variant="submit"
              onClick={() => setOpen(true)}
              className="w-full"
              type="button"
            >
              {isClaimingRewards && "Claim Rewards"}
              {!isClaimingRewards && `Burn ${isApe ? "APE" : "TEA"}`}
            </Button>
            {<ErrorMessage>{error}</ErrorMessage>}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
