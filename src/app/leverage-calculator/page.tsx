import LeverageCalculatorContent from "@/components/leverage-calculator/leverageCalculatorContent";
import LeverageCalculatorPage from "@/components/leverage-calculator/leverageCalculatorPage";

export default function LeverageCalculator() {
  return (
    <main className="flex  flex-col items-center justify-center ">
      <LeverageCalculatorPage title={"Leverage Calculator"}>
        <LeverageCalculatorContent isApe />
      </LeverageCalculatorPage>
    </main>
  );
}
