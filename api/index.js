// api/index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { NAVISDKClient } = require("navi-sdk");

// Load environment variables from .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS (adjust origin as needed)
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Initialize the NAVI SDK client with the public API key and mainnet configuration
const client = new NAVISDKClient({
  apiKey: process.env.NAVI_API_KEY,
  apiBaseUrl: process.env.NAVI_API_BASE_URL,
  networkType: "mainnet",
  numberOfAccounts: 5,
});

// Endpoint: GET /api/quote
// Query parameters: from, to, amount (in smallest unit)
app.get("/api/quote", async (req, res) => {
  try {
    const { from, to, amount } = req.query;
    if (!from || !to || !amount) {
      return res
        .status(400)
        .json({ error: "Missing required query parameters: from, to, amount" });
    }
    // Convert amount to BigInt if needed
    const amountIn = BigInt(amount);
    // Fetch the quote via the Navi SDK
    const quote = await client.getQuote(from, to, amountIn);
    return res.json({ data: quote });
  } catch (err) {
    console.error("Error fetching quote:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// Endpoint: POST /api/swap
// (Optional) Relay swap transaction details if you wish to simulate or prebuild a transaction.
// Note: The actual signing must be done on the frontend.
app.post("/api/swap", async (req, res) => {
  try {
    const { from, to, amount, minOut } = req.body;
    if (!from || !to || !amount || !minOut) {
      return res
        .status(400)
        .json({ error: "Missing required fields: from, to, amount, minOut" });
    }
    const amountIn = BigInt(amount);
    const minimumOut = BigInt(minOut);
    // Execute the swap via the Navi SDK.
    // IMPORTANT: In a public app, the transaction signing must occur in the frontend.
    // This endpoint can be used to generate a transaction block (or simulate a swap) without signing.
    const swapResult = await client.swap(
      from,
      to,
      amountIn,
      minimumOut,
      process.env.NAVI_API_KEY
    );
    return res.json({ data: swapResult });
  } catch (err) {
    console.error("Error executing swap:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Cerebra API backend listening at http://localhost:${port}`);
});
