import Pagination from "@/components/shared/pagination";
import { Card } from "@/components/ui/card";
import type { TVaults } from "@/lib/types";
import { Container } from "@/components/ui/container";
import CalculatorForm from "./calculatorForm/calculatorForm";
import VaultTable from "../leverage-liquidity/vaultTable/vaultTable";

export default function LeverageCalculatorContent({
  vaultsQuery,
  isApe,
}: {
  vaultsQuery: TVaults;
  form: React.ReactNode;
  isApe: boolean;
}) {
  return (
    <Container>
      {/*<Explainer page={isApe ? EPage.LEVERAGE : EPage.LIQUIDITY} />*/}
      <div className="grid w-full gap-x-[16px] gap-y-4 xl:grid-cols-2">
        <CalculatorForm vaultsQuery={vaultsQuery} isApe={isApe} />
        <Card>
          <div className="flex h-full flex-col justify-between">
            <VaultTable isApe={isApe} />
            <Pagination
              max={Math.ceil((vaultsQuery?.vaults.length ?? 0) / 8)}
            />
          </div>
        </Card>
      </div>
    </Container>
  );
}
