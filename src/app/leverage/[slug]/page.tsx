import LeverageLiquidityContent from "@/components/leverage-liquidity/leverageLiquidityContent";
import LeverageLiquidityPage from "@/components/leverage-liquidity/leverageLiquidityPage";
import MintForm from "@/components/leverage-liquidity/mintForm/mintForm";

// import { unstable_cache } from "next/cache";
export const revalidate = 10;
export default async function Home() {
  return (
    <main className="flex  flex-col items-center justify-center text-white">
      <LeverageLiquidityPage title={"Take on Leverage"}>
        <LeverageLiquidityContent
          isApe
          form={<MintForm isApe />}
        ></LeverageLiquidityContent>
      </LeverageLiquidityPage>
    </main>
  );
}
