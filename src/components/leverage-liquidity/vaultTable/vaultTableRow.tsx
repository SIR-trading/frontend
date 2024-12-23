import { Badge, type badgeVariants } from "@/components/ui/badge";
import { formatNumber, roundDown } from "@/lib/utils";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import boostIcon from "@/../public/images/white-logo.svg";
import { motion } from "motion/react";
import unknownImg from "@/../public/IconUnknown.png";
import type { VariantProps } from "class-variance-authority";
import { useMintFormProviderApi } from "@/components/providers/mintFormProviderApi";
import type { TVault } from "@/lib/types";
import { formatUnits, parseUnits } from "viem";
import { useMemo, useState } from "react";
import ImageWithFallback from "@/components/shared/ImageWithFallback";
import useCalculateVaultHealth from "./hooks/useCalculateVaultHealth";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { TokenDisplay } from "@/components/ui/token-display";
import {
  calculateApeVaultFee,
  getLeverageRatio,
} from "@/lib/utils/calculations";
import { getLogoAsset } from "@/lib/assets";
import { api } from "@/trpc/react";
import useVaultFilterStore from "@/lib/store";

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
  const [tick, setTick] = useState(0n);
  // Add a query to retrieve collateral data
  // Hydrate with server data
  const { data: reservesData } = api.vault.getReserve.useQuery(
    {
      vaultId: Number.parseInt(pool.vaultId),
    },
    {
      // Dont fetch data on component mount
      // Data is from server and is fresh until invalidation
      refetchOnMount: false,
      initialData: [
        {
          reserveApes: pool.apeCollateral,
          reserveLPers: pool.teaCollateral,
          tickPriceX42: tick,
        },
      ],
    },
  );
  const { setValue } = useMintFormProviderApi();
  const teaCollateral = parseFloat(
    formatUnits(reservesData[0]?.reserveLPers ?? 0n, 18),
  );
  const apeCollateral = parseFloat(
    formatUnits(reservesData[0]?.reserveApes ?? 0n, 18),
  );
  const tvl = apeCollateral + teaCollateral;
  const tvlPercent = tvl / apeCollateral;
  const variant = useCalculateVaultHealth({
    isApe,
    leverageTier: pool.leverageTier,
    apeCollateral: reservesData[0]?.reserveApes ?? 0n,
    teaCollateral: reservesData[0]?.reserveLPers ?? 0n,
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
  const parsedTaxAmount = parseUnits(pool.taxAmount, 0);
  const setAll = useVaultFilterStore((state) => state.setAll);
  return (
    <tr
      onClick={() => {
        setValue("versus", pool.debtToken + "," + pool.debtSymbol);
        setValue("long", pool.collateralToken + "," + pool.collateralSymbol);
        setValue("leverageTier", pool.leverageTier.toString());
        console.log("--===== SET ALL ======--");
        setAll(
          pool.leverageTier.toString(),
          pool.debtToken + "," + pool.debtSymbol,
          pool.collateralToken + "," + pool.collateralSymbol,
        );
      }}
      className="grid cursor-pointer grid-cols-4 rounded-md   px-1 py-1 text-left text-[16px] text-sm font-normal transition-colors hover:bg-primary md:grid-cols-9"
    >
      <th className="">
        <div className="flex items-center gap-x-2">
          <span>{pool.vaultId}</span>
          {parsedTaxAmount > 0n && (
            <HoverCard openDelay={0} closeDelay={20}>
              <HoverCardTrigger asChild>
                <div>
                  <Image
                    src={boostIcon as StaticImageData}
                    height={24}
                    width={24}
                    className=" "
                    alt="Boost Icon"
                  />
                </div>
              </HoverCardTrigger>
              <HoverCardContent side="top" alignOffset={10}>
                <div className="mb-2 max-w-[200px] rounded-sm bg-white px-2 py-2 text-[13px] font-medium text-gray-800">
                  <span>
                    {`LPers of this vault are rewarded with
                    ${formatNumber(formatUnits(parsedTaxAmount * 24n * 60n * 60n, 12), 10)}
                    SIR/day.`}
                  </span>
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
        </div>
      </th>
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
      <th className="hidden items-center md:flex">
        <h4 className="font-normal text-gray-200">{formatNumber(POL, 1)}%</h4>
      </th>
      <th className="hidden items-center gap-x-1 text-[13px] font-normal text-red-400 md:flex">
        {roundDown(fee, 2)}%{" "}
      </th>
      <th className="pl-2">
        <HoverCard openDelay={0} closeDelay={20}>
          <HoverCardTrigger asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <Badge {...variant} className="text-nowrap text-[10px]">
                {`${getLeverageRatio(pool.leverageTier)}x${showPercent() ? " (" + formatNumber(tvlPercent, 2) + "x)" : ""}`}
              </Badge>
            </motion.div>
          </HoverCardTrigger>
          <HoverCardContent side="top" alignOffset={4}>
            <div className="mb-3 max-w-[200px] rounded-sm bg-white px-2 py-2 text-[13px] font-medium text-gray-800">
              <DisplayBadgeInfo
                variant={variant}
                isApe={isApe}
              ></DisplayBadgeInfo>
            </div>
          </HoverCardContent>
        </HoverCard>
      </th>

      <th className="flex items-center justify-end gap-x-1 text-right md:col-span-2">
        <TokenDisplay
          labelSize="small"
          amountSize="small"
          amount={parseUnits(pool.totalValue, 0)}
          decimals={pool.apeDecimals}
          unitLabel={pool.collateralSymbol}
        />
      </th>
    </tr>
  );
}

function DisplayBadgeInfo({
  variant,
  isApe,
}: {
  variant: VariantProps<typeof badgeVariants>;
  isApe: boolean;
}) {
  if (variant.variant === "green") {
    return isApe ? (
      <span>Healthy, more than enough liquidity.</span>
    ) : (
      <span>Highly profitable</span>
    );
  }
  if (variant.variant === "yellow") {
    return isApe ? (
      <span>Borderline liquidity. Do not mint.</span>
    ) : (
      <span>Moderately profitable</span>
    );
  }
  if (variant.variant === "red") {
    return isApe ? (
      <span>Degraded, insufficient liquidity for constant leverage.</span>
    ) : (
      <span>Minimally profitable</span>
    );
  }
}
