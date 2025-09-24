"use client";
import Link from "next/link";
import NavItem from "./navItem";
import Image from "next/image";
import SideNav from "./sideNav";
import { CustomConnectButton } from "./customConnectButton";
import MoreMenu from "./moreMenu";
import { TrendingUp, Droplets, Briefcase, Coins, Trophy, Gavel } from "lucide-react";
import dynamic from "next/dynamic";
import { env } from "@/env";
import { useMemo } from "react";
import { useClaimableBalances } from "@/hooks/useClaimableBalances";

const DarkModeToggle = dynamic(() => import("./darkModeToggle"), {
  ssr: false,
});
export function Header() {
  // Check for claimable balances
  const {
    hasDividendsAboveThreshold,
    hasContributorRewardsAboveThreshold,
    hasVaultRewardsAboveThreshold
  } = useClaimableBalances();

  // Determine if we're on a HyperEVM chain
  const isHyperEVM = useMemo(() => {
    const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
    return chainId === 998 || chainId === 999;
  }, []);

  // Determine which logos to use based on chain
  const logos = useMemo(() => {
    if (isHyperEVM) {
      return {
        dark: "/SIR+HyperLiquid_outline_white.svg",
        light: "/SIR+HyperLiquid_outline_black.svg"
      };
    }
    return {
      dark: "/SIR_outline_white.svg",
      light: "/SIR_outline_black.svg"
    };
  }, [isHyperEVM]);

  return (
    <div className="flex w-full max-w-[1280px] items-center justify-between px-3 py-[24px] lg:mx-auto">
      <div className="flex gap-x-8 lg:gap-x-10">
        <Link href={"/"} className="flex items-center gap-x-2">
          {/* <Image src={logo} alt="Sir-Trading Logo" className="h-[60px] w-auto" /> */}
          <div className="flex gap-x-1">
            <Image
              height={40}
              width={40}
              src={logos.dark}
              alt="Sir Icon"
              className="hidden rounded-full dark:block"
            />
            <Image
              height={40}
              width={40}
              src={logos.light}
              alt="Sir Icon"
              className="rounded-full dark:hidden"
            />
            <div className="flex items-center">
              <h1 className="ml-1 font-geist text-[20px] font-semibold leading-[20px] whitespace-nowrap">
                Sir trading
              </h1>
            </div>
          </div>
        </Link>
        <div className="flex items-center">
          <nav className="hidden md:flex items-center mt-[7px]">
            <div className="flex gap-x-[16px] rounded-md pl-[12px] pr-[24px] lg:pr-[12px] text-sm items-center">
              <ul
                aria-label="Core Navigation"
                className="flex gap-x-3 rounded-md"
              >
                <NavItem url={"/"} icon={TrendingUp}>Leverage</NavItem>
                <NavItem url={"/liquidity"} icon={Droplets}>Liquidity</NavItem>
                <NavItem
                  url={"/portfolio"}
                  icon={Briefcase}
                  hasRewardsNotification={hasVaultRewardsAboveThreshold}
                >
                  Portfolio
                </NavItem>
              </ul>
              {/* Show secondary nav items only on large screens */}
              <div className="hidden items-center lg:flex">
                <div className="mx-3 h-5 w-[2px] bg-foreground/25 rounded-full"></div>
              </div>
              <ul className="hidden lg:flex gap-x-3" aria-label="Secondary Navigation">
                <NavItem
                  url={"/stake"}
                  icon={Coins}
                  hasRewardsNotification={hasContributorRewardsAboveThreshold}
                  hasDividendsNotification={hasDividendsAboveThreshold}
                >
                  Stake
                </NavItem>
                <NavItem url={"/leaderboard"} icon={Trophy}>Leaderboard</NavItem>
                <NavItem url={"/auctions"} icon={Gavel}>Auctions</NavItem>
              </ul>
              {/* More menu for medium screens (shows all secondary items) */}
              <div className="flex lg:hidden">
                <MoreMenu variant="medium" />
              </div>
              {/* More menu for large screens (shows only Create Vault & Calculator) */}
              <div className="hidden lg:flex">
                <MoreMenu variant="large" />
              </div>
            </div>
          </nav>
        </div>
      </div>
      <div className="flex items-center justify-end gap-x-2">
        <DarkModeToggle />
        <CustomConnectButton />
        <SideNav />
      </div>
    </div>
  );
}

