import { EPage } from "@/lib/types";

export const Explainers = {
  [EPage.LEVERAGE]: {
    title: "Leverage with finesse",
    description:
      `APE tokens lock in perfect constant leverage. No funding fees, no periodic rebalancing, and no margin calls. You pay one fee at mint, and the position is free to hold thereafter.
As long as the vault maintains sufficient liquidity, routine price swings do not erode returns, letting your leveraged gains compound unhindered over time.`.trim(),
  },
  [EPage.LIQUIDITY]: {
    title: "Provide Liquidity",
    description:
      `Deposit assets into vaults to mint TEA, our liquidity token (requires a one-time fee to prevent system abuse), and earn fees from users taking on leverage. The protocol’s permanent liquidity mining program rewards LPers in eligible vaults with SIR tokens.
No lock-ups —withdraw anytime.`.trim(),
  },
  [EPage.PORTFOLIO]: {
    title: "All Assets in One Place",
    description:
      `Track and manage your APE (leveraged) and TEA (liquidity) tokens here. Burn tokens to close positions or exit liquidity provision.
Liquidity providers in eligible vaults can claim SIR tokens and stake them to earn ETH rewards.`.trim(),
  },
  [EPage.STAKE]: {
    title: "Stake Your SIR",
    description:
      `Stake SIR to earn a share of protocol fees (paid in ETH). Your rewards depend on trading volume and total SIR staked.
Your staked SIR unlocks gradually—half of your locked amount becomes available every 30 days.`.trim(),
  },
  [EPage.AUCTIONS]: {
    title: "Bid for Token Lots",
    description:
      `Help convert staker fees to ETH by bidding on token lots with WETH. Snap up underpriced tokens and profit from the difference. Auctions run daily, and a new auction for the same token can be started after a 1-week cooldown.`.trim(),
  },
  [EPage.CREATE_VAULT]: {
    title: "Create New Vaults",
    description: `Enter any two tokens with a uniswap pool ...`.trim(),
  },
  [EPage.LEADERBOARD]: {
    title: "Leaderboard",
    description:
      `See who’s winning in the SIR ecosystem. View top traders, liquidity providers, and stakers. Compare your performance against others and get inspired to improve your strategies.`.trim(),
  },
};
