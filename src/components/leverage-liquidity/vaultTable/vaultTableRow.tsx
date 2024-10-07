import { Badge, type badgeVariants } from "@/components/ui/badge";
import {
  calculateApeVaultFee,
  formatNumber,
  getLeverageRatio,
  getLogoAsset,
  // mapLeverage,
  roundDown,
} from "@/lib/utils";

import {
  // HoverCardArrow,
  HoverCardContent,
  HoverCardTrigger,
} from "@radix-ui/react-hover-card";
import unknownImg from "@/../public/IconUnknown.png";
import type { VariantProps } from "class-variance-authority";
import { useMintFormProviderApi } from "@/components/providers/mintFormProviderApi";
import type { TVault } from "@/lib/types";
import { formatUnits, parseUnits } from "viem";
import { useMemo } from "react";
import ImageWithFallback from "@/components/shared/ImageWithFallback";
import useCalculateVaultHealth from "./hooks/useCalculateVaultHealth";
import { HoverCard } from "@/components/ui/hover-card";

export function VaultTableRow({
  pool,
  isApe,
}: {
  badgeVariant: VariantProps<typeof badgeVariants>;
  number: string;
  pool: TVault;
  isApe: boolean;
}) {
  const fee = calculateApeVaultFee(pool.leverageTier) * 100;
  const POL = useMemo(() => {
    const totalLocked = parseUnits(pool.totalTea, 0);
    const lockedLiquidity = parseUnits(pool.lockedLiquidity, 0);
    if (lockedLiquidity > 0n && totalLocked > 0n) {
      const percent = (lockedLiquidity * 10000n) / totalLocked;
      console.log(lockedLiquidity, totalLocked);
      return parseFloat(percent.toString()) / 100;
    } else {
      return 0;
    }
  }, [pool.lockedLiquidity, pool.totalTea]);

  const { setValue } = useMintFormProviderApi();
  const teaCollateral = parseFloat(formatUnits(pool.teaCollateral, 18));
  const apeCollateral = parseFloat(formatUnits(pool.apeCollateral, 18));
  const tvl = apeCollateral + teaCollateral;
  const tvlPercent = tvl / apeCollateral;
  const variant = useCalculateVaultHealth({
    tvl: parseUnits(pool.totalValue, 18),
    isApe,
    leverageTier: pool.leverageTier,
    apeCollateral: pool.apeCollateral,
    teaCollateral: pool.teaCollateral,
  });
  const showPercent = () => {
    if (!isFinite(tvlPercent)) {
      return false;
    }
    if (isApe) {
      if (variant.variant === "red") {
        return true;
      }
    }
  };
  return (
    <tr
      onClick={() => {
        setValue("versus", pool.debtToken + "," + pool.debtSymbol);
        setValue("long", pool.collateralToken + "," + pool.collateralSymbol);
        setValue("leverageTier", pool.leverageTier.toString());
      }}
      className="grid cursor-pointer grid-cols-6 rounded-md   px-1 py-1 text-left text-[16px] text-sm font-normal transition-colors hover:bg-primary md:grid-cols-9"
    >
      <th className="">{pool.vaultId}</th>
      <th className="flex items-center md:col-span-3">
        <ImageWithFallback
          fallbackImageUrl={unknownImg}
          className="h-6 w-6 rounded-full "
          src={getLogoAsset(pool.collateralToken as `0x${string}`)}
          width={28}
          height={28}
          alt=""
        />
        <ImageWithFallback
          className="h-6 w-6 rounded-full "
          fallbackImageUrl={unknownImg}
          src={getLogoAsset(pool.debtToken as `0x${string}`)}
          width={28}
          height={28}
          alt=""
        />
        <div className="px-1"></div>
        <span className="hidden font-normal md:block">
          {pool.collateralSymbol}/{pool.debtSymbol}
        </span>
      </th>
      <th className="flex items-center">
        <h4 className="font-normal text-gray-200">{formatNumber(POL, 1)}%</h4>
      </th>
      <th className="flex items-center gap-x-1 text-[13px] font-normal text-red-400">
        {roundDown(fee, 2)}%{" "}
      </th>
      <th className="pl-2">
        <HoverCard openDelay={0} closeDelay={20}>
          <HoverCardTrigger asChild>
            <div>
              <Badge {...variant} className="text-nowrap text-[9px]">
                {`${getLeverageRatio(pool.leverageTier)}x${showPercent() ? " (" + formatNumber(tvlPercent, 2) + "x)" : ""}`}
              </Badge>
            </div>
          </HoverCardTrigger>
          <HoverCardContent side="bottom" alignOffset={10}>
            <div className="mt-2 max-w-[200px] rounded-sm bg-white px-2 py-2 text-[13px] font-medium text-gray-800">
              {variant.variant === "green" &&
                (isApe ? (
                  <span>Healthy, more than enough liquidity.</span>
                ) : (
                  <span>Highly profitable</span>
                ))}
              {variant.variant === "yellow" &&
                (isApe ? (
                  <span>Borderline, just enough liquidity.</span>
                ) : (
                  <span>Moderately profitable</span>
                ))}
              {variant.variant === "red" &&
                (isApe ? (
                  <span>
                    Degraded, insufficient liquidity for constant leverage.
                  </span>
                ) : (
                  <span>Minimally profitable</span>
                ))}
            </div>
          </HoverCardContent>
        </HoverCard>
      </th>

      <th className="flex items-center justify-end gap-x-1 text-right md:col-span-2">
        <span>
          {formatNumber(formatUnits(parseUnits(pool.totalValue, 0), 18), 4)}
        </span>
        <span className=" hidden font-light text-gray-300 md:block">
          {pool.collateralSymbol}
        </span>
      </th>
    </tr>
  );
}
