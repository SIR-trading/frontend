"use client";
import "@rainbow-me/rainbowkit/styles.css";
import {
  darkTheme,
  RainbowKitProvider,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import {
  phantomWallet,
  metaMaskWallet,
  coinbaseWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, WagmiProvider, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { env } from "@/env";
import { CHAIN_CONFIGS } from "@/lib/chains";

const getChainId = () => {
  const result = env.NEXT_PUBLIC_CHAIN_ID;
  return parseInt(result);
};
const chainId = getChainId();

const chain = {
  ...(chainId == mainnet.id ? mainnet : sepolia),
  id: chainId,
  name: CHAIN_CONFIGS[chainId]?.name ?? "Unknown Chain",
};

const projectId =
  process.env.NEXT_PUBLIC_PROJECT_ID ?? "934acc697f01fec33b75c19d9bb2e3c7";

// Configure wallets with Phantom included
const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular",
      wallets: [
        metaMaskWallet,
        phantomWallet,
        coinbaseWallet,
        rainbowWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: "SIR",
    projectId,
  },
);

export const wagmiConfig = createConfig({
  chains: [chain],
  connectors,
  transports: {
    [chain.id]: http("/api/rpc"),
  },
  ssr: true,
});

function EvmProvider({ children }: { children: React.ReactNode }) {
  // const initialState = cookieToInitialState(wagmiConfig, cookie);
  //initialState={initialState}
  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider modalSize="compact" theme={darkTheme({})}>
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}

export default EvmProvider;
