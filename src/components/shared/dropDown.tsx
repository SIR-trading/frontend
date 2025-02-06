import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { type ReactNode } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";
import type { TAddressString } from "@/lib/types";
import ImageWithFallback from "./ImageWithFallback";
import { getLogoAsset } from "@/lib/assets";
import type { TMintFormFields } from "../providers/mintFormProvider";
import { useFormContext } from "react-hook-form";
//retrive FormField props
function Item({
  value,
  tokenAddress,
  children,
}: {
  tokenAddress: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <SelectItem value={value}>
      <div className="flex items-center gap-x-2 text-sm">
        <ImageWithFallback
          src={getLogoAsset(tokenAddress as TAddressString)}
          width={25}
          height={25}
          className="h-6 w-6"
          alt="alt"
        />
        {children}
      </div>
    </SelectItem>
  );
}

function Root({
  title,
  colorScheme,
  name,
  placeholder,
  children,
  className,
  disabled,
}: {
  title: string;
  clear?: boolean;
  placeholder?: string;
  name: "leverageTier" | "long" | "versus" | "depositToken";
  colorScheme?: "light" | "dark" | null;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { control } = useFormContext<TMintFormFields>();
  return (
    <div className={"flex w-full gap-x-2  " + className}>
      <div className="flex-grow">
        <FormField
          disabled={disabled}
          control={control}
          defaultValue="a"
          name={name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{title}</FormLabel>
              <Select
                disabled={disabled}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger disabled={disabled} colorScheme={colorScheme}>
                    <SelectValue
                      aria-disabled={disabled}
                      placeholder={placeholder}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>{children}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

const Dropdown = {
  Root,
  Item,
};
export default Dropdown;
