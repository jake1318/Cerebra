import React, { useEffect, useState } from "react";
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

const Swap: React.FC = () => {
  // Local state for input fields and feedback
  const [fromToken, setFromToken] = useState<string>("SUI");
  const [toToken, setToToken] = useState<string>("USDC");
  const [amount, setAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<number>(0.5);
  const [quoteOut, setQuoteOut] = useState<string>("");
  const [txStatus, setTxStatus] = useState<string>("");

  // dApp Kit hooks
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction, isLoading } =
    useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  // Mapping token symbol to coin type
  const COIN_TYPE_MAP: Record<string, string> = {
    SUI: "0x2::sui::SUI",
    USDC: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
  };

  // Fetch swap quote from the backend API
  useEffect(() => {
    const fetchQuote = async () => {
      if (!amount) {
        setQuoteOut("");
        return;
      }
      try {
        const response = await fetch(
          `/api/quote?from=${encodeURIComponent(
            COIN_TYPE_MAP[fromToken]
          )}&to=${encodeURIComponent(COIN_TYPE_MAP[toToken])}&amount=${amount}`
        );
        const data = await response.json();
        if (data.error) {
          setQuoteOut("Error fetching quote");
        } else {
          // Assuming the API returns quote.amount_out as a string/number
          setQuoteOut(data.data.amount_out.toString());
        }
      } catch (err) {
        console.error("Error fetching quote:", err);
        setQuoteOut("Error");
      }
    };
    fetchQuote();
  }, [fromToken, toToken, amount]);

  // Handle swap action: the frontend should still sign and execute the transaction.
  // For this example, we assume the backend is used only for retrieving quotes and prebuilding transaction data.
  const handleSwap = async () => {
    if (!currentAccount) {
      alert("Please connect your wallet.");
      return;
    }
    if (!amount) {
      alert("Please enter an amount.");
      return;
    }
    setTxStatus("Preparing swap...");
    try {
      const response = await fetch("/api/swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: COIN_TYPE_MAP[fromToken],
          to: COIN_TYPE_MAP[toToken],
          amount,
          // Calculate minimum acceptable output based on slippage.
          minOut: Math.floor(Number(quoteOut) * (1 - slippage / 100)),
        }),
      });
      const swapData = await response.json();
      if (swapData.error) {
        setTxStatus(`Swap failed: ${swapData.error}`);
      } else {
        // Here, swapData contains the transaction details (unsigned).
        // Let the Sui wallet sign and execute the transaction.
        const tx = new Transaction();
        // You would normally add the instructions from swapData into the tx.
        // For this example, assume swapData.data is the transaction block data.
        // The frontend then calls signAndExecuteTransaction.
        setTxStatus("Signing and executing transaction...");
        signAndExecuteTransaction(
          { transaction: tx, chain: "sui:mainnet" },
          {
            onSuccess: (result) => {
              console.log("Swap executed successfully:", result);
              setTxStatus(
                `✅ Swap complete! Transaction digest: ${result.digest}`
              );
            },
            onError: (error: any) => {
              console.error("Transaction error:", error);
              setTxStatus(`❌ Swap failed: ${error.message || error}`);
            },
          }
        );
      }
    } catch (err: any) {
      console.error("Swap error:", err);
      setTxStatus(`❌ Error: ${err.message || err.toString()}`);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Token Swap</h2>
      {currentAccount ? (
        <p>Connected as: {currentAccount.address}</p>
      ) : (
        <p>Please connect your Sui wallet using the button below.</p>
      )}
      <ConnectButton />
      <div className="mt-4 space-y-4">
        <div>
          <label className="block">From Token:</label>
          <select
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
            className="border p-2 w-full"
          >
            <option value="SUI">SUI</option>
            <option value="USDC">USDC</option>
          </select>
        </div>
        <div>
          <label className="block">To Token:</label>
          <select
            value={toToken}
            onChange={(e) => setToToken(e.target.value)}
            className="border p-2 w-full"
          >
            <option value="USDC">USDC</option>
            <option value="SUI">SUI</option>
          </select>
        </div>
        <div>
          <label className="block">Amount (in smallest unit):</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block">Slippage Tolerance (%):</label>
          <input
            type="number"
            step="0.1"
            value={slippage}
            onChange={(e) => setSlippage(parseFloat(e.target.value))}
            className="border p-2 w-full"
          />
        </div>
      </div>
      {quoteOut && (
        <p className="mt-2">Expected Output: ~{quoteOut} (before slippage)</p>
      )}
      <button
        onClick={handleSwap}
        disabled={!currentAccount || isLoading || !amount}
        className="bg-blue-600 text-white px-4 py-2 mt-4 rounded hover:bg-blue-700"
      >
        {isLoading ? "Swapping..." : "Swap"}
      </button>
      {txStatus && (
        <div className="mt-4">
          <p>{txStatus}</p>
        </div>
      )}
    </div>
  );
};

export default Swap;
