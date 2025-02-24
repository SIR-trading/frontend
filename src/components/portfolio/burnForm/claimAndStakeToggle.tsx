import { Checkbox } from "@/components/ui/checkbox";
import React from "react";

interface Props {
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void; // Add onChange prop
}

export default function ClaimAndStakeToggle({
  value,
  disabled,
  onChange,
}: Props) {
  return (
    <Checkbox
      className="border-2 border-white/70 bg-secondary-600"
      checked={value}
      onCheckedChange={(value) => {
        onChange(Boolean(value)); // Call onChange to update the state in UnstakeForm
      }}
      disabled={disabled}
    ></Checkbox>
  );
}
