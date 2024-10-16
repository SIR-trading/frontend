"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useMemo, useState } from "react";
import type { z } from "zod";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { CreateVaultInputValues } from "@/lib/schemas";
import type { TAddressString, TCreateVaultKeys } from "@/lib/types";
import { useCreateVault } from "./hooks/useCreateVault";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { getLogoAsset } from "@/lib/utils";
import ImageWithFallback from "../shared/ImageWithFallback";
import { RadioGroup } from "@radix-ui/react-radio-group";
import { RadioItem } from "./radioItem";
import TransactionModal from "../shared/transactionModal";
import { TransactionStatus } from "../leverage-liquidity/mintForm/transactionStatus";
import TransactionInfoCreateVault from "./transactionInfoCreateVault";
import { api } from "@/trpc/react";
import TransactionSuccess from "../shared/transactionSuccess";
const tokens = [
  {
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" as TAddressString,
    label: "USDC",
  },
  {
    address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" as TAddressString,
    label: "WETH",
  },
  {
    address: "0x6b175474e89094c44da98b954eedeac495271d0f" as TAddressString,
    label: "DAI",
  },
  {
    address: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9" as TAddressString,
    label: "AVE",
  },
];
export default function CreateVaultForm() {
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
  const { writeContract, isPending, data: hash } = useWriteContract();
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
  console.log(
    vaultData,

    {
      debtToken: formData.versusToken,
      collateralToken: formData.longToken,
      leverageTier: parseFloat(formData.leverageTier),
    },
    "VAULTID",
  );
  const isValid = useMemo(() => {
    if (formData.longToken.length !== 42 && formData.longToken.length > 0) {
      return { isValid: false, error: "Invalid Long Token Address!" };
    }
    if (formData.versusToken.length !== 42 && formData.versusToken.length > 0) {
      return { isValid: false, error: "Invalid Versus Token Address!" };
    }
    if (formData.longToken.length === 42) {
      if (!formData.longToken.startsWith("0x")) {
        return {
          isValid: false,
          error: "Long Token has an Invalid Address Format.",
        };
      }
    }

    if (formData.versusToken.length === 42) {
      if (!formData.versusToken.startsWith("0x")) {
        return {
          isValid: false,
          error: "Long Token has an Invalid Address Format.",
        };
      }
    }
    if (formData.versusToken.length !== 42 && formData.versusToken.length > 0) {
      return { isValid: false, error: "Invalid Versus Token Address!" };
    }

    if (vaultData === 0) {
      return { isValid: false, error: "Invalid Vault." };
    }
    if (vaultData === 1) {
      return { isValid: false, error: "No Uniswap Pool." };
    }
    if (vaultData === 3) {
      return { isValid: false, error: "Vault Already Exists" };
    }
    if (data?.request) {
      return { isValid: true, error: undefined };
    } else {
      return { isValid: false, error: "" };
    }
  }, [data?.request, vaultData, formData.longToken, formData.versusToken]);
  console.log(isValid, "");
  const [openModal, setOpenModal] = useState(false);
  return (
    <FormProvider {...form}>
      <form className="space-y-4">
        <TransactionModal.Root setOpen={setOpenModal} open={openModal}>
          <TransactionModal.Close setOpen={setOpenModal} />
          <TransactionModal.InfoContainer>
            {!isConfirmed && (
              <TransactionStatus
                action="Create"
                waitForSign={isPending}
                isTxPending={isConfirming}
              />
            )}
            {isConfirmed && (
              <div>
                <h1>Succesfully Created Vault.</h1>
              </div>
            )}

            <TransactionInfoCreateVault
              leverageTier={formData.leverageTier}
              longToken={formData.longToken}
              versusToken={formData.versusToken}
            />
          </TransactionModal.InfoContainer>
          <TransactionModal.StatSubmitContainer>
            <TransactionModal.SubmitButton
              disabled={!isValid}
              loading={isPending || isConfirming}
              onClick={() => {
                if (isConfirmed) {
                  setOpenModal(false);
                } else {
                  onSubmit();
                }
              }}
            >
              {isConfirmed
                ? "Close"
                : isPending || isConfirming
                  ? "Pending..."
                  : "Create"}
            </TransactionModal.SubmitButton>
          </TransactionModal.StatSubmitContainer>
        </TransactionModal.Root>

        <div className="grid  gap-y-4">
          <div className="w-full space-y-2">
            <TokenInput name="longToken" title="Long Token" />
            <QuickSelects name="longToken" tokens={tokens} />
          </div>

          <div className="w-full space-y-2">
            <TokenInput name="versusToken" title="Versus Token" />
            <QuickSelects name="versusToken" tokens={tokens} />
          </div>
        </div>

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
                  className="grid grid-cols-3 gap-4"
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
        <div className="flex flex-col items-center pt-4">
          <Button
            onClick={() => {
              setOpenModal(true);
            }}
            type="button"
            disabled={!isValid.isValid}
            variant={"submit"}
          >
            Create
          </Button>

          <div className="flex pt-2 md:w-[450px]">
            <span className="text-[13px] text-red-400">
              {isValid.error ? isValid.error : ""}
            </span>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
interface PropsQuick {
  tokens: { address: `0x${string}`; label: string }[];
  name: "versusToken" | "longToken";
}

function QuickSelects({ tokens, name }: PropsQuick) {
  const form = useFormContext();
  return (
    <div className="flex flex-wrap items-center gap-x-2">
      <h2 className="pr-2 text-[12px]">Quick Selects:</h2>
      {tokens.map((e) => {
        return (
          <div
            key={e.address}
            className="flex cursor-pointer items-center gap-x-2 rounded-full bg-background px-2 py-1 hover:bg-background/60"
            onClick={() => {
              form.setValue(name, e.address);
            }}
          >
            <h2 className="text-[12px]">{e.label}</h2>
            <ImageWithFallback
              width={20}
              height={20}
              className="h-6 w-6"
              src={getLogoAsset(e.address)}
              alt={"Token " + e.label}
            />
          </div>
        );
      })}
    </div>
  );
}

function TokenInput({
  title,
  name,
}: {
  title: string;
  name: TCreateVaultKeys;
}) {
  const form = useFormContext();
  return (
    <>
      <FormLabel htmlFor="longToken">{title}</FormLabel>
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                type="text"
                placeholder="0x"
                autoComplete="off"
                className="w-full rounded-md px-2"
                background="primary"
                minLength={1}
                textSize="sm"
                step="any"
                {...field}
                onChange={(e) => {
                  // const pattern = /^[0-9]*[.,]?[0-9]*$/;
                  const pattern = /^[0-9A-Fa-f]+$/;
                  if (pattern.test(e.target.value))
                    return field.onChange(e.target.value);
                }}
              ></Input>
            </FormControl>
          </FormItem>
        )}
      />
    </>
  );
}
