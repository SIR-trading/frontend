import type { ReactNode } from "react";
import StakeData from "@/components/stake/stakeData/stakeData";

const stakePage = ({ children }: { children: ReactNode }) => {
  return (
    <div className="w-[50%]">
      <div className="flex flex-col items-center">
        {/* <div className="font-lora font-bold text-3xl">Stake your SIR</div> */}
        {/* <div className="mt-[24px] text-sm"> */}
        {/*   By staking your SIR you have a pro-rata claim on future fees from the */}
        {/*   SIR protocol. <br /> The amount will depend on the activity on SIR and */}
        {/*   what vaults are most active. */}
        {/* </div> */}
      </div>
      <StakeData></StakeData>
      {children}
    </div>
  );
};

export default stakePage;
