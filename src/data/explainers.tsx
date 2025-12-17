"use client";
import { EPage } from "@/lib/types";
import type { ExplainersMap } from "@/lib/types";
import { getNativeCurrencySymbol } from "@/lib/chains";
import { getSirSymbol } from "@/lib/assets";
import { calculateTeaVaultFee } from "@/lib/utils/calculations";
import buildData from "@/../public/build-data.json";

const LP_FEE = buildData.systemParams.lpFee;
const teaFeePercent = (calculateTeaVaultFee(LP_FEE) * 100).toPrecision(2);

export const Explainers: Partial<ExplainersMap> = {
  [EPage.LEVERAGE]: {
    title: <>Leverage with finesse</>,
    description: (
      <>
        <p>
          APE tokens provide{" "}
          <a
            href="https://x.com/leveragesir/status/1903585913189421304"
            className="underline"
            target="_blank"
          >
            constant leverage
          </a>{" "}
          with option-style pricing: no liquidations, no ongoing fees. Pay once
          at mint, then hold as long as you want.
        </p>
        <p>
          Gains are convex up to a threshold price set by vault liquidity;
          beyond that, they grow linearly.
        </p>
      </>
    ),
  },
  [EPage.LIQUIDITY]: {
    title: "Provide liquidity, earn from traders",
    description: (
      <>
        <p>
          Mint TEA tokens to provide liquidity. You pay a one-time{" "}
          {teaFeePercent}% minting fee and earn from APE trader fees. Selected
          vaults also reward{" "}
          <a
            href="https://docs.sir.trading/protocol-overview/sir-a-dividend-paying-token"
            className="underline"
            target="_blank"
          >
            {getSirSymbol()} tokens
          </a>
          .
        </p>
        <p>
          Ideal for those neutral on price direction. As price moves, your
          equity shifts between tokens: gaining in one, losing in the other.
          LPing is about earning yield, not making directional bets.
        </p>
      </>
    ),
  },
  [EPage.PORTFOLIO]: {
    title: "Manage your assets",
    description: (
      <>
        <p>
          View and manage all positions: close APE trades, withdraw TEA
          liquidity, and claim {getSirSymbol()} rewards earned from providing
          liquidity.
        </p>
      </>
    ),
  },
  [EPage.STAKE]: {
    title: (
      <>
        Stake {getSirSymbol()}, earn {getNativeCurrencySymbol()}
      </>
    ),
    description: (
      <>
        <p>
          Stake {getSirSymbol()} tokens to earn {getNativeCurrencySymbol()}{" "}
          dividends from protocol fees. Staked tokens unlock gradually, with
          half becoming withdrawable every 30 days.
        </p>
        <p className="mt-2">
          Additionally, you can stake Uniswap V3 LP positions in the{" "}
          {getSirSymbol()}/W{getNativeCurrencySymbol()} pool to earn{" "}
          {getSirSymbol()} rewards.
        </p>
      </>
    ),
  },
  [EPage.CREATE_VAULT]: {
    title: "Create a new vault",
    description: (
      <>
        <p>
          Choose token pairs and leverage level. Higher leverage requires more
          liquidity but offers greater potential returns for traders.
        </p>
      </>
    ),
  },
  [EPage.CALCULATOR]: {
    title: "Gain calculator",
    description: (
      <>
        <p>
          Calculate potential APE returns by entering token pairs, leverage,
          deposit amount, and price targets. Results include all fees.
        </p>
      </>
    ),
  },
  [EPage.AUCTIONS]: {
    title: "Bid on tokens below market price",
    description: (
      <>
        <p>
          Protocol fees are auctioned for {getNativeCurrencySymbol()} that goes
          to {getSirSymbol()} stakers. Auctions run for 24 hours with the
          highest bidder winning the tokens.
        </p>
      </>
    ),
  },
  [EPage.LEADERBOARD]: {
    title: "Trade APE, win SIR",
    description: (
      <>
        <p>
          Close APE positions to compete for 1M {getSirSymbol()} monthly prizes.
          Winners are determined by highest USD profit and best percentage gain.
        </p>
      </>
    ),
  },
};
