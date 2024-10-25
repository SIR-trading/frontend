import { Button } from "../ui/button";
import { formatUnits } from "viem";
import { formatNumber } from "@/lib/utils";
import UnstakeFormProvider from "../providers/unstakeFormProvider";
import { UnstakeModal } from "./unstakeModal";
import { useState } from "react";
import { useGetStakedSir } from "../shared/hooks/useGetStakedSir";

export function UnstakeCard() {
  const [openModal, setOpenModal] = useState(false);
  const stakedSir = useGetStakedSir();
  return (
    <div className=" border-secondary-300">
      <UnstakeFormProvider>
        <UnstakeModal open={openModal} setOpen={setOpenModal} />
      </UnstakeFormProvider>
      <div className="rounded-md bg-secondary-400 px-2 py-2 text-2xl">
        <h2 className="flex items-center gap-x-1 pb-1 text-sm text-gray-200 ">
          <span>Staked Sir</span>
        </h2>
        <div className="flex items-center justify-between">
          <div className="text-3xl   ">
            <h4>
              <span>{formatNumber(formatUnits(stakedSir ?? 0n, 12))}</span>
              <span className="text-sm text-gray-500"> SIR</span>
            </h4>
          </div>
          <Button onClick={() => setOpenModal(true)} className="py-2">
            Unstake
          </Button>
        </div>
      </div>
    </div>
  );
}
