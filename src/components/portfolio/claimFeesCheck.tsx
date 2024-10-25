import { FormLabel } from "@/components/ui/form";

import { Checkbox } from "@/components/ui/checkbox";
import { formatNumber } from "@/lib/utils";

interface Props {
  dividends?: string;
  value: boolean;
  onChange: (value: boolean) => void; // Add onChange prop
}

const ClaimFeesCheckbox = ({ dividends, value, onChange }: Props) => {
  console.log(dividends, "DIVIDENDS");
  if (!dividends) {
    return;
  }
  return (
    <div className=" justify-between gap-x-4 pt-2">
      <div className="flex justify-end gap-x-1 pb-2">
        <span className="justify-end text-sm text-[#B6B6C9]">
          Dividends: {""}
          {formatNumber(dividends, 6)} ETH
        </span>
      </div>
      <div className="flex items-center justify-end gap-x-4 pb-2">
        <Checkbox
          checked={value}
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
