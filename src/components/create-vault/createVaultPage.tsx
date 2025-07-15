"use client";
import { EPage } from "@/lib/types";
import Explainer from "../shared/explainer";
import { Card } from "../ui/card";
import CreateVaultForm from "./createVaultForm";
import { Container } from "../ui/container";
import PageHeadingSpace from "../shared/pageHeadingSpace";

export default function CreateVaultPage() {
  return (
    <div>
      {/* <PageHeader> Create Vault</PageHeader> */}
      <Container className="flex max-w-[650px] flex-col items-center md:w-[650px]">
        <PageHeadingSpace />
        <Explainer page={EPage.CREATE_VAULT} />
        <Card className="md:w-[650px]">
          <CreateVaultForm />
        </Card>
      </Container>
    </div>
  );
}
