import LeverageLiquidityContent from "@/components/leverage-liquidity/leverageLiquidityContent";
import LeverageLiquidityPage from "@/components/leverage-liquidity/leverageLiquidityPage";
import MintForm from "@/components/leverage-liquidity/mintForm/mintForm";
import { getVaultsForTable } from "@/lib/getVaults";

// import { unstable_cache } from "next/cache";
export const revalidate = 10;
export default async function Home({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const offset = isFinite(parseInt(slug)) ? parseInt(slug) : 0;
  const { vaultQuery } = await getVaultsForTable(offset);

  return (
    <main className="flex  flex-col items-center justify-center ">
      <LeverageLiquidityPage title={"Take on Leverage"}>
        <LeverageLiquidityContent
          isApe
          form={<MintForm isApe vaultsQuery={vaultQuery} />}
          vaultsQuery={vaultQuery}
        ></LeverageLiquidityContent>
      </LeverageLiquidityPage>
    </main>
  );
}
