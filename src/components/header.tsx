"use client";
import Link from "next/link";
import NavItem from "./navItem";
import Image from "next/image";
import SideNav from "./sideNav";
import { CustomConnectButton } from "./customConnectButton";
import MoreMenu from "./moreMenu";
import dynamic from "next/dynamic";

const DarkModeToggle = dynamic(() => import("./darkModeToggle"), {
  ssr: false,
});
export function Header() {
  return (
    <div className="flex w-full max-w-[1280px] items-center justify-between px-3 py-[24px] lg:mx-auto">
      <div className="flex gap-x-6">
        <Link href={"/"} className="flex items-center gap-x-2">
          {/* <Image src={logo} alt="Sir-Trading Logo" className="h-[60px] w-auto" /> */}
          <div className="flex gap-x-1">
            <Image
              height={32}
              width={32}
              src="/SIR_no_bg.svg"
              alt="Sir Icon"
              className="hidden rounded-full dark:block"
            />
            <Image
              height={32}
              width={32}
              src="/SIR_outline2.svg"
              alt="Sir Icon"
              className="rounded-full dark:hidden"
            />
            <div className="flex items-center">
              <h1 className="ml-1 font-geist text-[20px] font-semibold leading-[20px]">
                Sir trading
              </h1>
            </div>
          </div>
        </Link>
        <div className="flex items-center">
          <nav className=" hidden items-center md:flex">
            <div className=" flex gap-x-[16px] rounded-md px-[12px] text-sm">
              <ul
                aria-label="Core Navigation"
                className="flex gap-x-3 rounded-md"
              >
                <NavItem url={"/"}>Leverage</NavItem>
                <NavItem url={"/liquidity"}>Liquidity</NavItem>
                <NavItem url={"/portfolio"}>Portfolio</NavItem>
              </ul>
              {/* Show secondary nav items only on large screens */}
              <div className="hidden items-center lg:flex">|</div>
              <ul className="hidden lg:flex gap-x-3" aria-label="Secondary Navigation">
                <NavItem url={"/stake"}>Stake</NavItem>
                <NavItem url={"/leaderboard"}>Leaderboard</NavItem>
                <NavItem url={"/auctions"}>Auctions</NavItem>
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

