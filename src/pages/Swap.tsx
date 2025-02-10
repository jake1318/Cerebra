// src/pages/Swap.tsx
import React, { useEffect, useState } from "react";
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { getRoute, swapPTB } from "navi-aggregator-sdk";

const Swap: React.FC = () => {
  // Local state for input fields and feedback
  const [fromCoinType, setFromCoinType] = useState<string>("0x2::sui::SUI"); // default SUI type
  const [toCoinType, setToCoinType] = useState<string>(
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC"
  ); // USDC mainnet type
  const [amount, setAmount] = useState<string>(""); // amount to swap (in smallest unit)
  const [slippage, setSlippage] = useState<number>(0.5); // slippage tolerance in %
  const [txStatus, setTxStatus] = useState<string>("");
  const [quoteOut, setQuoteOut] = useState<bigint | null>(null);

  // dApp Kit hooks for wallet and transaction signing
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction, isLoading } =
    useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  // Fetch a swap quote when inputs change (if all required fields are set)
  useEffect(() => {
    const fetchQuote = async () => {
      if (!fromCoinType || !toCoinType || !amount) {
        setQuoteOut(null);
        return;
      }
      try {
        // Convert amount to BigInt (assumes input is an integer string in smallest unit)
        const amountBig = BigInt(amount);
        const quote = await getRoute(fromCoinType, toCoinType, amountBig);
        const expectedOut = BigInt(quote.amount_out);
        setQuoteOut(expectedOut);
      } catch (err) {
        console.error("Error fetching quote:", err);
        setQuoteOut(null);
      }
    };
    fetchQuote();
  }, [fromCoinType, toCoinType, amount]);

  // Helper: Fetch a coin object of the given type from the connected wallet
  const fetchCoinObject = async (
    owner: string,
    coinType: string,
    amountIn: bigint
  ) => {
    // Query the Sui network for coins of the given type owned by the wallet
    const coinsResponse = await suiClient.getCoins({ owner, coinType });
    const coins = coinsResponse.data;
    if (!coins || coins.length === 0) {
      throw new Error(`No coins found of type ${coinType}`);
    }
    // Select the first coin with sufficient balance
    const coin = coins.find((c) => BigInt(c.balance) >= amountIn);
    if (!coin) {
      throw new Error("Insufficient coin balance for the swap");
    }
    return coin.coinObjectId;
  };

  // Handle swap action
  const handleSwap = async () => {
    if (!currentAccount) {
      alert("Please connect a wallet first.");
      return;
    }
    if (!amount || BigInt(amount) === BigInt(0)) {
      alert("Please enter a valid amount.");
      return;
    }
    setTxStatus("Preparing transaction...");
    try {
      const userAddress = currentAccount.address;
      const amountIn = BigInt(amount);

      // Get a quote to compute minimum acceptable output based on slippage tolerance.
      const quote = await getRoute(fromCoinType, toCoinType, amountIn);
      const expectedOut = BigInt(quote.amount_out);
      const slippageTolerance = slippage / 100; // e.g., 0.5% becomes 0.005
      const minOut =
        expectedOut -
        (expectedOut * BigInt(Math.floor(slippageTolerance * 100))) /
          BigInt(100);

      // Build the transaction using Sui SDK's Transaction class
      const tx = new Transaction();

      // --- Coin selection logic ---
      // Instead of a placeholder, fetch the actual coin object for fromCoinType from the wallet.
      const coinObjectId = await fetchCoinObject(
        userAddress,
        fromCoinType,
        amountIn
      );
      // Use the fetched coin object in the transaction
      const coinInput = tx.object(coinObjectId);

      // Call the NAVI SDK function to add swap instructions to the transaction.
      // (swapPTB appends the necessary Move call instructions to tx.)
      await swapPTB(
        userAddress, // user's wallet address
        tx, // transaction block to populate
        fromCoinType,
        toCoinType,
        coinInput, // now using the actual coin object from the wallet
        amountIn,
        Number(minOut)
      );
      // (After swapPTB, tx now contains instructions for performing the swap.)

      // Execute the transaction via the wallet – using the updated hook from dApp Kit.
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
    } catch (err: any) {
      console.error("Swap error:", err);
      setTxStatus(`❌ Error: ${err.message || err.toString()}`);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Token Swap</h2>
      {/* Display wallet connection status */}
      {currentAccount ? (
        <p>Connected as: {currentAccount.address}</p>
      ) : (
        <p>Please connect your Sui wallet using the button below.</p>
      )}
      <ConnectButton />

      <div className="mt-4">
        <label className="block mb-2">
          From Token:
          <input
            type="text"
            value={fromCoinType}
            onChange={(e) => setFromCoinType(e.target.value)}
            placeholder="e.g., 0x2::sui::SUI"
            className="border p-2 w-full mt-1"
          />
        </label>
        <label className="block mb-2">
          To Token:
          <input
            type="text"
            value={toCoinType}
            onChange={(e) => setToCoinType(e.target.value)}
            placeholder="e.g., USDC mainnet type"
            className="border p-2 w-full mt-1"
          />
        </label>
        <label className="block mb-2">
          Amount (in smallest unit):
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="border p-2 w-full mt-1"
          />
        </label>
        <label className="block mb-2">
          Slippage Tolerance (%):
          <input
            type="number"
            step="0.1"
            value={slippage}
            onChange={(e) => setSlippage(parseFloat(e.target.value))}
            className="border p-2 w-full mt-1"
          />
        </label>
      </div>
      {quoteOut !== null && (
        <p className="mt-2">
          Expected Output: ~{quoteOut.toString()} (before slippage)
        </p>
      )}
      <button
        onClick={handleSwap}
        disabled={
          !currentAccount ||
          isLoading ||
          !amount ||
          !fromCoinType ||
          !toCoinType
        }
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
