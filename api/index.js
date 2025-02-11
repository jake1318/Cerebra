// api/index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { NAVISDKClient } = require("navi-sdk");

// Load environment variables from .env (NAVI_API_KEY, NAVI_API_BASE_URL, etc.)
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all origins (adjust if needed for production)
app.use(cors());
// Parse JSON request bodies
app.use(express.json());

// Initialize the NAVI SDK client with API key, base URL, and network config
const client = new NAVISDKClient({
  apiKey: process.env.NAVI_API_KEY,
  apiBaseUrl: process.env.NAVI_API_BASE_URL,
  networkType: "mainnet", // or use an env var to configure network if needed
  numberOfAccounts: 5, // pre-initialize accounts for SDK if required
});

// Endpoint: GET /api/quote
// Query params: from, to, amount (amount in smallest unit, e.g. Wei or minimal coin unit)
app.get("/api/quote", async (req, res) => {
  try {
    const { from, to, amount } = req.query;
    if (!from || !to || !amount) {
      return res
        .status(400)
        .json({ error: "Missing required query parameters: from, to, amount" });
    }
    const amountIn = BigInt(amount); // convert amount to BigInt
    const quote = await client.getQuote(from, to, amountIn);
    // Return the quote data (e.g. amount_out, route details, etc.)
    return res.json({ data: quote });
  } catch (err) {
    console.error("Error fetching quote:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// Endpoint: POST /api/swap
// Body JSON: { from, to, amount, minOut } – prepare a swap transaction (no signing here)
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
    // Use Navi SDK to generate a swap transaction block (unsigned).
    // Note: Actual signing/execution should be done on the frontend via the user's wallet.
    const swapResult = await client.swap(
      from,
      to,
      amountIn,
      minimumOut,
      process.env.NAVI_API_KEY
    );
    // Return the result (could include transaction payload or simulation outcome)
    return res.json({ data: swapResult });
  } catch (err) {
    console.error("Error executing swap:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// Only start the server if this script is run directly (for local development).
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Cerebra API backend listening at http://localhost:${port}`);
  });
}

// Export the Express app for serverless deployment (Vercel will use this export)
module.exports = app;
