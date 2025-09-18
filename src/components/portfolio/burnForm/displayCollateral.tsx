import { TokenImage } from "@/components/shared/TokenImage";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { Loader2 } from "lucide-react";

export function DisplayCollateral({
  bg,
  data,
  amount,
  collateralSymbol,
  isClaiming,
  isLoading,
}: {
  bg: string;
  amount: string;
  isClaiming: boolean;
  isLoading?: boolean;
  data:
    | {
        leverageTier: number | undefined;
        debtToken: `0x${string}` | undefined;
        collateralToken: `0x${string}` | undefined;
      }
    | undefined;
  collateralSymbol: string | undefined;
}) {
  return (
    <div className={`w-full  ${bg} `}>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-[28px]">
            {isLoading ? (
              <Loader2 className="animate-spin" size={28} />
            ) : (
              <DisplayFormattedNumber num={amount} significant={4} />
            )}
          </h2>
        </div>
        <div>
          <div className={"flex  gap-x-2 "}>
            <div
              data-state={!isClaiming ? "claiming" : ""}
              className="flex h-[45px] w-[134px] items-center justify-end gap-x-2 rounded-md bg-secondary-800"
            >
              <h3>{collateralSymbol}</h3>
              <TokenImage
                address={data?.collateralToken}
                alt="collateral"
                width={28}
                height={28}
                className="rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
