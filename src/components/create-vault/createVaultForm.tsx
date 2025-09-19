"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import type { z } from "zod";
import { FormField, FormItem, FormLabel } from "../ui/form";
import { CreateVaultInputValues } from "@/lib/schemas";
import { useCreateVault } from "./hooks/useCreateVault";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { RadioGroup } from "@radix-ui/react-radio-group";
import { RadioItem } from "./radioItem";
import TransactionModal from "../shared/transactionModal";
import { TransactionStatus } from "../leverage-liquidity/mintForm/transactionStatus";
import TransactionInfoCreateVault from "./transactionInfoCreateVault";
import { api } from "@/trpc/react";
import { useCheckValidityCreactVault } from "./hooks/useCheckValidityCreateVault";
import { TokenImage } from "../shared/TokenImage";
import Show from "../shared/show";
import SearchTokensModal from "./searchTokensModal";
import { ChevronDown, CircleCheck, AlertTriangle } from "lucide-react";
import type { Address } from "viem";
import { erc20Abi, zeroAddress } from "viem";
import { useTokenlistContext } from "@/contexts/tokenListProvider";
import SubmitButton from "../shared/submitButton";
import ErrorMessage from "../ui/error-message";
import { useFormSuccessReset } from "@/components/leverage-liquidity/mintForm/hooks/useFormSuccessReset";
import { getDexName } from "@/lib/chains";
export default function CreateVaultForm() {
  const { isConnected } = useAccount();
  const form = useForm<z.infer<typeof CreateVaultInputValues>>({
    resolver: zodResolver(CreateVaultInputValues),
    mode: "all",
    defaultValues: {
      leverageTier: "-1",
      longToken: "",
      versusToken: "",
    },
  });

  const formData = form.watch();
  const { longToken, versusToken, leverageTier } = formData;
  const data = useCreateVault({ longToken, versusToken, leverageTier });
  const {
    writeContract,
    isPending,
    data: hash,
    reset,
    error: writeError,
  } = useWriteContract();
  const onSubmit = () => {
    if (data?.request) {
      // @ts-expect-error - writeContract type mismatch
      writeContract(data?.request);
    }
  };
  const setLeverageTier = useCallback(
    (value: string) => {
      form.setValue("leverageTier", value);
    },
    [form],
  );
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: transactionData,
  } = useWaitForTransactionReceipt({ hash });
  const enabled = useMemo(() => {
    const shouldEnable = !!(
      formData.longToken &&
      formData.versusToken &&
      formData.leverageTier &&
      formData.longToken.length === 42 &&
      formData.versusToken.length === 42
    );

    console.log("getVaultStatus enabled check:", {
      shouldEnable,
      longToken: formData.longToken,
      versusToken: formData.versusToken,
      leverageTier: formData.leverageTier,
      longTokenLength: formData.longToken?.length,
      versusTokenLength: formData.versusToken?.length,
    });

    return shouldEnable;
  }, [formData.longToken, formData.versusToken, formData.leverageTier]);
  const {
    data: vaultData,
    isLoading: isCheckingOracle,
    error: oracleError,
  } = api.vault.getVaultExists.useQuery(
    {
      debtToken: formData.versusToken,
      collateralToken: formData.longToken,
      leverageTier: parseInt(formData.leverageTier),
    },
    {
      enabled,
    },
  );

  // Log the result whenever it changes
  useEffect(() => {
    if (enabled) {
      console.log("getVaultStatus query:", {
        enabled,
        isLoading: isCheckingOracle,
        error: oracleError,
        vaultData,
        debtToken: formData.versusToken,
        collateralToken: formData.longToken,
        leverageTier: parseInt(formData.leverageTier),
        statusMeaning:
          vaultData === 0 ? "Invalid token addresses" :
          vaultData === 1 ? "No oracle available" :
          vaultData === 2 ? "Vault can be created" :
          vaultData === 3 ? "Vault already exists" :
          vaultData === undefined ? "Not checked yet" :
          "Unknown status"
      });
    }
  }, [vaultData, isCheckingOracle, oracleError, enabled, formData.versusToken, formData.longToken, formData.leverageTier]);

  const isValid = useCheckValidityCreactVault({
    vaultSimulation: Boolean(data?.request),
    vaultData,
    isCheckingOracle,
  });
  const [openModal, setOpenModal] = useState(false);

  useFormSuccessReset({
    isConfirmed,
    currentTxType: "create-vault",
    useNativeToken: false,
    txBlock: parseInt(transactionData?.blockNumber.toString() ?? "0"),
  });

  useEffect(() => {
    if (isConfirmed && !openModal) {
      form.reset();
      reset();
    }
  }, [openModal, form.reset, isConfirmed, reset, form]);
  const [open, setOpen] = useState<{
    open: boolean;
    tokenSelection: "longToken" | "versusToken" | undefined;
  }>({ open: false, tokenSelection: undefined });
  return (
    <FormProvider {...form}>
      <form className="space-y-2">
        <TransactionModal.Root
          title="Create Vault"
          setOpen={setOpenModal}
          open={openModal}
        >
          <TransactionModal.Close setOpen={setOpenModal} />
          <TransactionModal.InfoContainer
            isConfirming={isConfirming || isConfirmed}
            hash={hash}
          >
            {writeError && !isConfirming && !isConfirmed && (
              <div className="flex gap-3 p-4">
                <AlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={20} />
                <div className="flex-1">
                  <p className="text-amber-500 mb-1 text-sm font-medium">
                    Transaction Failed
                  </p>
                  <p className="text-amber-400/80 text-xs">
                    {(() => {
                      const message = writeError.message || "";
                      // Check for specific errors and provide user-friendly messages
                      if (message.includes("NoUniswapPool") || message.includes("0x94113d81")) {
                        return `No ${getDexName()} liquidity pool exists for this token pair. Please choose tokens with existing liquidity pools.`;
                      }
                      if (message.includes("user rejected") || message.includes("User denied")) {
                        return "Transaction was cancelled by the user.";
                      }
                      // Return the original message or a generic one
                      return message || "Transaction failed. Please check your inputs and try again.";
                    })()}
                  </p>
                </div>
              </div>
            )}
            <Show
              fallback={
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <CircleCheck size={40} color="hsl(173, 73%, 36%)" />
                  </div>
                  <h1 className="text-center font-geist text-lg">
                    Successfully created vault!
                  </h1>
                </div>
              }
              when={!isConfirmed}
            >
              <TransactionStatus
                action="Create"
                waitForSign={isPending}
                showLoading={isConfirming}
              />

              <TransactionInfoCreateVault
                leverageTier={formData.leverageTier}
                longToken={formData.longToken}
                versusToken={formData.versusToken}
              />
            </Show>
          </TransactionModal.InfoContainer>
          <TransactionModal.StatSubmitContainer>
            <TransactionModal.SubmitButton
              disabled={!isValid}
              isPending={isPending}
              loading={isConfirming}
              isConfirmed={isConfirmed}
              onClick={() => {
                if (isConfirmed) {
                  setOpenModal(false);
                } else {
                  onSubmit();
                }
              }}
            >
              Create
            </TransactionModal.SubmitButton>
          </TransactionModal.StatSubmitContainer>
        </TransactionModal.Root>
        {/* <h1 className="text-center font-geist text-4xl">Create Vault</h1> */}
        <div>
          <div className="pt-1"></div>
          <div className="rounded-md ">
            <div className="flex justify-between gap-x-2 ">
              <SelectTokenDialogTrigger
                tokenAddress={formData.longToken as Address | undefined}
                onClick={() => {
                  setOpen({ open: true, tokenSelection: "longToken" });
                }}
                title="Long"
              />
              <SelectTokenDialogTrigger
                tokenAddress={formData.versusToken as Address | undefined}
                onClick={() => {
                  setOpen({ open: true, tokenSelection: "versusToken" });
                }}
                title="Versus"
              />
            </div>
          </div>
        </div>
        <SearchTokensModal
          tokenSelection={open.tokenSelection}
          open={open.open}
          onOpen={(b) => setOpen((prev) => ({ ...prev, open: b }))}
          selectedTokens={[longToken as Address, versusToken as Address]}
        />

        <div className="w-full ">
          <FormField
            control={form.control}
            name="leverageTier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Leverage</FormLabel>{" "}
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-4 rounded-md md:grid-cols-3"
                >
                  {["-4", "-3", "-2", "-1", "0", "1", "2"].map((e, index) => {
                    return (
                      <RadioItem
                        index={index}
                        key={e}
                        setValue={setLeverageTier}
                        fieldValue={field.value}
                        value={e}
                      />
                    );
                  })}
                </RadioGroup>
              </FormItem>
            )}
          />

          {
            <p className="text-sm text-red">
              {form.formState.errors.leverageTier?.message}
            </p>
          }
        </div>
        <div className="flex flex-col items-center pt-6">
          <SubmitButton
            onClick={() => {
              if (isConnected) {
                setOpenModal(true);
              } else {
              }
            }}
            disabled={!isValid.isValid || isCheckingOracle}
          >
            {isCheckingOracle ? `Checking ${getDexName()} Oracle...` : "Create Vault"}
          </SubmitButton>
          <ErrorMessage>
            {isCheckingOracle &&
              enabled &&
              `Verifying ${getDexName()} price oracle availability...`}
            {oracleError && "Failed to check oracle status. Please try again."}
            {!isCheckingOracle && !oracleError && isValid.error}
          </ErrorMessage>
        </div>
      </form>
    </FormProvider>
  );
}
function SelectTokenDialogTrigger({
  title,
  onClick,
  tokenAddress,
}: {
  title: string;
  onClick: () => void;
  tokenAddress: Address | undefined;
}) {
  const { tokenlist } = useTokenlistContext();
  const token = useMemo(() => {
    return tokenlist?.find((t) => t.address === tokenAddress);
  }, [tokenAddress, tokenlist]);
  const symbol = useReadContract({
    address: tokenAddress ?? zeroAddress,
    abi: erc20Abi,
    functionName: "symbol",
    query: {
      enabled: !!tokenAddress && !token,
    },
  });
  return (
    <div className="w-full">
      <div>
        <label htmlFor="" className="text-sm">
          {title}
        </label>
      </div>
      <div className="pt-1"></div>
      <button
        onClick={onClick}
        type="button"
        className="flex w-full justify-between gap-x-2 rounded-md border-2 border-tertiary-border bg-tertiary px-3 py-2"
      >
        <span className="flex items-center gap-x-1">
          {!tokenAddress && <span className="text-[14px]">Select Token</span>}
          {tokenAddress && (
            <>
              <span className="">
                <span className="text-[14px] font-medium text-foreground">
                  {token?.symbol ?? symbol.data}
                </span>
              </span>
              <span className="inline-block h-7 w-7">
                <TokenImage
                  address={tokenAddress}
                  alt=""
                  className="h-7 w-7 rounded-full"
                  width={25}
                  height={25}
                />
              </span>
            </>
          )}
        </span>
        <span className="flex items-center">
          <ChevronDown size={25} />
        </span>
      </button>
    </div>
  );
}
