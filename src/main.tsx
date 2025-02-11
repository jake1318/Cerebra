import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { Provider } from "react-redux"; // ✅ Import Redux Provider
import { BrowserRouter } from "react-router-dom"; // ✅ Import BrowserRouter
import store from "./redux/store"; // ✅ Import the Redux store
import App from "./App";

// Initialize React Query client
const queryClient = new QueryClient();

// Define Sui network configurations (e.g., mainnet)
const { networkConfig } = createNetworkConfig({
  mainnet: { url: getFullnodeUrl("mainnet") },
  // ... (other networks can be added if needed)
});
const defaultNetwork = import.meta.env.VITE_NETWORK || "mainnet";

// Render the app with all providers
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {/* Provide React Query context */}
    <QueryClientProvider client={queryClient}>
      {/* Provide Sui client context */}
      <SuiClientProvider
        networks={networkConfig}
        defaultNetwork={defaultNetwork}
      >
        {/* Provide Sui wallet context */}
        <WalletProvider>
          {/* Provide Redux store context */}
          <Provider store={store}>
            {/* Provide React Router context */}
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </Provider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
