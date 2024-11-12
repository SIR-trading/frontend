import LeverageLiquidityContent from "@/components/leverage-liquidity/leverageLiquidityContent";
import LeverageLiquidityPage from "@/components/leverage-liquidity/leverageLiquidityPage";
import LeverageLiquiditySkeleton from "@/components/leverage-liquidity/leverageLiquiditySkeleton";
import MintForm from "@/components/leverage-liquidity/mintForm/mintForm";
import { getVaultData } from "@/lib/getVaults";
export const revalidate = 0;
export default async function Home() {
  const { vaultQuery } = await getVaultData(0);
  return (
    <main className="flex flex-col items-center justify-center text-white">
      <LeverageLiquidityPage title={"Take on Leverage"}>
        <LeverageLiquidityContent
          isApe
          form={<MintForm isApe vaultsQuery={vaultQuery} />}
          vaultsQuery={vaultQuery}
        ></LeverageLiquidityContent>
        {/* <LeverageLiquiditySkeleton></LeverageLiquiditySkeleton> */}
      </LeverageLiquidityPage>
    </main>
  );
}
