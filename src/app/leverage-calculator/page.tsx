import LeverageCalculatorContent from "@/components/leverage-calculator/leverageCalculatorContent";
import LeverageCalculatorPage from "@/components/leverage-calculator/leverageCalculatorPage";
import CalculatorFormProvider from "@/components/providers/calculatorFormProvider";

export default function LeverageCalculator() {
  return (
    <main className="flex  flex-col items-center justify-center ">
      <LeverageCalculatorPage title={"Leverage Calculator"}>
        <CalculatorFormProvider>
          <LeverageCalculatorContent isApe />
        </CalculatorFormProvider>
      </LeverageCalculatorPage>
    </main>
  );
}
