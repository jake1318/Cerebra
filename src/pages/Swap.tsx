import React, { useEffect, useState } from "react";
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { getRoute, swapPTB } from "navi-aggregator-sdk";

// Map token selections to full coin types for mainnet
const COIN_TYPE_MAP: Record<string, string> = {
  SUI: "0x2::sui::SUI",
  USDC: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
  // add other tokens if needed
};

const Swap: React.FC = () => {
  // Local state for input fields and feedback
  const [fromToken, setFromToken] = useState<string>("SUI"); // default token selection
  const [toToken, setToToken] = useState<string>("USDC"); // default to USDC
  const [amount, setAmount] = useState<string>(""); // amount to swap (in smallest unit)
  const [slippage, setSlippage] = useState<number>(0.5); // slippage tolerance in %
  const [txStatus, setTxStatus] = useState<string>("");
  const [quoteOut, setQuoteOut] = useState<bigint | null>(null);

  // dApp Kit hooks for wallet and transaction signing
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction, isLoading } =
    useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  // Fetch a swap quote when inputs change
  useEffect(() => {
    const fetchQuote = async () => {
      if (!COIN_TYPE_MAP[fromToken] || !COIN_TYPE_MAP[toToken] || !amount) {
        setQuoteOut(null);
        return;
      }
      try {
        const amountBig = BigInt(amount);
        const quote = await getRoute(
          COIN_TYPE_MAP[fromToken],
          COIN_TYPE_MAP[toToken],
          amountBig
        );
        const expectedOut = BigInt(quote.amount_out);
        setQuoteOut(expectedOut);
      } catch (err) {
        console.error("Error fetching quote:", err);
        setQuoteOut(null);
      }
    };
    fetchQuote();
  }, [fromToken, toToken, amount]);

  // Helper: fetch a coin object from the wallet for a given token type and required amount
  const fetchCoinObject = async (
    owner: string,
    coinType: string,
    amountIn: bigint
  ): Promise<string> => {
    const coinsResponse = await suiClient.getCoins({ owner, coinType });
    const coins = coinsResponse.data;
    if (!coins || coins.length === 0) {
      throw new Error(`No coins found of type ${coinType}`);
    }
    // Select the first coin with sufficient balance
    const coin = coins.find((c) => BigInt(c.balance) >= amountIn);
    if (!coin) {
      throw new Error("Insufficient coin balance for swap");
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
      const quote = await getRoute(
        COIN_TYPE_MAP[fromToken],
        COIN_TYPE_MAP[toToken],
        amountIn
      );
      const expectedOut = BigInt(quote.amount_out);
      const slippageTolerance = slippage / 100;
      const minOut =
        expectedOut -
        (expectedOut * BigInt(Math.floor(slippageTolerance * 100))) /
          BigInt(100);

      // Build the transaction using Sui SDK's Transaction class
      const tx = new Transaction();

      // Fetch a valid coin object from the wallet for the 'from' token
      const coinObjectId = await fetchCoinObject(
        userAddress,
        COIN_TYPE_MAP[fromToken],
        amountIn
      );
      const coinInput = tx.object(coinObjectId);

      // Use the NAVI SDK function to add swap instructions to the transaction.
      await swapPTB(
        userAddress, // user's wallet address
        tx, // transaction to populate
        COIN_TYPE_MAP[fromToken], // source coin type
        COIN_TYPE_MAP[toToken], // target coin type
        coinInput, // real coin object from wallet
        amountIn,
        Number(minOut)
      );
      // (After swapPTB, tx now contains the instructions for performing the swap.)

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
      {/* Wallet connection status */}
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
            {/* Add other tokens as needed */}
          </select>
        </div>
        <div>
          <label className="block">To Token:</label>
          <select
            value={toToken}
            onChange={(e) => setToCoinType(e.target.value)}
            className="border p-2 w-full"
          >
            <option value="USDC">USDC</option>
            <option value="SUI">SUI</option>
            {/* Add other tokens as needed */}
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
      {quoteOut !== null && (
        <p className="mt-2">
          Expected Output: ~{quoteOut.toString()} (before slippage)
        </p>
      )}
      <button
        onClick={handleSwap}
        disabled={
          !currentAccount || isLoading || !amount || !fromToken || !toToken
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
