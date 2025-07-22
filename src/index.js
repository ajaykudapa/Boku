import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { WagmiConfig, http } from "wagmi";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defineChain } from "viem";
import "@rainbow-me/rainbowkit/styles.css";

// Define Push Testnet chain
const pushTestnet = defineChain({
  id: 42101,
  name: "Push Testnet",
  network: "push-testnet",
  nativeCurrency: {
    name: "PUSH",
    symbol: "PUSH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://evm.rpc-testnet-donut-node1.push.org"] },
  },
  blockExplorers: {
    default: { name: "Push Explorer", url: "https://explorer.testnet.push.org" },
  },
  testnet: true,
});

// Configure Wagmi with Push Testnet included
const wagmiConfig = getDefaultConfig({
  appName: "Tic-Tac-Toe Multiplayer",
  projectId: "4e85bcf28ff060976670598768795b20",
  chains: [sepolia, mainnet, pushTestnet],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
    [pushTestnet.id]: http("https://evm.rpc-testnet-donut-node1.push.org"),
  },
  ssr: false,
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={wagmiConfig.chains}>
          <App />
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  </React.StrictMode>
);
