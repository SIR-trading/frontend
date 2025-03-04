import Link from "next/link";
import NavItem from "./navItem";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import SideNav from "./sideNav";
import hat from "../../public/images/sir-logo.svg";
import { CustomConnectButton } from "./customConnectButton";
export function Header() {
  return (
    <div className="flex items-center justify-between  px-[14px] py-[24px] text-white lg:mx-auto  xl:w-[1250px]">
      <div className="flex gap-x-6">
        <Link href={"/"} className="flex items-center gap-x-2">
          {/* <Image src={logo} alt="Sir-Trading Logo" className="h-[60px] w-auto" /> */}
          <div className="flex gap-x-1">
            <Image
              height={36}
              width={36}
              src={hat as StaticImageData}
              alt="Sir Icon"
            />
            <div className="flex items-center">
              <h1 className="sir-shadow h-[34px] font-lora text-[34px] font-normal leading-[34px] text-white drop-shadow-md">
                SIR.TRADING
              </h1>
            </div>
          </div>
        </Link>
        <div className="flex items-center">
          <nav className=" hidden items-center lg:flex">
            <div className=" flex gap-x-[16px] rounded-md  px-[12px] py-[12px] font-semibold text-muted-foreground">
              <ul
                aria-label="Core Navigation"
                className="flex gap-x-[16px]   rounded-md"
              >
                <NavItem theme="light" url={"/"}>
                  Leverage
                </NavItem>
                <NavItem theme="light" url={"/liquidity"}>
                  Liquidity
                </NavItem>
                <NavItem theme="light" url={"/portfolio"}>
                  Portfolio
                </NavItem>
              </ul>
              <div className="flex items-center">|</div>
              <ul className="flex" aria-label="Secondary Navigation">
                <NavItem url={"/stake"}>Stake</NavItem>
                <NavItem url={"/create-vault"}>Create Vault</NavItem>
                <NavItem url={"/leverage-calculator"}>Calculator</NavItem>
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
