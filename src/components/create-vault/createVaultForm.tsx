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
import ImageWithFallback from "../shared/ImageWithFallback";
import { RadioGroup } from "@radix-ui/react-radio-group";
import { RadioItem } from "./radioItem";
import TransactionModal from "../shared/transactionModal";
import { TransactionStatus } from "../leverage-liquidity/mintForm/transactionStatus";
import TransactionInfoCreateVault from "./transactionInfoCreateVault";
import { api } from "@/trpc/react";
import { useCheckValidityCreactVault } from "./hooks/useCheckValidityCreateVault";
import { getLogoAsset } from "@/lib/assets";
import Show from "../shared/show";
import SearchTokensModal from "./searchTokensModal";
import { ChevronDown } from "lucide-react";
import type { Address } from "viem";
import { erc20Abi, zeroAddress } from "viem";
import { useTokenlistContext } from "@/contexts/tokenListProvider";
import SubmitButton from "../shared/submitButton";
import ErrorMessage from "../ui/error-message";
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
  const { writeContract, isPending, data: hash, reset } = useWriteContract();
  const onSubmit = () => {
    if (data?.request) {
      writeContract(data?.request);
    }
  };
  const setLeverageTier = useCallback(
    (value: string) => {
      form.setValue("leverageTier", value);
    },
    [form],
  );
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });
  const enabled = useMemo(() => {
    if (
      formData.longToken &&
      formData.versusToken &&
      Boolean(formData.leverageTier)
    ) {
      if (
        formData.longToken.length === 42 &&
        formData.versusToken.length === 42
      ) {
        return true;
      }
    }
    return false;
  }, [formData.longToken, formData.versusToken, formData.leverageTier]);
  const { data: vaultData } = api.vault.getVaultExists.useQuery(
    {
      debtToken: formData.versusToken,
      collateralToken: formData.longToken,
      leverageTier: parseInt(formData.leverageTier),
    },
    {
      enabled,
    },
  );

  const isValid = useCheckValidityCreactVault({
    vaultSimulation: Boolean(data?.request),
    vaultData,
  });
  const [openModal, setOpenModal] = useState(false);
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
            isConfirming={isConfirming}
            hash={hash}
          >
            <Show
              fallback={
                <div>
                  <h1>Succesfully created Vault!</h1>
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
        {/* <h1 className="text-center font-lora text-4xl">Create Vault</h1> */}
        <div>
          <h2 className="font-lora text-3xl font-semibold tracking-wide">
            Initialize a Vault
          </h2>
          <h4 className="text-sm text-neutral-400">
            Enter any two tokens with a uniswap pool ...
          </h4>
        </div>
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
            <p className="text-sm text-red-400">
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
            disabled={!isValid.isValid}
          >
            Create Vault
          </SubmitButton>
          <ErrorMessage>{isValid.error}</ErrorMessage>
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
        className="flex w-full justify-between gap-x-2 rounded-md bg-secondary-400 px-3 py-2"
      >
        <div className="flex items-center gap-x-1">
          {!tokenAddress && <span className="text-[14px]">Select Token</span>}
          {tokenAddress && (
            <>
              <div className="h-7 w-7">
                <ImageWithFallback
                  alt=""
                  className="h-7 w-7 rounded-full"
                  width={25}
                  height={25}
                  src={getLogoAsset(tokenAddress)}
                />
              </div>
              <div className="">
                <div className="text-[14px] font-medium text-white">
                  {token?.symbol ?? symbol.data}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center">
          <ChevronDown size={25} />
        </div>
      </button>
    </div>
  );
}
