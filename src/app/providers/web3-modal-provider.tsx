import type { ReactNode } from "react";
import { config } from "@/wagmi";
import { createWeb3Modal } from "@web3modal/wagmi/react";

// 3. Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "",
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
  enableOnramp: true, // Optional - false as default
});

interface Props {
  children?: ReactNode;
}

export function Web3ModalProvider({ children }: Props) {
  return <>{children}</>;
}
