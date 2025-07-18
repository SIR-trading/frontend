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
import { useMemo } from "react";
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
import useVaultFilterStore from "@/lib/store";
import { useFormContext } from "react-hook-form";
import type { TCalculatorFormFields } from "@/components/providers/calculatorFormProvider";

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
      return parseFloat(percent.toString()) / 100;
    } else {
      return 0;
    }
  }, [pool.lockedLiquidity, pool.totalTea]);
  // // Add a query to retrieve collateral data
  // // Hydrate with server data
  // const { data: reservesData } = api.vault.getReserve.useQuery(
  //   {
  //     vaultId: Number.parseInt(pool.vaultId),
  //   },
  //   {
  //     // Dont fetch data on component mount
  //     // Data is from server and is fresh until invalidation
  //     refetchOnMount: false,
  //     initialData: [
  //       {
  //         reserveApes: pool.apeCollateral,
  //         reserveLPers: pool.teaCollateral,
  //         tickPriceX42: 0n,
  //       },
  //     ],
  //   },
  // );

  const reservesData = useMemo(() => {
    const a = [
      {
        reserveApes: pool.apeCollateral,
        reserveLPers: pool.teaCollateral,
        tickPriceX42: 0n,
      },
    ];
    return a;
  }, [pool.apeCollateral, pool.teaCollateral]);
  
  // Get both form contexts - one might be null depending on which page we're on
  const { setValue: setMintValue } = useMintFormProviderApi();
  
  // For Calculator page - create a wrapper function
  let calculatorSetValue: ((name: string, value: string) => void) | null = null;
  try {
    const calculatorForm = useFormContext<TCalculatorFormFields>();
    calculatorSetValue = (name: string, value: string) => {
      calculatorForm.setValue(name as keyof TCalculatorFormFields, value);
    };
  } catch {
    // Calculator form context not available, we're probably on Leverage/Liquidity page
  }
  
  // Use calculator form if available, otherwise use mint form
  const setValue = calculatorSetValue ?? setMintValue;
  
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
  const parsedRateAmount = parseUnits(String(pool.rate || "0"), 0); // CONVERT rate
  const setAll = useVaultFilterStore((state) => state.setAll);
  return (
    <tr
      onClick={() => {
        setValue("versus", pool.debtToken + "," + pool.debtSymbol);
        setValue("long", pool.collateralToken + "," + pool.collateralSymbol);
        setValue("leverageTier", pool.leverageTier.toString());
        setAll(
          pool.leverageTier.toString(),
          pool.debtToken + "," + pool.debtSymbol,
          pool.collateralToken + "," + pool.collateralSymbol,
        );
      }}
      className="grid cursor-pointer grid-cols-4 rounded-md py-1 text-left text-[16px] text-sm font-normal transition-colors  hover:bg-primary/20 md:grid-cols-9 dark:hover:bg-primary"
    >
      <td className="h-full">
        <div className="flex h-full items-center gap-x-1">
          <span className="w-5">{pool.vaultId}</span>
          {parsedRateAmount > 0n && (
            <HoverCard openDelay={0} closeDelay={20}>
              <HoverCardTrigger asChild>
                <div className="flex h-full items-center">
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
                <div className="mb-2 max-w-[200px] rounded-sm  bg-primary/5  px-2 py-2 text-[13px] font-medium backdrop-blur-xl dark:bg-primary">
                  <span>
                    {`LPers of this vault are rewarded with
                    ${formatNumber(formatUnits(parsedRateAmount * 24n * 60n * 60n, 12), 10)}
                    SIR/day.`}
                  </span>
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
        </div>
      </td>
      <td className="relative flex items-center md:col-span-3">
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
      </td>
      <td className="hidden items-center md:flex">
        <h4 className="font-normal text-foreground/80">
          {formatNumber(POL, 1)}%
        </h4>
      </td>
      <td className="hidden items-center gap-x-1 text-[13px] font-normal text-red md:flex">
        {roundDown(fee, 2)}%{" "}
      </td>
      <td className="relative flex items-center">
        <HoverCard openDelay={0} closeDelay={20}>
          <HoverCardTrigger asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <Badge {...variant} className="text-nowrap text-[10px]">
                {`^${getLeverageRatio(pool.leverageTier)}${showPercent() ? " (^" + formatNumber(tvlPercent, 2) + ")" : ""}`}
              </Badge>
            </motion.div>
          </HoverCardTrigger>
          <HoverCardContent side="top" alignOffset={4}>
            <div className="mb-3 max-w-[200px] rounded-sm bg-primary/5 px-2 py-2 text-[13px] font-medium backdrop-blur-xl dark:bg-primary">
              <DisplayBadgeInfo
                variant={variant}
                isApe={isApe}
              ></DisplayBadgeInfo>
            </div>
          </HoverCardContent>
        </HoverCard>
      </td>

      <td className="relative flex items-center justify-end gap-x-1 text-right md:col-span-2">
        <HoverCard openDelay={0} closeDelay={20}>
          <HoverCardTrigger asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <TokenDisplay
                labelSize="small"
                amountSize="small"
                amount={parseUnits(pool.totalValue, 0)}
                decimals={pool.apeDecimals}
                unitLabel={pool.collateralSymbol}
              />
            </motion.div>
          </HoverCardTrigger>
          <HoverCardContent side="top" alignOffset={4}>
            <div className="mb-3 max-w-[200px] rounded-sm bg-primary/5 px-2 py-2 text-[13px] font-medium backdrop-blur-xl dark:bg-primary">
              <div className="grid grid-cols-3 gap-x-2">
                <div className="text-left font-bold">Apes:</div>
                <TokenDisplay
                  amount={reservesData[0]?.reserveApes ?? 0n}
                  amountSize="small"
                  unitLabel=""
                  decimals={pool.apeDecimals}
                />
                <div>({((apeCollateral * 100) / (tvl ?? 1)).toFixed(2)}%)</div>
                <div className="text-left font-bold">LPers:</div>
                <TokenDisplay
                  amount={reservesData[0]?.reserveLPers ?? 0n}
                  amountSize="small"
                  unitLabel=""
                  decimals={pool.apeDecimals}
                />
                <div>({((teaCollateral * 100) / (tvl ?? 1)).toFixed(2)}%)</div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </td>
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
      <span>Healthy, more than enough liquidity</span>
    ) : (
      <span>Great for LPing</span>
    );
  }
  if (variant.variant === "yellow") {
    return isApe ? (
      <span>Not enough liquidity for new minters</span>
    ) : (
      <span>Good for LPing</span>
    );
  }
  if (variant.variant === "red") {
    return isApe ? (
      <span>Insufficient liquidity for constant leverage</span>
    ) : (
      <span>Minimally profitable</span>
    );
  }
}
