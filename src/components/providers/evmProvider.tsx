"use client";

// Filter out noisy Wagmi connector logs
if (typeof window !== "undefined") {
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    const firstArg = args[0];
    if (typeof firstArg === "string" && firstArg.includes("[injected]")) {
      return;
    }
    originalLog.apply(console, args);
  };
}

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
import { type Chain } from "wagmi/chains";
import { env } from "@/env";
import { getChainConfig } from "@/config/chains";

const getChainId = () => {
  const result = env.NEXT_PUBLIC_CHAIN_ID;
  return parseInt(result);
};
const chainId = getChainId();
const chainConfig = getChainConfig(chainId);

// Create full chain definition with all metadata for wallet network addition
const chain: Chain = {
  id: chainId,
  name: chainConfig.name,
  nativeCurrency: chainConfig.nativeCurrency,
  rpcUrls: {
    default: {
      http: [env.NEXT_PUBLIC_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: chainConfig.blockExplorers.default.name,
      url: chainConfig.blockExplorers.default.url,
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 0,
    },
  },
  testnet: chainConfig.isTestnet,
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

// Wagmi configuration with dual RPC setup:
// - Chain definition uses NEXT_PUBLIC_RPC_URL (public RPC for wallet network addition)
// - Transport uses /api/rpc proxy (private RPC for app operations)
export const wagmiConfig = createConfig({
  chains: [chain],
  connectors,
  transports: {
    [chain.id]: http("/api/rpc"), // Routes to private RPC via next.config.mjs rewrite
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
