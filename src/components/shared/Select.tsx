import React, { useState } from "react";
import type { StaticImageData } from "next/image";
import { LoaderCircle } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "../ui/button";
import { Command, CommandEmpty, CommandItem, CommandList } from "../ui/command";
import ImageWithFallback from "./ImageWithFallback";
import Show from "./show";
import type { TMintFormFields } from "../providers/mintFormProvider";
import { useFormContext } from "react-hook-form";
type TItem = {
  value: string;
  label: string;
  imageUrl?: string | StaticImageData;
};
export default function Select({
  name,
  placeholder,
  title,
  items,
  setStore,
  noSearch,
  onChangeInput,
  searchItems,
  value,
  loading,
}: {
  title: string;
  loading?: boolean;
  clear?: boolean;
  noSearch?: boolean;
  searchItems?: TItem[];
  items: TItem[];
  placeholder?: string;
  name: "leverageTier" | "long" | "versus" | "depositToken";
  colorScheme?: "light" | "dark" | null;
  setStore: (s: string) => void;
  onChangeInput?: (s: string) => void;
  value?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const showItems = searchItems ? searchItems : items;
  const { control, setValue } = useFormContext<TMintFormFields>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{title}</FormLabel>

          <Popover onOpenChange={(b) => setOpen(b)} open={open}>
            <PopoverTrigger asChild>
              <FormControl className="">
                <Button
                  role="combobox"
                  variant="card"
                  className={cn(
                    " h-[40px] justify-between",
                    !field.value && "  text-muted-foreground",
                  )}
                >
                  {field.value ? (
                    <div className="flex items-center gap-x-2">
                      <ImageLabel
                        item={items.find((item) => item.value === field.value)}
                      ></ImageLabel>
                    </div>
                  ) : (
                    placeholder ?? "Select Token"
                  )}

                  {!field.value ? (
                    <ChevronDown className="h-7 w-7" />
                  ) : (
                    <X
                      className="h-5 w-5"
                      onClick={(e) => {
                        e.preventDefault();
                        setStore("");
                        setValue(name, "");
                      }}
                    ></X>
                  )}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className=" w-[180px] p-0">
              <Command>
                <Show when={!field.value && !noSearch}>
                  <input
                    className="m-2 border-0 bg-transparent p-2 focus-within:bg-none"
                    placeholder={placeholder ?? "Search..."}
                    value={value}
                    onChange={(e) => onChangeInput?.(e.target.value)}
                  />
                </Show>
                <Show when={showItems.length === 0 && !loading}>
                  <CommandEmpty>No tokens found.</CommandEmpty>
                </Show>
                {/* <CommandGroup> */}
                <CommandList>
                  <Show
                    when={!loading}
                    fallback={
                      <div className="flex justify-center py-2">
                        <LoaderCircle className="animate-spin" />
                      </div>
                    }
                  >
                    {showItems.map((item) => (
                      <CommandItem
                        key={item.value + item.label}
                        value={item.value}
                        onSelect={() => {
                          setOpen(false);
                          setTimeout(() => {
                            setValue(name, item.value);
                            setStore(item.value);
                          }, 100);
                        }}
                        className="flex h-[40px] justify-between px-2"
                      >
                        <div className="flex items-center gap-x-2">
                          {item.imageUrl && (
                            <ImageWithFallback
                              height={100}
                              width={100}
                              className="h-[28px] w-[28px] rounded-full"
                              src={item.imageUrl}
                              alt={item.label}
                            />
                          )}
                          {item.label}
                        </div>
                        <Check
                          className={cn(
                            "h-5 w-5 ",
                            item.value === field.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </Show>
                </CommandList>
                {/* </CommandGroup> */}
              </Command>
            </PopoverContent>
          </Popover>

          <FormMessage />
        </FormItem>
      )}
    ></FormField>
  );
}

function ImageLabel({ item }: { item?: TItem }) {
  if (!item) return <></>;
  return (
    <div className="flex items-center gap-x-2">
      {item.imageUrl && (
        <ImageWithFallback
          height={100}
          width={100}
          className="h-[28px] w-[28px] rounded-full"
          src={item.imageUrl}
          alt={item.label}
        />
      )}
      {item.label}
    </div>
  );
}
