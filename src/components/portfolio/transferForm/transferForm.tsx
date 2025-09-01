import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseFormReturn } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/trpc/react";
import { parseUnits, isAddress } from "viem";
import { normalize } from "viem/ens";
import { useWaitForTransactionReceipt, useWriteContract, useAccount, useEnsAddress } from "wagmi";
import { mainnet } from "wagmi/chains";
import type { TUserPosition } from "@/server/queries/vaults";
import TransactionModal from "@/components/shared/transactionModal";
import TransactionSuccess from "@/components/shared/transactionSuccess";
import { X } from "lucide-react";
import { TransactionStatus } from "@/components/leverage-liquidity/mintForm/transactionStatus";
import { subgraphSyncPoll } from "@/lib/utils/sync";
import { BalancePercent } from "@/components/shared/balancePercent";
import { inputPatternMatch } from "@/lib/utils/index";
import { VaultContract } from "@/contracts/vault";
import { ApeContract } from "@/contracts/ape";
import type { TAddressString } from "@/lib/types";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { formatUnits, fromHex } from "viem";

// Helper function to convert vaultId to consistent decimal format
const getDisplayVaultId = (vaultId: string | undefined): string => {
  if (!vaultId) return "";
  if (vaultId.startsWith('0x')) {
    try {
      return fromHex(vaultId as `0x${string}`, "number").toString();
    } catch {
      return vaultId;
    }
  }
  return vaultId;
};

const TransferSchema = z.object({
  amount: z.string().optional(),
  recipient: z.string().optional(),
});

export type TTransferForm = UseFormReturn<
  { amount?: string | undefined; recipient?: string | undefined },
  undefined
>;
export type TTransferFields = { amount?: string | undefined; recipient?: string | undefined };

export default function TransferForm({
  balance,
  row,
  isApe,
  close,
  apeAddress,
}: {
  balance: bigint | undefined;
  isApe: boolean;
  row: TUserPosition;
  close: () => void;
  apeAddress?: TAddressString;
}) {
  const form = useForm<z.infer<typeof TransferSchema>>({
    resolver: zodResolver(TransferSchema),
  });
  const formData = form.watch();
  const { address } = useAccount();
  
  const { writeContract, reset, data: hash, isPending } = useWriteContract();
  const {
    data: receiptData,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
  });
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  
  // ENS resolution
  const isEnsName = formData.recipient?.endsWith('.eth');
  const normalizedEnsName = isEnsName && formData.recipient ? (() => {
    try {
      return normalize(formData.recipient);
    } catch {
      return undefined;
    }
  })() : undefined;
  
  const { data: ensAddress, isLoading: isResolvingEns } = useEnsAddress({
    name: normalizedEnsName,
    chainId: mainnet.id,
    query: {
      enabled: !!normalizedEnsName,
    },
  });

  useEffect(() => {
    if (receiptData) {
      utils.user.getUserBalancesInVaults.invalidate().catch((e) => {
        console.log(e);
      });
      if (isApe) {
        utils.user.getApePositions.invalidate().catch((e) => {
          console.log(e);
        });
      } else {
        utils.user.getTeaPositions.invalidate().catch((e) => {
          console.log(e);
        });
      }
      
      subgraphSyncPoll(Number.parseInt(receiptData.blockNumber.toString()))
        .then(() => {
          utils.vault.getTableVaults.invalidate().catch((e) => console.log(e));
        })
        .catch((e) => console.log(e));
    }
  }, [receiptData, utils, isApe]);

  useEffect(() => {
    if (isConfirmed) {
      form.setValue("amount", "");
      form.setValue("recipient", "");
    }
  }, [form, isConfirmed]);

  useEffect(() => {
    if (isConfirmed && !open) {
      reset();
    }
  }, [isConfirmed, reset, open]);

  // Safety check for row - must be after all hooks
  if (!row?.vaultId) {
    console.error("TransferForm: row or row.vaultId is undefined", row);
    close();
    return null;
  }

  // Use ENS resolved address if available, otherwise use the input directly
  const recipientAddress = ensAddress ?? formData.recipient;
  const isValidRecipient = recipientAddress && isAddress(recipientAddress);
  
  // Parse amount safely
  let parsedAmount = 0n;
  try {
    if (formData.amount && formData.amount !== "") {
      parsedAmount = parseUnits(formData.amount, row.decimals);
    }
  } catch {
    // Invalid amount format
    parsedAmount = 0n;
  }
  
  const isValidAmount = parsedAmount > 0n && parsedAmount <= (balance ?? 0n);
  const isValid = isValidRecipient && isValidAmount && !isResolvingEns;

  const onSubmit = () => {
    if (isConfirmed) {
      // When clicking close after success, immediately close both modals
      setOpen(false);
      // Use setTimeout to ensure proper cleanup
      setTimeout(() => {
        close();
      }, 0);
      return;
    }
    
    if (!address || !isValidRecipient || !isValidAmount || !recipientAddress) {
      return;
    }

    try {
      const amountBigInt = parseUnits(formData.amount ?? "0", row.decimals);
      
      if (isApe && apeAddress) {
        // APE transfer (ERC20)
        writeContract({
          address: apeAddress,
          abi: ApeContract.abi,
          functionName: "transfer",
          args: [recipientAddress, amountBigInt],
        });
      } else {
        // TEA transfer (ERC1155)
        writeContract({
          address: VaultContract.address,
          abi: VaultContract.abi,
          functionName: "safeTransferFrom",
          args: [
            address,
            recipientAddress,
            BigInt(row.vaultId),
            amountBigInt,
            "0x" as `0x${string}`,
          ],
        });
      }
    } catch (error) {
      console.error("Transfer error:", error);
    }
  };

  const displayVaultId = getDisplayVaultId(row.vaultId);
  const tokenName = `${isApe ? "APE" : "TEA"}${displayVaultId ? `-${displayVaultId}` : ""}`;
  const balanceFormatted = formatUnits(balance ?? 0n, row.decimals);

  return (
    <FormProvider {...form}>
      <TransactionModal.Root 
        title="Transfer" 
        open={open} 
        setOpen={(value) => {
          setOpen(value);
          if (!value && !isConfirmed) {
            close();
          }
        }}
      >
        <TransactionModal.Close setOpen={(value) => {
          setOpen(value);
          if (!value && !isConfirmed) {
            close();
          }
        }} />
        <TransactionModal.InfoContainer isConfirming={isConfirming} hash={hash}>
          {!isConfirmed && (
            <>
              <TransactionStatus
                action="Transfer"
                waitForSign={isPending}
                showLoading={isConfirming}
              />
              {formData.amount && recipientAddress && isValid && (
                <div className="flex h-[40px] items-center gap-x-2 py-2">
                  <h3 className="space-x-1">
                    <span>{formData.amount}</span>
                    <span className="text-gray-300 text-sm">{tokenName}</span>
                  </h3>
                  <span className="text-foreground/70">{"→"}</span>
                  <h3 className="space-x-1">
                    <span className="font-mono text-sm">
                      {recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}
                    </span>
                  </h3>
                </div>
              )}
            </>
          )}
          {isConfirmed && (
            <TransactionSuccess
              hash={hash}
              assetAddress={recipientAddress as TAddressString}
              assetReceived={`transferred to`}
              amountReceived={parsedAmount}
              decimals={row.decimals}
            />
          )}
        </TransactionModal.InfoContainer>
        <TransactionModal.StatSubmitContainer>
          <TransactionModal.SubmitButton
            disabled={!isValid || isPending || isConfirming}
            isPending={isPending}
            loading={isConfirming}
            onClick={() => onSubmit()}
            isConfirmed={isConfirmed}
          >
            Confirm Transfer
          </TransactionModal.SubmitButton>
        </TransactionModal.StatSubmitContainer>
      </TransactionModal.Root>
      
      <form>
        <div className="w-[320px] space-y-2 p-2 md:w-full">
          <div className="flex justify-between">
            <h2 className="w-full pl-[24px] text-center font-geist text-[24px]">
              Transfer
            </h2>
            <button
              type="button"
              onClick={() => close()}
              className="cursor-pointer text-foreground/80 transition-transform hover:scale-105 hover:text-foreground focus:outline-none"
            >
              <X />
            </button>
          </div>
          
          {/* Amount Input */}
          <div className="rounded-md bg-primary/5 px-3 py-2 dark:bg-primary">
            <div className="flex justify-between">
              <div className="space-y-2">
                <input
                  placeholder="0"
                  className="flex ring-offset-background font-geist-mono file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 text-foreground bg-transparent placeholder:text-muted-foreground w-full p-1 rounded-none text-[32px] h-8"
                  type="string"
                  inputMode="decimal"
                  autoComplete="off"
                  pattern="^[0-9]*[.,]?[0-9]*$"
                  value={formData.amount ?? ""}
                  onChange={(e) => {
                    if (inputPatternMatch(e.target.value, row.decimals)) {
                      form.setValue("amount", e.target.value);
                    }
                  }}
                />
              </div>
              <div className="flex items-center ml-2">
                <h3 className="text-xl whitespace-nowrap">
                  {tokenName}
                </h3>
              </div>
            </div>
            <div className="flex items-end justify-between pt-2">
              <BalancePercent
                balance={balanceFormatted}
                setValue={(s: string) => {
                  form.setValue("amount", s);
                }}
              />
              <span className="text-gray-300 text-sm italic">
                Balance <DisplayFormattedNumber num={balanceFormatted} />
              </span>
            </div>
          </div>
          
          {/* Recipient Section */}
          <div className="my-2 rounded-md px-4 py-2">
            <div className="pt-2"></div>
            <div>
              <div>
                <label className="">To</label>
              </div>
              <div className="w-full">
                <div className="flex items-end justify-between">
                  <div className="flex-1">
                    <input
                      placeholder="0x... or ENS name"
                      value={formData.recipient ?? ""}
                      onChange={(e) => form.setValue("recipient", e.target.value)}
                      className="text-[16px] bg-transparent border-0 outline-none w-full placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
                <div className="h-5 mt-1">
                  {isResolvingEns && (
                    <div className="text-sm text-muted-foreground">Resolving ENS...</div>
                  )}
                  {ensAddress && (
                    <div className="text-sm text-muted-foreground">
                      {ensAddress.slice(0, 6)}...{ensAddress.slice(-4)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="pt-1"></div>
          </div>
          
          <div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              disabled={!isValid}
              className="inline-flex items-center justify-center whitespace-nowrap ring-offset-backgroundtransition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring px-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 rounded-md bg-gold py-2 text-xl font-semibold hover:bg-gold/90 text-white w-full"
            >
              Transfer {tokenName}
            </button>
            <div className="flex justify-start pt-[2px]">
              <p data-disabled={
                (!formData.amount || parsedAmount <= (balance ?? 0n)) && 
                (!formData.recipient || (isValidRecipient ?? false) || isResolvingEns) ? "true" : "false"
              } className="text-red h-[13px] text-left text-sm data-[disabled=true]:opacity-0">
                {formData.amount && parsedAmount > (balance ?? 0n) ? "Insufficient balance." : 
                 formData.recipient && !isValidRecipient && !isResolvingEns ? 
                   (isEnsName && !ensAddress ? "ENS name not found" : "Invalid address") : ""}
              </p>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}