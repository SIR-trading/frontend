import LeverageLiquidityContent from "@/components/leverage-liquidity/leverageLiquidityContent";
import LeverageLiquidityPage from "@/components/leverage-liquidity/leverageLiquidityPage";
import MintForm from "@/components/leverage-liquidity/mintForm/mintForm";
import { getVaultData } from "@/lib/getVaults";

// import { unstable_cache } from "next/cache";
export const revalidate = 10;
export default async function Home({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const offset = isFinite(parseInt(slug)) ? parseInt(slug) : 0;
  const { vaultQuery } = await getVaultData(offset);

  return (
    <main className="flex  flex-col items-center justify-center text-white">
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
