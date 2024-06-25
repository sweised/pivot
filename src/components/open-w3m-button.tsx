"use client";

import { useWeb3Modal } from "@web3modal/wagmi/react";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { UserIcon } from "lucide-react";

function shortenHexAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-6)}`;
}

export function OpenW3mButton({
  className,
  message,
}: {
  className?: string;
  message?: string;
}) {
  const { open } = useWeb3Modal();
  const { isConnected, address } = useAccount();

  if (isConnected) {
    return (
      <Button variant="secondary" onClick={() => open()}>
        <UserIcon /> {address ? shortenHexAddress(address) : "No address"}
      </Button>
    );
  }

  return (
    <Button className={className} onClick={() => open()}>
      {message ?? "Connect"}
    </Button>
  );
}
