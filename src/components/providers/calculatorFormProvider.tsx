"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseFormReturn } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import useVaultFilterStore from "@/lib/store";
import { useEffect } from "react";

const CalculatorSchema = z.object({
  long: z.string(),
  versus: z.string(),
  leverageTier: z.string(),
  depositToken: z.string(),
  slippage: z.string().optional(),
  deposit: z.string().optional(),
  entryPrice: z.string().optional(),
  exitPrice: z.string().optional(),
});

export type TCalculatorFormFields = z.infer<typeof CalculatorSchema>;
export type TCalculatorForm = UseFormReturn<TCalculatorFormFields, undefined>;
export type TCalculatorFormFieldKeys = keyof TCalculatorFormFields;
export default function CalculatorFormProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get values from store to persist selection across pages
  const { long, versus, leverageTier, depositToken } = useVaultFilterStore();
  
  const form = useForm<z.infer<typeof CalculatorSchema>>({
    resolver: zodResolver(CalculatorSchema),
    mode: "onChange",
    defaultValues: {
      deposit: "",
      slippage: "0.5",
      leverageTier: "",
      long: "",
      versus: "",
      depositToken: "",
      entryPrice: "",
      exitPrice: "",
    },
  });
  
  // Update form values from store on mount
  useEffect(() => {
    if (long) form.setValue("long", long);
    if (versus) form.setValue("versus", versus);
    if (leverageTier) form.setValue("leverageTier", leverageTier);
    if (depositToken) form.setValue("depositToken", depositToken);
  }, [long, versus, leverageTier, depositToken, form]);
  
  return <FormProvider {...form}>{children}</FormProvider>;
}
