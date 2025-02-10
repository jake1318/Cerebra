export interface CoinInfo {
  name: string;
  symbol: string;
  coin_type: string;
  decimals: number;
  icon_url: string;
}

export async function fetchTokenList(): Promise<CoinInfo[]> {
  // Example URL for a token list; replace with NAVI token list if available.
  const url =
    "https://raw.githubusercontent.com/suiet/sui-coin-list/main/src/coins.json";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch token list");
  }
  const data = await response.json();
  return data;
}
