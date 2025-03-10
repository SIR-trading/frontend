import AuctionPage from "@/components/auction/auctionPage";
import { getVaults } from "@/lib/getVaults";

export const revalidate = 10; // TODO: check if this works after starting Auction
const StakeHome = async () => {
  const {
    vaults: { vaults },
  } = await getVaults({});

  return (
    <main className="flex  flex-col items-center justify-center text-white">
      <AuctionPage vaults={vaults} />
    </main>
  );
};

export default StakeHome;
