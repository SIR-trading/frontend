"use client";
import LeverageLiquidityContent from "@/components/leverage-liquidity/leverageLiquidityContent";
import LeverageLiquidityPage from "@/components/leverage-liquidity/leverageLiquidityPage";

export default function Home({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const offset = isFinite(parseInt(slug)) ? parseInt(slug) : 0;

  return (
    <main className="flex  flex-col items-center justify-center ">
      <LeverageLiquidityPage title={"Leverage with finesse"}>
        <LeverageLiquidityContent
          isApe
          offset={offset}
        />
      </LeverageLiquidityPage>
    </main>
  );
}
