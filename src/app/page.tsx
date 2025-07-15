import LeverageLiquidityContent from "@/components/leverage-liquidity/leverageLiquidityContent";
import LeverageLiquidityPage from "@/components/leverage-liquidity/leverageLiquidityPage";

export const revalidate = 0;
export default async function Home() {
  return (
    <main className="flex  flex-col items-center justify-center">
      <LeverageLiquidityPage title={"Leverage with finesse"}>
        <LeverageLiquidityContent isApe />
      </LeverageLiquidityPage>
    </main>
  );
}
