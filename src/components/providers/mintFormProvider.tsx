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
  // Get values from store to persist selection across pages
  const { long, versus, leverageTier, depositToken } = useVaultFilterStore();
  
  const form = useForm<z.infer<typeof MintSchema>>({
    resolver: zodResolver(MintSchema),
    mode: "onChange",
    defaultValues: {
      deposit: "",
      slippage: "0.5",
      leverageTier: leverageTier || "",
      long: long || "",
      versus: versus || "",
      depositToken: depositToken || "",
    },
  });
  
  // Sync form with store values whenever they change
  useEffect(() => {
    // Update form values to match store values
    // This ensures values persist when switching between tabs
    if (long !== undefined) form.setValue("long", long);
    if (versus !== undefined) form.setValue("versus", versus);
    if (leverageTier !== undefined) form.setValue("leverageTier", leverageTier);
    if (depositToken !== undefined) form.setValue("depositToken", depositToken);
  }, [long, versus, leverageTier, depositToken, form]); // Run whenever store values change
  
  return (
    <FormProvider {...form}>
      <MintFormProviderApi setValue={form.setValue}>
        {children}
      </MintFormProviderApi>
    </FormProvider>
  );
}
