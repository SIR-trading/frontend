"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Container } from "../ui/container";
import { Card } from "../ui/card";

import MintForm from "./mintForm/mintForm";
import VaultTable from "./vaultTable";

import BurnTable from "./burnTable/burnTable";
import MintFormProvider from "../providers/mintFormProvider";

export default function LeverageTabs() {
  return (
    <Tabs defaultValue="mint">
      <div className="flex justify-center">
        <TabsList defaultValue={"mint"}>
          <TabsTrigger value={"mint"}>Mint</TabsTrigger>
          <TabsTrigger value={"burn"}>Burn</TabsTrigger>
        </TabsList>
      </div>
      <br />
      <TabsContent value="mint">
        <Container>
          <div className="grid w-full gap-x-[16px] gap-y-4 lg:grid-cols-2">
            <MintFormProvider>
              <MintForm />
              <Card>
                <VaultTable />
              </Card>
            </MintFormProvider>
          </div>
        </Container>
      </TabsContent>
      {/*  */}
      <TabsContent value="burn">
        <Container>
          <Card>
            <BurnTable />
          </Card>
        </Container>
      </TabsContent>
    </Tabs>
  );
}
