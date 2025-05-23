import MintFormProvider from "@/components/providers/mintFormProvider";
import Pagination from "@/components/shared/pagination";
import { Card } from "@/components/ui/card";
import type { TVaults } from "@/lib/types";
import { EPage } from "@/lib/types";
import { Container } from "@/components/ui/container";
import VaultTable from "./vaultTable/vaultTable";
import MintForm from "./mintForm/mintForm";
import Explainer from "../shared/explainer";

export default function LeverageLiquidityContent({
  vaultsQuery,
  isApe,
}: {
  vaultsQuery: TVaults;
  form: React.ReactNode;
  isApe: boolean;
}) {
  return (
    <Container>
      <Explainer page={isApe ? EPage.LEVERAGE : EPage.LIQUIDITY} />
      <div className="grid w-full gap-x-[16px] gap-y-4 xl:grid-cols-2">
        <MintFormProvider>
          <MintForm vaultsQuery={vaultsQuery} isApe={isApe} />
          <Card>
            <div className="flex h-full flex-col justify-between">
              <VaultTable isApe={isApe} />
              <Pagination
                max={Math.ceil((vaultsQuery?.vaults.length ?? 0) / 8)}
              />
            </div>
          </Card>
        </MintFormProvider>
      </div>
    </Container>
  );
}
