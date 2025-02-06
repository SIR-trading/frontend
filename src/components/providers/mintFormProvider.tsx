"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseFormReturn } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import MintFormProviderApi from "./mintFormProviderApi";
import useVaultFilterStore from "@/lib/store";
import { useEffect } from "react";

const MintSchema = z.object({
  long: z.string(),
  versus: z.string(),
  leverageTier: z.string(),
  depositToken: z.string(),
  slippage: z.string().optional(),
  deposit: z.string().optional(),
});

export type TMintFormFields = z.infer<typeof MintSchema>;
export type TMintForm = UseFormReturn<TMintFormFields, undefined>;
export type TMintFormFieldKeys = keyof TMintFormFields;
export default function MintFormProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const form = useForm<z.infer<typeof MintSchema>>({
    resolver: zodResolver(MintSchema),
    mode: "onChange",
    defaultValues: {
      deposit: "",
      slippage: "0.5",
      leverageTier: "",
      long: "",
      versus: "",
      depositToken: "",
    },
  });
  // Store doesn't get reset on page changes
  // Need to ensure store is blank when MintFormProvider first renders (again)
  const resetStore = useVaultFilterStore((state) => state.resetStore);
  useEffect(() => {
    console.log("here");
    resetStore();
  }, [resetStore]);
  return (
    <FormProvider {...form}>
      <MintFormProviderApi setValue={form.setValue}>
        {children}
      </MintFormProviderApi>
    </FormProvider>
  );
}
