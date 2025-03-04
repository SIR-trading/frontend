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
export type TMintForm = UseFormReturn<TCalculatorFormFields, undefined>;
export type TMintFormFieldKeys = keyof TCalculatorFormFields;
export default function CalculatorFormProvider({
												   children,
											   }: {
	children: React.ReactNode;
}) {
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
	// Store doesn't get reset on page changes
	// Need to ensure store is blank when MintFormProvider first renders (again)
	const resetStore = useVaultFilterStore((state) => state.resetStore);
	useEffect(() => {
		resetStore();
	}, [resetStore]);
	return (
		<FormProvider {...form}>
				{children}
		</FormProvider>
	);
}
