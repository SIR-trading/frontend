import LeverageLiquidityContent from "@/components/leverage-liquidity/leverageLiquidityContent";
import LeverageLiquidityPage from "@/components/leverage-liquidity/leverageLiquidityPage";

export default async function Home({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const offset = isFinite(parseInt(slug)) ? parseInt(slug) : 0;

  return (
    <main className="flex  flex-col items-center justify-center ">
      <LeverageLiquidityPage title={"Leverage with finesse"}>
        <LeverageLiquidityContent isApe offset={offset} />
      </LeverageLiquidityPage>
    </main>
  );
}
