"use client";

import StakedSupplyCard from "./stakedSupplyCard";
import AprCard from "./aprCard";
import PriceCard from "./priceCard";
import MarketCapCard from "./marketCapCard";

const StakeData = () => {
  return (
    <div className="mx-auto grid gap-4 font-normal sm:grid-cols-2 lg:grid-cols-4">
      <StakedSupplyCard />
      <AprCard />
      <PriceCard />
      <MarketCapCard />
    </div>
  );
};

export default StakeData;
