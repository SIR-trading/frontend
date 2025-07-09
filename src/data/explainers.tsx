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
        </p>
        <p>
          As an LPer, if the &lsquo;long&rsquo; token climbs you lose value when measured in that token but gain when measured in the &lsquo;versus&rsquo; token;
          and if the &lsquo;long&rsquo; token falls, the effect reverses. This balance makes TEA a good fit when you are undecided about going long or short.
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
        </p>
        <p>
          You can also stake or unstake SIR here to collect your ETH dividends.
        </p>
      </>
    ),
  },
  [EPage.STAKE]: {
    title: "Stake SIR, earn ETH",
    description: (
      <>
        <p>
          Stake SIR to receive a share of all protocol fees, which are automatically converted to ETH before distribution.
          Your dividends can be claimed at any moment.
        </p>
        <p>
          Upon staking, your SIR is locked but unlocks continuously, with &frac12; of the balance becoming withdrawable every 30 days.
        </p>
      </>
    ),
  },
  [EPage.CREATE_VAULT]: {
    title: "Create a new vault",
    description: (
      <>
        <p>
          Select the &lsquo;long&rsquo; token, &lsquo;versus&rsquo; token, and leverage.
        </p>
        <p>
          Lower exponents need little liquidity,
          while higher exponents cost more to mint APE and work best when liquidity is plentiful.
        </p>
      </>
    ),
  },
  [EPage.CALCULATOR]: {
    title: "Gain calculator",
    description: (
      <>
        <p>
          Choose the &lsquo;long&rsquo; and &lsquo;versus&rsquo; tokens, pick a leverage, then enter your deposit, entry price, and target exit price.
        </p>
        <p>
          The calculator shows what your APE position would return after mint and fee, so you can size trades before committing real funds.
        </p>
      </>
    ),
  },
  [EPage.AUCTIONS]: {
    title: "Bid on tokens below market price",
    description: (
      <>
        <p>
          Here the protocol’s surplus tokens are swapped for ETH.
          Anyone can start a new auction, place a bid, or out-bid the current leader.
        </p>
        <p>
          When the timer closes, the highest bidder receives the tokens and the ETH moves to the dividend pool for SIR stakers.
        </p>
      </>
    ),
  },
};
