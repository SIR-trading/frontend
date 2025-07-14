"use client";
import LeverageLiquidityContent from "@/components/leverage-liquidity/leverageLiquidityContent";
import LeverageLiquidityPage from "@/components/leverage-liquidity/leverageLiquidityPage";

export default function Home() {
  return (
    <main className="flex  flex-col items-center justify-center ">
      <LeverageLiquidityPage title="Provide Liquidity">
        <LeverageLiquidityContent
          isApe={false}
          offset={0}
        />
      </LeverageLiquidityPage>
    </main>
  );
}
