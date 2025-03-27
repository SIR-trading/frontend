import StakeData from "@/components/stake/stakeData/stakeData";
import Explainer from "../shared/explainer";
import { EPage } from "@/lib/types";
import { Container } from "../ui/container";
import PageHeadingSpace from "../shared/pageHeadingSpace";
import StakeTabs from "./stakeTabs";
import AprCard from "./stakeData/aprCard";
import { PriceProvider } from "../providers/priceProvider";

import { EContracts, getAddress } from "@/lib/contractAddresses";
const stakePage = () => {
  const sirTokenAddress = getAddress(EContracts.SIR);
  console.log("sirTokenAddress ".repeat(100), sirTokenAddress);
  return (
    <div className="">
      <PageHeadingSpace />
      <Container className="max-w-[600px]  md:w-[600px]">
        <Explainer page={EPage.STAKE} />
        <PriceProvider tokens={[sirTokenAddress]}>
          <StakeData>
            <AprCard />
          </StakeData>
          <StakeTabs />
        </PriceProvider>
      </Container>

    </div>
  );
};

export default stakePage;
