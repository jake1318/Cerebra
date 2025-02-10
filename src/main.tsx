import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import App from "./App";

// Create a QueryClient for react-query (if not already done)
const queryClient = new QueryClient();

// Define networks for SuiClientProvider – include mainnet (and others if needed)
const { networkConfig } = createNetworkConfig({
  // You can include other networks for testing or dev, but mainnet is our default target
  mainnet: { url: getFullnodeUrl("mainnet") },
  // optional: only if you intend to support testnet
  // localnet or devnet can be added here if needed for development
});

// Determine default network (from env or fallback to 'mainnet')
const defaultNetwork = import.meta.env.VITE_NETWORK || "mainnet";
// (Make sure VITE_NETWORK is one of the keys in networkConfig if you use it.
// For production, this should be 'mainnet'.)

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={networkConfig}
        defaultNetwork={defaultNetwork}
      >
        <WalletProvider>
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
