import PageHeader from "../shared/pageHeader";
import { Card } from "../ui/card";
import CreateVaultForm from "./createVaultForm";

export default function CreateVaultPage() {
  return (
    <div>
      {/* <PageHeader> Create Vault</PageHeader> */}
      <div className="flex w-[600px] flex-col items-center">
        <br />
        <Card className="md:w-[600px]">
          <CreateVaultForm />
        </Card>
      </div>
    </div>
  );
}
