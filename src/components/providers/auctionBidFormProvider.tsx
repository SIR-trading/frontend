import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";

const AuctionBidSchema = z.object({
  bid: z.string(),
});

export type TAuctionBidFormFields = z.infer<typeof AuctionBidSchema>;
export type TAuctionBidForm = UseFormReturn<TAuctionBidFormFields, undefined>;
export type TAuctionBidFormFieldKeys = keyof TAuctionBidFormFields;
export default function AuctionBidFormProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const form = useForm<z.infer<typeof AuctionBidSchema>>({
    resolver: zodResolver(AuctionBidSchema),
    mode: "onChange",
    defaultValues: {
      bid: "",
    },
  });
  return <FormProvider {...form}>{children}</FormProvider>;
}
