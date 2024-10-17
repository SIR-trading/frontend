import Link from "next/link";
import NavItem from "./navItem";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import SideNav from "./sideNav";
import hat from "../../public/images/sir-logo.svg";
import { CustomConnectButton } from "./customConnectButton";
export function Header() {
  return (
    <div className=" grid grid-cols-5 items-center justify-between px-[14px] py-[24px] text-white">
      <Link href={"/"} className="flex items-center gap-x-2">
        {/* <Image src={logo} alt="Sir-Trading Logo" className="h-[60px] w-auto" /> */}
        <div className="flex gap-x-1">
          <Image
            height={40}
            width={40}
            src={hat as StaticImageData}
            alt="Sir Icon"
          />
          <h1 className="sir-shadow font-lora text-[32px] font-bold text-white drop-shadow-md">
            SIR.TRADING
          </h1>
        </div>
      </Link>
      <div className="col-span-3 flex justify-center">
        <nav className="hidden lg:block">
          <ul className="nav-shadow flex gap-x-[16px] rounded-md bg-secondary px-[12px] py-[12px] font-semibold text-muted-foreground">
            <div className="flex gap-x-[16px]   rounded-md">
              <NavItem url={"/"}>Leverage</NavItem>
              <NavItem url={"/liquidity"}>Liquidity</NavItem>
              <NavItem url={"/portfolio"}>Portfolio</NavItem>
            </div>
            <NavItem url={"/stake"}>Stake</NavItem>
            <NavItem url={"/create-vault"}>Create Vault</NavItem>
          </ul>
        </nav>
      </div>
      <div className="flex items-center justify-end gap-x-2">
        <CustomConnectButton />
        <SideNav />
      </div>
    </div>
  );
}
