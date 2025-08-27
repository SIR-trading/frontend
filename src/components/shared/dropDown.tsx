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
import { TokenImage } from "./TokenImage";
import type { TMintFormFields } from "../providers/mintFormProvider";
import type { TCalculatorFormFields } from "../providers/calculatorFormProvider";
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
        <TokenImage
          address={tokenAddress as TAddressString}
          width={25}
          height={25}
          className="h-6 w-6 rounded-full"
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
  onChange,
}: {
  title: string;
  clear?: boolean;
  placeholder?: string;
  name: "leverageTier" | "long" | "versus" | "depositToken";
  colorScheme?: "light" | "dark" | null;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}) {
  const { control } = useFormContext<TMintFormFields | TCalculatorFormFields>();
  return (
    <div className={"flex w-full gap-x-2  " + className}>
      <div className="flex-grow">
        <FormField
          disabled={disabled}
          control={control}
          name={name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{title}</FormLabel>
              <Select
                disabled={disabled}
                onValueChange={(value) => {
                  // Only update if value is not empty or undefined
                  // This prevents the dropdown from clearing when re-rendering
                  if (value !== undefined && value !== "") {
                    field.onChange(value);
                    onChange?.(value);
                  }
                }}
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
