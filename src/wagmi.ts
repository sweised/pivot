import { http, createConfig } from "wagmi";
import { polygon } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

export const config = createConfig({
  chains: [polygon],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "Pivot" }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "",
      metadata: {
        name: "Pivot",
        description:
          "Pivot is the DeFi manager for your Web3 portfolio on Polygon.",
        url: "https://pivot.xyz",
        icons: ["https://pivot.xyz/favicon.ico"],
      },
    }),
  ],
  ssr: true,
  transports: {
    [polygon.id]: http(process.env.ALCHEMY_ENDPOINT_URL ?? ""),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
