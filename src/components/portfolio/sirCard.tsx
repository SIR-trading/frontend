import { api } from "@/trpc/react";
import { useAccount } from "wagmi";
import StakeCard from "./stakeCard";
import { TokenDisplay } from "../ui/token-display";

export function SirCard() {
  const { isConnected, address } = useAccount();
  const { data: totalBalance } = api.user.getUnstakedSirBalance.useQuery(
    {
      user: address,
    },
    { enabled: isConnected },
  );
  return (
    <div className="rounded-md bg-secondary-600 bg-opacity-40 p-2 pb-2">
      <div className=" flex justify-between rounded-md text-2xl">
        <div className="flex gap-x-2 ">
          <div className="flex w-full justify-between">
            <div>
              <h2 className="pb-1 text-sm text-gray-200">Your Unstaked SIR</h2>
              <div className="flex justify-between text-3xl   ">
                <div className="flex items-end gap-x-1">
                  <TokenDisplay
                    amount={totalBalance}
                    decimals={12}
                    unitLabel={"SIR"}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <StakeCard bal={totalBalance} />
      </div>
    </div>
  );
}
