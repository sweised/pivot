"use client";

import { useAccount } from "wagmi";
import { OpenW3mButton } from "./open-w3m-button";
import { UniswapPositions } from "./uniswap-positions";

export default function Uniswap() {
  const account = useAccount();

  return (
    <>
      {!account.isConnecting && account.status === "connected" && (
        <UniswapPositions address={account.address} />
      )}
      {account.status === "disconnected" && (
        <div className="col-span-2">
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-4xl font-bold">
              Save costs on <span className="text-primary">Uniswap V3</span>
            </h1>
            <p className="text-lg leading-7 [&:not(:first-child)]:mt-6">
              Combine multiple actions into a single call to save gas
            </p>
            <OpenW3mButton
              className="my-6 py-5 px-8 rounded-md bg-primary text-white"
              message="Connect wallet to begin"
            />
          </div>
        </div>
      )}
    </>
  );
}
