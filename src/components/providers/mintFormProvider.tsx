"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseFormReturn } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import MintFormProviderApi from "./mintFormProviderApi";
import useVaultFilterStore from "@/lib/store";
import { useEffect, useRef } from "react";

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

  // Track if this is the initial mount - skip setValue on first render
  // since defaultValues already contain the store values
  const isFirstRender = useRef(true);

  // Track previous values to only update when they actually change
  const prevValuesRef = useRef({ long, versus, leverageTier, depositToken });

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

  // Destructure setValue to avoid including entire form object in deps
  const { setValue } = form;

  // Sync form with store values whenever they change
  useEffect(() => {
    // Skip initial render - defaultValues already set from store
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const prev = prevValuesRef.current;

    // Only update values that have actually changed
    if (long !== prev.long && long !== undefined) {
      setValue("long", long);
    }
    if (versus !== prev.versus && versus !== undefined) {
      setValue("versus", versus);
    }
    if (leverageTier !== prev.leverageTier && leverageTier !== undefined) {
      setValue("leverageTier", leverageTier);
    }
    if (depositToken !== prev.depositToken && depositToken !== undefined) {
      setValue("depositToken", depositToken);
    }

    // Update previous values ref
    prevValuesRef.current = { long, versus, leverageTier, depositToken };
  }, [long, versus, leverageTier, depositToken, setValue]);

  return (
    <FormProvider {...form}>
      <MintFormProviderApi setValue={form.setValue}>
        {children}
      </MintFormProviderApi>
    </FormProvider>
  );
}
