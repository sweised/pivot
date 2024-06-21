"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { Theme, ThemePanel } from "@radix-ui/themes";

import { config } from "@/wagmi";
import { Web3ModalProvider } from "./providers/web3-modal-provider";

export function Providers(props: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <>
      <Web3ModalProvider>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <Theme>
              <ThemePanel />
              {props.children}
            </Theme>
          </QueryClientProvider>
        </WagmiProvider>
      </Web3ModalProvider>
    </>
  );
}
