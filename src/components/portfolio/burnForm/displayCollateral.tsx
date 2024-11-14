import ImageWithFallback from "@/components/shared/ImageWithFallback";
import { getLogoAsset } from "@/lib/assets";
import { formatNumber } from "@/lib/utils";
export function DisplayCollateral({
  bg,
  data,
  amount,
  collateralSymbol,
}: {
  bg: string;
  amount: string;
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
          <h2 className="text-[28px]">{formatNumber(amount, 4)}</h2>
        </div>
        <div>
          <div className={"flex  gap-x-2 "}>
            <div className="flex h-[45px] w-[140px] items-center gap-x-2 rounded-md bg-primary px-2">
              <ImageWithFallback
                src={getLogoAsset(data?.collateralToken)}
                alt="collateral"
                width={28}
                height={28}
              />
              <h3>{collateralSymbol}</h3>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between pt-1">
        {/* <span className="text-sm font-medium text-gray-500">$22.44</span> */}
        {/* <span className="text-sm italic text-gray">Balance $232.23</span> */}
      </div>
    </div>
  );
}

{
  /* KEEP FOR FUTURE */
}
{
  /* <div className="flex-grow">
              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger
                          className="h-[45px] w-[140px] "
                          colorScheme="light"
                        >
                          <SelectValue placeholder={"Select token"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {data?.collateralToken && (
                          <SelectItem value={data.collateralToken}>
                            Collateral
                          </SelectItem>
                        )}
                        {data?.debtToken && (
                          <SelectItem value={data.debtToken}>Debt</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div> */
}
