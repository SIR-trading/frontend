import { TokenImage } from "@/components/shared/TokenImage";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { formatNumber } from "@/lib/utils";
export function DisplayCollateral({
  bg,
  data,
  amount,
  collateralSymbol,
  isClaiming,
}: {
  bg: string;
  amount: string;
  isClaiming: boolean;
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
            <DisplayFormattedNumber num={formatNumber(amount, 4)} />
          </h2>
        </div>
        <div>
          <div className={"flex  gap-x-2 "}>
            <div
              data-state={!isClaiming ? "claiming" : ""}
              className="flex h-[45px] w-[134px] items-center  gap-x-2 rounded-md bg-secondary-800 px-2 data-[state=claiming]:justify-end "
            >
              <TokenImage
                address={data?.collateralToken}
                alt="collateral"
                width={28}
                height={28}
              />
              <h3>{collateralSymbol}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
