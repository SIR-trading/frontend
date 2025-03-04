import LeverageCalculatorContent from "@/components/leverage-calculator/leverageCalculatorContent";
import LeverageCalculatorPage from "@/components/leverage-calculator/leverageCalculatorPage";
import CalculatorForm from "@/components/leverage-calculator/calculatorForm/calculatorForm";
import { getVaultsForTable } from "@/lib/getVaults";

// import { unstable_cache } from "next/cache";
export const revalidate = 10;
export default async function LeverageCalculator({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const offset = isFinite(parseInt(slug)) ? parseInt(slug) : 0;
  const { vaultQuery } = await getVaultsForTable(offset);

  return (
    <main className="flex  flex-col items-center justify-center text-white">
      <LeverageCalculatorPage title={"Leverage Calculator"}>
        <LeverageCalculatorContent
          isApe
          form={<CalculatorForm isApe vaultsQuery={vaultQuery} />}
          vaultsQuery={vaultQuery}
        ></LeverageCalculatorContent>
      </LeverageCalculatorPage>
    </main>
  );
}
