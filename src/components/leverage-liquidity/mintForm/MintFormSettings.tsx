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
import ToolTip from "@/components/ui/tooltip";
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
          <div className=" relative w-[400px] rounded-xl border border-foreground/10 bg-secondary p-4 py-6 text-foreground">
            <DialogClose />
            <DialogTitle className=" font-normal text-foreground/80">
              Settings
            </DialogTitle>
            <div className="pt-6"></div>
            <div className="text-gray-300 flex w-full items-center justify-between rounded-sm border border-foreground/10 bg-foreground/10 p-4">
              {" "}
              <div className="flex items-center gap-x-1">
                <label htmlFor="slippage" className="text-sm ">
                  Slippage
                </label>
                <ToolTip>Slippage info</ToolTip>
              </div>
              <div className="flex gap-x-[2px] rounded-md bg-secondary px-2 py-2 text-[14px] focus-within:ring-2 focus-within:ring-foreground">
                <FormField
                  control={form.control}
                  name="slippage"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="text"
                          height="sm"
                          className="w-[50px] rounded-md bg-transparent px-0  "
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
        </DialogContent>
      </Dialog>
    </div>
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
