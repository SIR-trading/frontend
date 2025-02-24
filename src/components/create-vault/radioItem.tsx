import type { MutableRefObject, SyntheticEvent } from "react";
import { useCallback, useEffect, useRef } from "react";
import { FormControl } from "../ui/form";
import { RadioGroupItem } from "../ui/radio-group";
import { mapLeverage } from "@/lib/utils";
import ToolTip from "../ui/tooltip";

const leverageOptions = [
  "For extremely volatile pairs. Very low fees.",
  "For very volatile pairs. Low fees.",
  "Moderate leverage for a moderate fee.",
  "Recommended for long-term investors.",
  "Large leverage but pay large fee upfront.",
  "Very large leverage. High upfront fees.",
  "Extreme leverage. Very high upfront fees.",
];
const leverageDescriptions = [
  "Minimal liquidity needed.",
  "Little liquidity needed.",
  "Recommended.",
  "Recommended.",
  "Recommended.",
  "Large minting fee.",
  "Extreme minting fee.",
];
const leverageOptionsTitle = [
  "For extremely volatile pairs.",
  "For very volatile pairs.",
  "Moderate leverage for a moderate fee.",
  "Recommended for long-term investors.",
  "Large leverage but pay large fee upfront.",
  "Very large leverage.",
  "Extreme leverage.",
];
export function RadioItem({
  value,
  fieldValue,
  setValue,
  index,
}: {
  index: number;
  value: string;
  fieldValue: string;
  setValue: (s: string) => void;
}) {
  const selected = fieldValue === value;
  const radioRef = useRef(null);
  const handleCardClicked = useCallback(() => {
    setValue && setValue(value); // this function is a callback for change the "selected" state
  }, [setValue, value]);

  const handleRadioClick = useCallback((e: SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  useEffect(() => {
    if (selected) {
      if (radioRef.current) {
        const ref = radioRef as unknown as MutableRefObject<HTMLInputElement>;
        ref.current.focus();
        ref.current.click();
      }
    }
  }, [selected]);
  return (
    <FormControl>
      <div
        data-active={value === fieldValue ? "true" : ""}
        className={`flex w-full cursor-pointer justify-between gap-x-2
                    rounded-md border-2 border-secondary-500 bg-secondary-500  px-2
                    py-1 hover:border-secondary-200 data-[active=true]:border-gold`}
        onClick={handleCardClicked}
      >
        <div className="flex select-none flex-col  gap-y-1">
          <span className="text-[14px]">{mapLeverage(value)}x</span>
          <span className="flex   gap-x-1 text-[11px] text-gray-500">
            {/* <ToolTip>{leverageOptions[index]}</ToolTip> */}
            {leverageDescriptions[index]}
          </span>
        </div>

        <div className="flex items-center">
          <RadioGroupItem
            ref={radioRef}
            onClick={handleRadioClick}
            value={value}
          />
        </div>
      </div>
    </FormControl>
  );
}
