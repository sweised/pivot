export function addressToSymbol(address: `0x${string}`) {
  if (address === "0xc2132D05D31c914a87C6611C10748AEb04B58e8F") return "USDT";
  if (address === "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270") return "WMATIC";
  if (address === "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174") return "USDC.e";
  if (address === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") return "WETH";
  return "Unknown";
}
