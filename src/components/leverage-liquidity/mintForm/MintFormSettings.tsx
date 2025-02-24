import { Settings } from "lucide-react";
import React from "react";
import useIsDebtToken from "./hooks/useIsDebtToken";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import { inputPatternMatch } from "@/lib/utils";
export default function MintFormSettings() {
  const isDebt = useIsDebtToken();
  const form = useFormContext<TMintFormFields>();
  if (!isDebt) return;
  return (
    <div className="flex items-center">
      <Dialog>
        <DialogTrigger>
          <Settings className="h-4 w-4 " />
        </DialogTrigger>
        <DialogContent>
          <div className="relative  rounded-xl border border-secondary-1000 bg-secondary-900 p-4 py-6 text-white">
            <DialogClose />
            <DialogTitle className="border-b-2 border-secondary-400 pb-2 text-xl font-bold text-gray-200">
              Settings
            </DialogTitle>
            <div className=" pt-2"></div>
            <div className=" w-full items-center justify-between rounded-sm text-gray-300">
              {" "}
              <div className="flex items-center gap-x-1">
                <label htmlFor="slippage" className="text-md ">
                  Slippage
                </label>
              </div>
              <div className="flex justify-between gap-x-3 pt-2">
                <SlippageBtn title="0.1" value={0.1} active={false} />
                <SlippageBtn title="0.5" value={0.5} active={false} />
                <SlippageBtn title="1.0" value={1} active={false} />
                <div className="flex w-[120px] justify-between gap-x-[2px] rounded-md bg-secondary-400 px-2 py-2 text-[16px] focus-within:ring-2 focus-within:ring-white">
                  <FormField
                    control={form.control}
                    name="slippage"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="text"
                            height="sm"
                            className="text-md w-[50px] rounded-md bg-transparent px-0  "
                            inputMode="decimal"
                            autoComplete="off"
                            pattern="^[0-9]*[.,]?[0-9]*$"
                            background="primary"
                            placeholder="0"
                            {...field}
                            onChange={(e) => {
                              if (e.target.value === "") {
                                return field.onChange(e.target.value);
                              }
                              const value = parseFloat(e.target.value);
                              if (
                                value <= 10 &&
                                inputPatternMatch(e.target.value, 1)
                              ) {
                                return field.onChange(e.target.value);
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <span>%</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function SlippageBtn({
  value,
  active,
  title,
}: {
  title: string;
  value: number;
  active: boolean;
}) {
  return (
    <button
      data-state={active ? "active" : "inactive"}
      className="rounded-md bg-secondary-400 p-2 data-[state=active]:bg-gold data-[state=active]:text-black/90"
    >
      {title}%
    </button>
  );
}

// <FormField
//   control={form.control}
//   name="slippage"
//   render={({ field }) => (
//     <FormItem>
//       <FormControl>
//         <Input
//           type="text"
//           height="sm"
//           className="w-full bg-transparent  px-1 text-[12px]"
//           inputMode="decimal"
//           autoComplete="off"
//           pattern="^[0-9]*[.,]?[0-9]*$"
//           background="primary"
//           placeholder="0"
//           {...field}
//           onChange={(e) => {
//             if (inputPatternMatch(e.target.value, decimals)) {
//               return field.onChange(e.target.value);
//             }
//           }}
//         />
//       </FormControl>
//     </FormItem>
