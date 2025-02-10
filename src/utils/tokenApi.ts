// src/utils/tokenApi.ts
export interface CoinInfo {
  name: string;
  symbol: string;
  coin_type: string; // unique coin type/address on Sui
  decimals: number;
  icon_url: string;
}

// Fetch token list dynamically (from NAVI SDK or an external source)
export async function fetchTokenList(): Promise<CoinInfo[]> {
  // URL of a JSON token list (here using Suiet's Sui coin list as example)
  const url =
    "https://raw.githubusercontent.com/suiet/sui-coin-list/main/src/coins.json";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch token list");
  }
  const data = await response.json();
  return data;
}
