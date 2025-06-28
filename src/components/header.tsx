import Link from "next/link";
import NavItem from "./navItem";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import SideNav from "./sideNav";
import hat from "../../public/images/sir-logo.svg";
import { CustomConnectButton } from "./customConnectButton";
export function Header() {
  return (
    <div className="flex w-full max-w-[1280px] items-center justify-between px-3 py-[24px] lg:mx-auto">
      <div className="flex gap-x-6">
        <Link href={"/"} className="flex items-center gap-x-2">
          {/* <Image src={logo} alt="Sir-Trading Logo" className="h-[60px] w-auto" /> */}
          <div className="flex gap-x-1">
            <Image
              height={36}
              width={36}
              src={hat as StaticImageData}
              alt="Sir Icon"
              className="rounded-full"
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
            <div className=" flex flex-col gap-x-[16px] rounded-md px-[12px] py-[12px] text-sm lg:flex-row">
              <ul
                aria-label="Core Navigation"
                className="flex gap-x-3 rounded-md"
              >
                <NavItem url={"/"}>Leverage</NavItem>
                <NavItem url={"/liquidity"}>Liquidity</NavItem>
                <NavItem url={"/portfolio"}>Portfolio</NavItem>
              </ul>
              <div className="hidden items-center lg:flex">|</div>
              <ul className="flex gap-x-3" aria-label="Secondary Navigation">
                <NavItem url={"/stake"}>Stake</NavItem>
                <NavItem url={"/create-vault"}>Create Vault</NavItem>
                <NavItem url={"/leverage-calculator"}>Calculator</NavItem>
                <NavItem url={"/auctions"}>Auctions</NavItem>
                {/* <NavItem url={"/get-tokens"}>Get Tokens</NavItem> */}
              </ul>
            </div>
          </nav>
        </div>
      </div>
      <div className="flex items-center justify-end gap-x-2">
        <CustomConnectButton />
        <SideNav />
      </div>
    </div>
  );
}
