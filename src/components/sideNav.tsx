"use client";
import { Menu } from "lucide-react";
import React, { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import NavItem from "./navItem";

export default function SideNav() {
  const [openModal, setOpen] = useState(false);
  return (
    <div className="flex items-center text-white md:hidden">
      <Sheet open={openModal} onOpenChange={setOpen}>
        <SheetTrigger>
          <Menu className="cursor-pointer" size={30} />
        </SheetTrigger>
        <SheetContent>
          <div className="flex justify-center">
            <nav className="space-y-4 text-center text-muted-foreground">
              <ul
                aria-label="Core Navigation"
                className="space-y-2 rounded-md bg-primary/40 py-2 text-lg"
              >
                <NavItem onClick={() => setOpen(false)} url={"/"}>
                  Leverage
                </NavItem>
                <NavItem onClick={() => setOpen(false)} url={"/liquidity"}>
                  Liquidity
                </NavItem>
                <NavItem onClick={() => setOpen(false)} url={"/portfolio"}>
                  Portfolio
                </NavItem>
              </ul>
              <ul
                aria-label="Secondary Navigation"
                className="space-y-2 py-2 text-lg"
              >
                <NavItem onClick={() => setOpen(false)} url={"/stake"}>
                  Stake
                </NavItem>
                <NavItem onClick={() => setOpen(false)} url={"/create-vault"}>
                  Create Vault
                </NavItem>
              </ul>
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
