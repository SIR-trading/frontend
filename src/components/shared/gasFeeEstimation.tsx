import React from "react";
import { ChevronDown } from "lucide-react";

const GasFeeEstimation = () => {
  return (
    <div className="mt-5 flex w-[85%] flex-row justify-between">
      <div className="text-sm text-foreground/70">$20.55 in gas fee</div>
      <ChevronDown color="gray" size={20} strokeWidth={3} />
    </div>
  );
};

export default GasFeeEstimation;
