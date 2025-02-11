import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import store from "./redux/store"; // Correctly import from the redux folder
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui.js/client";
import App from "./App";
import "@mysten/dapp-kit/dist/index.css"; // Import dApp Kit styles for wallet UI
import "./index.css"; // Global app styles

// Set up React Query client for data fetching (required by dApp Kit)
const queryClient = new QueryClient();

// Define Sui network endpoints (localnet, devnet, testnet, mainnet)
const networks = {
  localnet: { url: getFullnodeUrl("localnet") },
  devnet: { url: getFullnodeUrl("devnet") },
  testnet: { url: getFullnodeUrl("testnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
};

// Choose default network from env or fallback to testnet
const defaultNetwork = import.meta.env.VITE_NETWORK || "mainnet";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {/* Provide Redux store context to the entire app (fixes missing store issue) */}
    <Provider store={store}>
      {/* Provide React Query context (needed for dApp Kit) */}
      <QueryClientProvider client={queryClient}>
        {/* Provide Sui RPC client and network context */}
        <SuiClientProvider networks={networks} defaultNetwork={defaultNetwork}>
          {/* Provide wallet connection context to enable Sui wallet integration */}
          <WalletProvider>
            <App />
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
