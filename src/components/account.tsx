"use client";

import { useAccount } from "wagmi";

export default function Account() {
  const { address } = useAccount();
  return <p>{address ?? "Loading..."}</p>;
}
