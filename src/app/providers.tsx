"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";

import { config } from "@/wagmi";
import { Web3ModalProvider } from "./providers/web3-modal-provider";

export function Providers(props: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  console.log(config);

  return (
    <>
      <Web3ModalProvider>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            {props.children}
          </QueryClientProvider>
        </WagmiProvider>
      </Web3ModalProvider>
    </>
  );
}
