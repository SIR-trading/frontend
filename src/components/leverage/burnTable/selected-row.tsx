import { X } from "lucide-react";
import BurnTableHeaders from "./burnTableHeader";
import type { TAddressString, TBurnRow } from "@/lib/types";

import { useAccount } from "wagmi";
import { api } from "@/trpc/react";
import { formatBigInt, getLeverageRatio } from "@/lib/utils";
import BurnForm from "../burnForm/burnForm";

export default function SelectedRow({
  params,
  close,
  apeAddress,
}: {
  params: TBurnRow | undefined;
  apeAddress: TAddressString;
  close: () => void;
}) {
  const { address } = useAccount();
  const { data } = api.user.getApeBalance.useQuery({
    address: apeAddress,
    user: address,
  });
  if (!params) {
    <div>
      <h1>Hello</h1>
    </div>;
  }
  return (
    <div>
      <div className="flex flex-col gap-y-4 border-b-2 pb-8">
        <button
          type="button"
          onClick={() => close()}
          className="absolute -right-4 -top-12 cursor-pointer text-white/80 transition-transform hover:scale-105 hover:text-white"
        >
          <X />
        </button>
        <BurnTableHeaders />
        <tr className="grid h-[41px] grid-cols-5 items-center text-left text-gray text-white">
          <th>{params?.APE.slice(0, 4)}</th>
          <th>{params?.debtSymbol}</th>
          <th>{params?.collateralSymbol}</th>
          <th>{getLeverageRatio(parseInt(params?.leverageTier ?? "0"))}x</th>
          <th>{formatBigInt(data, 4)}</th>
        </tr>
      </div>
      <div className="flex justify-center pt-4">
        <div className=" w-[500px] justify-between">
          <BurnForm
            balance={data}
            address={apeAddress}
            collateralSymbol={params?.collateralSymbol}
          />
        </div>
      </div>
    </div>
  );
}
