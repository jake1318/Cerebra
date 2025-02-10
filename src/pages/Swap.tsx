// src/pages/Swap.tsx
import React, { useEffect, useState } from "react";
import { fetchTokenList, CoinInfo } from "../utils/tokenApi";

const Swap: React.FC = () => {
  // Component state for token list and form inputs
  const [tokens, setTokens] = useState<CoinInfo[]>([]);
  const [fromToken, setFromToken] = useState<string>("");
  const [toToken, setToToken] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<number>(0.5); // default 0.5%
  const [swapResult, setSwapResult] = useState<{
    status: string;
    txId?: string;
  } | null>(null);

  // Fetch token list on component mount
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const list = await fetchTokenList();
        setTokens(list);
      } catch (error) {
        console.error("Error loading token list:", error);
      }
    };
    loadTokens();
  }, []);

  // Handle form changes
  const handleFromTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFromToken(e.target.value);
    // Optionally reset result on new selection
    setSwapResult(null);
  };
  const handleToTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setToToken(e.target.value);
    setSwapResult(null);
  };

  const handleSwap = async () => {
    setSwapResult(null);
    if (!fromToken || !toToken || !amount) {
      alert("Please select tokens and enter an amount");
      return;
    }
    if (fromToken === toToken) {
      alert("Please select two different tokens");
      return;
    }
    // In a real app, here we would call the NAVI SDK to perform the swap:
    // e.g., result = await swap(address, client, fromToken, toToken, amount, minAmountOut)&#8203;:contentReference[oaicite:13]{index=13}
    // where minAmountOut is calculated based on slippage tolerance.
    // Then use the wallet to sign and execute the transaction.
    // For demo, we'll simulate a successful swap after a short delay.
    try {
      console.log("Executing swap transaction...");
      // Simulate network call and wallet transaction
      await new Promise((res) => setTimeout(res, 1000));
      // Simulate a transaction ID (in Sui, a digest)
      const fakeTxId = "0xFAKE_TX_HASH_123";
      setSwapResult({ status: "success", txId: fakeTxId });
      console.log("Swap successful, tx id:", fakeTxId);
    } catch (err) {
      setSwapResult({ status: "error" });
      console.error("Swap failed:", err);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Token Swap</h2>
      {/* Token selection form */}
      <div>
        <label>
          From:{" "}
          <select value={fromToken} onChange={handleFromTokenChange}>
            <option value="">Select token</option>
            {tokens.map((token) => (
              <option key={token.coin_type} value={token.coin_type}>
                {token.symbol}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <label>
          To:{" "}
          <select value={toToken} onChange={handleToTokenChange}>
            <option value="">Select token</option>
            {tokens.map((token) => (
              <option key={token.coin_type} value={token.coin_type}>
                {token.symbol}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <label>
          Amount:{" "}
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setSwapResult(null);
            }}
            placeholder="0.0"
          />
        </label>
      </div>
      <div>
        <label>
          Slippage Tolerance (%):{" "}
          <input
            type="number"
            step="0.1"
            min="0"
            value={slippage}
            onChange={(e) => setSlippage(Number(e.target.value))}
          />
        </label>
      </div>
      <button onClick={handleSwap} disabled={!fromToken || !toToken || !amount}>
        Swap
      </button>

      {/* Display swap result/confirmation */}
      {swapResult && swapResult.status === "success" && (
        <div style={{ marginTop: "1rem", color: "green" }}>
          ✅ Swap successful!
          <div>
            Transaction ID: <code>{swapResult.txId}</code>
          </div>
          {/* In a real app, link to explorer or more details could be provided */}
        </div>
      )}
      {swapResult && swapResult.status === "error" && (
        <div style={{ marginTop: "1rem", color: "red" }}>
          ❌ Swap failed. Please try again.
        </div>
      )}
    </div>
  );
};

export default Swap;
