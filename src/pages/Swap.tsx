import React, { useEffect, useState } from "react";
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client"; // (Optional: if you need to instantiate a client)
import { getRoute, swapPTB } from "navi-aggregator-sdk";

const Swap = () => {
  // State variables for form inputs
  const [fromCoinType, setFromCoinType] = useState<string>("0x2::sui::SUI"); // example default: SUI
  const [toCoinType, setToCoinType] = useState<string>(
    "0xdba34672e30cb0...900e7::usdc::USDC"
  ); // example: USDC on mainnet
  const [amount, setAmount] = useState<string>(""); // input amount (in whole coins, we’ll convert to smallest unit)
  const [slippage, setSlippage] = useState<number>(0.5); // slippage in %, default 0.5%
  const [txStatus, setTxStatus] = useState<string>(""); // transaction status/feedback

  // Wallet and Sui client hooks
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient(); // provides the SuiClient connected to the current network (mainnet)

  // Optional: state for quote output
  const [quoteOut, setQuoteOut] = useState<bigint | null>(null);

  // Effect: when amount or coin types change, fetch a new quote from NAVI
  useEffect(() => {
    const fetchQuote = async () => {
      if (!fromCoinType || !toCoinType || !amount) {
        setQuoteOut(null);
        return;
      }
      try {
        // Convert input amount to BigInt (assuming input is in smallest unit or whole number of coins)
        // If amount is a decimal string, parse accordingly. For simplicity, assume integer input here.
        const amountBig = BigInt(amount);
        const quote = await getRoute(fromCoinType, toCoinType, amountBig);
        const expectedOut = BigInt(quote.amount_out);
        setQuoteOut(expectedOut);
      } catch (err) {
        console.error("Failed to fetch quote:", err);
        setQuoteOut(null);
      }
    };
    fetchQuote();
  }, [fromCoinType, toCoinType, amount]);

  const handleSwap = async () => {
    if (!currentAccount) {
      alert("Please connect a wallet first.");
      return;
    }
    if (!amount || BigInt(amount) === BigInt(0)) {
      alert("Enter a valid amount to swap.");
      return;
    }
    setTxStatus("Preparing transaction...");
    try {
      const userAddress = currentAccount.address;
      const amountIn = BigInt(amount); // amount in smallest units of fromCoin
      // Fetch best quote to determine min acceptable output
      const quote = await getRoute(fromCoinType, toCoinType, amountIn);
      const expectedOut = BigInt(quote.amount_out);
      // Calculate minimum output based on slippage tolerance
      const slippageTolerance = slippage / 100; // e.g., 0.5% -> 0.005
      const minOut =
        expectedOut -
        (expectedOut * BigInt(Math.floor(slippageTolerance * 100))) /
          BigInt(100);

      // Build the transaction block for the swap
      const tx = new Transaction();
      // Fetch coins of the fromCoinType owned by the user
      const coinsResponse = await suiClient.getCoins({
        owner: userAddress,
        coinType: fromCoinType,
      });
      const coins = coinsResponse.data;
      if (!coins || coins.length === 0) {
        throw new Error("No source coins available for swap.");
      }
      // Select coins to cover the amountIn
      let primaryCoin = tx.object(coins[0].coinObjectId); // add first coin object as input
      let primaryBalance = BigInt(coins[0].balance);
      // If first coin is not enough, merge additional coins
      for (let i = 1; primaryBalance < amountIn && i < coins.length; i++) {
        const coinObj = coins[i];
        tx.mergeCoins(primaryCoin, [tx.object(coinObj.coinObjectId)]); // merge coin into primaryCoin
        primaryBalance += BigInt(coinObj.balance);
      }
      if (primaryBalance < amountIn) {
        throw new Error(
          "Insufficient balance in source token to perform swap."
        );
      }
      // If primary coin has more than needed, split out the exact amount for swap
      let coinToSwap = primaryCoin;
      if (primaryBalance > amountIn) {
        const [exactCoin] = tx.splitCoins(primaryCoin, [tx.pure(amountIn)]);
        coinToSwap = exactCoin;
        // (The remainder stays in primaryCoin and will implicitly return to the user)
      }
      // Invoke NAVI aggregator to swap coinToSwap from fromCoinType to toCoinType
      await swapPTB(
        userAddress,
        tx,
        fromCoinType,
        toCoinType,
        coinToSwap,
        amountIn,
        Number(minOut)
      );
      // (After this call, the transaction `tx` contains the instructions to perform the swap.)

      // Prompt wallet to sign and execute the transaction
      setTxStatus("Signing and executing transaction...");
      signAndExecuteTransaction(
        {
          transaction: tx,
          // Specify mainnet chain to ensure correct network (optional if provider is already mainnet):
          chain: "sui:mainnet",
          options: { showEffects: true }, // request transaction effects in the response
        },
        {
          onSuccess: (result) => {
            console.log("Swap executed successfully", result);
            setTxStatus(
              `✅ Swap complete! Transaction digest: ${result.digest}`
            );
            // Optionally, you can parse result.effects or result.objectChanges to see the swap outcome.
          },
          onError: (error: any) => {
            console.error("Transaction failed", error);
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
    <div className="swap-container">
      {/* Wallet Connect Button */}
      <ConnectButton />{" "}
      {/* dApp Kit’s pre-built button for connecting wallets */}
      {/* Swap Form UI */}
      {currentAccount ? (
        <div>
          <p>Connected as: {currentAccount.address}</p>
          {/* From Token Selection (simplified as input) */}
          <div>
            <label>From Token:</label>
            <input
              type="text"
              value={fromCoinType}
              onChange={(e) => setFromCoinType(e.target.value)}
              placeholder="From Coin Type (e.g., 0x2::sui::SUI)"
            />
          </div>
          {/* To Token Selection */}
          <div>
            <label>To Token:</label>
            <input
              type="text"
              value={toCoinType}
              onChange={(e) => setToCoinType(e.target.value)}
              placeholder="To Coin Type (e.g., USDC type)"
            />
          </div>
          {/* Amount Input */}
          <div>
            <label>Amount:</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount to swap"
            />
          </div>
          {/* Slippage Input */}
          <div>
            <label>Slippage Tolerance (%):</label>
            <input
              type="number"
              step="0.1"
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value))}
            />
            %
          </div>
          {/* Quote display */}
          {quoteOut !== null && (
            <p>Expected Output: ~{quoteOut.toString()} (before slippage)</p>
          )}
          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={!amount || !fromCoinType || !toCoinType}
          >
            Swap
          </button>
          {/* Transaction status feedback */}
          {txStatus && <div className="tx-status">{txStatus}</div>}
        </div>
      ) : (
        <p>Please connect your Sui wallet to swap tokens.</p>
      )}
    </div>
  );
};

export default Swap;
