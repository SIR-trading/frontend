import { FormLabel } from "@/components/ui/form";

import { Checkbox } from "@/components/ui/checkbox";
import DisplayFormattedNumber from "../shared/displayFormattedNumber";
import { getNativeCurrencySymbol } from "@/lib/chains";

interface Props {
  dividends?: string;
  value: boolean;
  onChange: (value: boolean) => void; // Add onChange prop
}

const ClaimFeesCheckbox = ({ dividends, value, onChange }: Props) => {
  return (
    <div className="flex justify-between gap-x-4 pt-2">
      <div className="flex items-center gap-x-1 pb-2">
        <span className="font-geist-mono items-center text-sm text-on-bg-subdued">
          Dividends: {""}
          <DisplayFormattedNumber
            num={dividends ?? "0"}
            significant={6}
          />{" "}
          {getNativeCurrencySymbol()}
        </span>
      </div>
      <div className="flex items-center justify-end gap-x-2 pb-2">
        <Checkbox
          className="border border-foreground bg-foreground/5"
          checked={value}
          disabled={!Boolean(dividends)}
          onCheckedChange={(value) => {
            onChange(Boolean(value)); // Call onChange to update the state in UnstakeForm
          }}
        ></Checkbox>
        <FormLabel className=" text-md font-medium">Claim Dividends</FormLabel>
      </div>
    </div>
  );
};

export default ClaimFeesCheckbox;
