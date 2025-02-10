// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  SuiClientProvider,
  WalletProvider,
  createNetworkConfig,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { store } from "./redux/store";
import App from "./App";
import "@mysten/dapp-kit/dist/index.css"; // **New:** import dApp Kit styles
import "./index.css";

// Configure networks for SuiClientProvider (using Mysten utility for best practice)
const { networkConfig } = createNetworkConfig({
  mainnet: { url: getFullnodeUrl("mainnet") },
  testnet: { url: getFullnodeUrl("testnet") },
  // You can add "localnet" or other networks here if needed
});
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {/* Provide Sui RPC client and wallet context to the app */}+{" "}
        <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
          +{" "}
          <WalletProvider autoConnect={true}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
