import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseFormReturn } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/trpc/react";
import { formatUnits, parseUnits, fromHex, erc20Abi } from "viem";
import { useWaitForTransactionReceipt, useWriteContract, useReadContract } from "wagmi";
import { getCurrentTime } from "@/lib/utils/index";
import type { TUserPosition } from "@/server/queries/vaults";
import { Button } from "@/components/ui/button";
import TransactionModal from "@/components/shared/transactionModal";
import { TransactionEstimates } from "@/components/shared/transactionEstimates";
import TransactionSuccess from "@/components/shared/transactionSuccess";
import { useGetTxTokens } from "./hooks/useGetTxTokens";
import { X } from "lucide-react";
import { TransactionStatus } from "@/components/leverage-liquidity/mintForm/transactionStatus";
import { useClaimTeaRewards } from "./hooks/useClaimTeaRewards";
import { DisplayCollateral } from "./displayCollateral";
import { TokenInput } from "./tokenInput";
import { subgraphSyncPoll } from "@/lib/utils/sync";
import { useBurnFormValidation } from "./hooks/useBurnFormValidation";
import ErrorMessage from "@/components/ui/error-message";
import { VaultContract } from "@/contracts/vault";
import { SirClaimModal } from "@/components/shared/SirClaimModal";

// Helper function to convert vaultId to consistent decimal format
const getDisplayVaultId = (vaultId: string | undefined): string => {
  if (!vaultId) return "";
  // If vaultId starts with '0x', it's hexadecimal and needs conversion
  if (vaultId.startsWith('0x')) {
    try {
      return fromHex(vaultId as `0x${string}`, "number").toString();
    } catch {
      // If conversion fails, return as-is
      return vaultId;
    }
  }
  // If it's already a decimal number, return as-is
  return vaultId;
};

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
  
  // Check if deposit amount is valid before querying
  const depositAmount = parseUnits(formData.deposit?.toString() ?? "0", row.decimals);
  const isDepositValid = depositAmount > 0n && depositAmount <= (balance ?? 0n);
  
  const { data: quoteBurn } = api.vault.quoteBurn.useQuery(
    {
      amount: formData.deposit ?? "0",
      isApe,
      debtToken: row.debtToken,
      leverageTier: parseInt(row.leverageTier),
      collateralToken: row.collateralToken,
      decimals: row.decimals,
    },
    {
      enabled: Boolean(formData.deposit) && isDepositValid,
    },
  );

  const { writeContract, reset, data: hash, isPending, error: writeError } = useWriteContract();
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
      utils.user.getUserBalancesInVaults.invalidate().catch((e) => {
        console.log(e);
      });
      if (!isApe && isClaimingRewards) {
        utils.user.getUnstakedSirBalance
          .invalidate()
          .catch((e) => console.log(e));
        utils.user.getTotalSirBalance.invalidate().catch((e) => {
          console.log(e);
        });
        utils.leaderboard.getClosedApePositions.invalidate().catch((e) => {
          console.log(e);
        });
      }

      subgraphSyncPoll(Number.parseInt(receiptData.blockNumber.toString()))
        .then(() => {
          utils.vault.getTableVaults.invalidate().catch((e) => console.log(e));
        })
        .catch((e) => console.log(e));
    }
  }, [
    receiptData,
    utils.user.getTotalSirBalance,
    utils.user.getSirTotalSupply,
    utils.user.getUnstakedSirBalance,
    claimAndStake,
    isApe,
    utils.user.getUserBalancesInVaults,
    isClaimingRewards,
    utils.vault.getTableVaults,
    utils.leaderboard.getClosedApePositions,
  ]);

  // No longer using simulation - removed useBurnApe hook usage

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
    row.decimals,
  );

  const { tokenReceived } = useGetTxTokens({ logs: receiptData?.logs });

  // Fetch collateral token decimals
  const { data: collateralDecimals } = useReadContract({
    address: row.collateralToken,
    abi: erc20Abi,
    functionName: "decimals",
  });

  // Check if we have a valid burn amount (greater than 0 and less than or equal to balance)
  const parsedAmount = parseUnits(formData.deposit?.toString() ?? "0", row.decimals);
  const hasValidBurnAmount = parsedAmount > 0n && parsedAmount <= (balance ?? 0n);
  
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

    // Direct burn without simulation - using quote for validation
    if (hasValidBurnAmount && !isClaimingRewards) {
      writeContract({
        ...VaultContract,
        functionName: "burn",
        args: [
          isApe,
          {
            debtToken: row.debtToken,
            leverageTier: parseInt(row.leverageTier),
            collateralToken: row.collateralToken,
          },
          parsedAmount,
          getCurrentTime() + 10 * 60, // 10 minutes from now
        ],
      });
    }
  };
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isConfirmed && !open) {
      reset();
    }
  }, [isConfirmed, reset, open]);

  useEffect(() => {
    if (isClaimingRewards) {
      setOpen(true);
    }
  }, [isClaimingRewards]);

  if (isClaimingRewards) {
    return (
      <>
        <SirClaimModal
          open={open}
          setOpen={setOpen}
          unclaimedAmount={reward}
          isPending={isPending}
          isConfirming={isConfirming}
          isConfirmed={isConfirmed}
          hash={hash}
          claimAndStake={claimAndStake}
          setClaimAndStake={setClaimAndStake}
          onSubmit={onSubmit}
          onClose={close}
          title="Claim Rewards"
        />
      </>
    );
  }

  return (
    <FormProvider {...form}>
      <TransactionModal.Root 
        title="Burn" 
        open={open} 
        setOpen={(value) => {
          setOpen(value);
          if (!value && !isConfirmed) {
            close(); // Also close the burn form when closing the modal
          }
        }}
      >
          <TransactionModal.Close setOpen={(value) => {
            setOpen(value);
            if (!value && !isConfirmed) {
              close(); // Also close the burn form when closing the modal
            }
          }} />
          <TransactionModal.InfoContainer isConfirming={isConfirming} hash={hash}>
            {writeError && !isConfirming && !isConfirmed && (
              <div className="p-4 mb-4 rounded-md bg-red-500/10 border border-red-500/20">
                <p className="text-red-500 text-sm font-medium mb-1">Transaction Failed</p>
                <p className="text-red-400 text-xs break-all">
                  {writeError.message || "Transaction simulation failed. Please check your inputs and try again."}
                </p>
              </div>
            )}
            {!isConfirmed && (
              <>
                <TransactionStatus
                  action="Burn"
                  waitForSign={isPending}
                  showLoading={isConfirming}
                />
                {!isClaimingRewards && (
                <>
                  {quoteBurn ? (
                    <TransactionEstimates
                      decimals={row.decimals}
                      inAssetName={
                        isApe ? `APE-${getDisplayVaultId(row.vaultId)}` : `TEA-${getDisplayVaultId(row.vaultId)}`
                      }
                      outAssetName={row.collateralSymbol}
                      collateralEstimate={quoteBurn}
                      usingNativeToken={false}
                    />
                  ) : (
                    <div className="flex h-[40px] items-center gap-x-2 py-2">
                      <h3 className="space-x-1">
                        <span>{formData.deposit}</span>
                        <span className="text-gray-300 text-sm">
                          {isApe ? `APE-${getDisplayVaultId(row.vaultId)}` : `TEA-${getDisplayVaultId(row.vaultId)}`}
                        </span>
                      </h3>
                      <span className="text-foreground/70">{"->"}</span>
                      <h3 className="space-x-1 text-foreground/70">
                        <span className="text-sm italic">Estimate unavailable</span>
                      </h3>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          {isConfirmed && (
            <TransactionSuccess
              hash={hash}
              assetAddress={row.collateralToken}
              assetReceived={row.collateralSymbol}
              amountReceived={tokenReceived}
              decimals={collateralDecimals ?? 18} // Use actual collateral token decimals
            />
          )}
        </TransactionModal.InfoContainer>
        {/*----*/}
        <TransactionModal.StatSubmitContainer>
          <TransactionModal.SubmitButton
            disabled={isPending || isConfirming}
            isPending={isPending}
            loading={isConfirming}
            onClick={() => onSubmit()}
            isConfirmed={isConfirmed}
          >
            Confirm Burn
          </TransactionModal.SubmitButton>
        </TransactionModal.StatSubmitContainer>
      </TransactionModal.Root>
      <form>
        <div className="w-[320px] space-y-2  p-2 md:w-full">
          <div className="flex justify-between">
            <h2 className="w-full pl-[24px] text-center font-geist text-[24px]">
              Burn
            </h2>

            <button
              type="button"
              onClick={() => close()}
              className="cursor-pointer text-foreground/80 transition-transform hover:scale-105 hover:text-foreground focus:outline-none"
            >
              <X />
            </button>
          </div>

          <TokenInput
            positionDecimals={row.decimals}
            balance={balance}
            form={form}
            vaultId={row.vaultId}
            isApe={isApe}
          />
          <div className="my-2 rounded-md px-4 py-2">
            <div className="pt-2"></div>
            <div>
              <div>
                <label htmlFor="a" className="">
                  Into
                </label>
              </div>

              <DisplayCollateral
                isClaiming={false}
                isLoading={false}
                data={{
                  leverageTier: parseFloat(row.leverageTier),
                  collateralToken: row.collateralToken,
                  debtToken: row.debtToken,
                }}
                amount={formatUnits(quoteBurn ?? 0n, row.decimals)}
                collateralSymbol={row.collateralSymbol}
                bg=""
              />
            </div>
            <div className="pt-2"></div>
          </div>
          
          <div className="pt-1"></div>
          <div>
            <Button
              disabled={!isValid || !hasValidBurnAmount}
              variant="submit"
              onClick={() => setOpen(true)}
              className="w-full"
              type="button"
            >
              {`Burn ${isApe ? "APE" : "TEA"}`}
            </Button>
            {<ErrorMessage>{error}</ErrorMessage>}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
