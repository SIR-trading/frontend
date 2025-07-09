"use client";
import { EPage } from "@/lib/types";
import type  { ExplainersMap } from "@/lib/types";

export const Explainers: Partial<ExplainersMap> = {
  [EPage.LEVERAGE]: {
    title: <>Leverage with finesse</>,
    description: (
      <>
        <p>
          APE tokens lock in <a href="https://x.com/leveragesir/status/1903585913189421304" className="underline" target="_blank">perfect constant leverage</a>. No funding fees,
          no periodic rebalancing, no margin calls. You pay one fee at
          mint, and thereafter your position is free to hold.
        </p>
        <p>
          As long as the vault has sufficient liquidity, routine swings
          don&apos;t erode returns. Your leveraged gains can compound unhindered over time.
        </p>
      </>
    ),
  },
  [EPage.LIQUIDITY]: {
    title: "Provide liquidity, collect fees",
    description: (
      <>
        <p>
          Pay a one-time entry fee to mint TEA and join a vault. 
          As an LPer, if the Long token climbs you lose value when measured in that token but gain when measured in the Versus token;
          and if the Long token falls, the effect reverses. This balance makes TEA a good fit when you are undecided about going long or short.
        </p>
        <p>
          You collect the fees leverage traders pay whenever they mint or burn APE,
          and selected vaults add <a href="https://docs.sir.trading/protocol-overview/sir-a-dividend-paying-token" className="underline" target="_blank">SIR token</a> rewards on top.
          Burn TEA at any time to withdraw your funds.
        </p>
      </>
    ),
  },
  [EPage.PORTFOLIO]: {
    title: "Manage your assets",
    description: (
      <>
        <p>
          See all your positions in one place. Burn APE to close trades, burn TEA to withdraw liquidity, 
          and claim SIR rewards earned from liquidity vaults.
          You can also stake or unstake SIR here to collect your ETH dividends.
        </p>
      </>
    ),
  },
};
