import { INonfungiblePositionManagerAbi } from "@/abi/INonfungiblePositionManager";
import { POSITION_ADDRESS, collectContractData } from "@/lib/uniswap";
import { formatUnits, maxUint128, type Address } from "viem";
import { useWriteContract } from "wagmi";
import { Button } from "./ui/button";

export interface ICollectFeesParams {
  tokenIds: bigint[];
  account: Address;
  totalFees: bigint;
}

export function CollectFees({
  tokenIds,
  account,
  totalFees,
}: ICollectFeesParams) {
  const calldata = tokenIds.map((tokenId) =>
    collectContractData({ tokenId, account })
  );

  const { writeContract, error, isPending } = useWriteContract();

  const amount = Number.parseFloat(formatUnits(totalFees, 6));
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

  const disabled = isPending || tokenIds.length === 0;
  const onClick = disabled
    ? () => {}
    : () => {
        if (tokenIds.length > 1) {
          writeContract({
            account: account,
            abi: INonfungiblePositionManagerAbi,
            address: POSITION_ADDRESS,
            functionName: "multicall",
            args: [calldata],
          });
        } else {
          writeContract({
            account: account,
            abi: INonfungiblePositionManagerAbi,
            address: POSITION_ADDRESS,
            functionName: "collect",
            args: [
              {
                tokenId: tokenIds[0],
                recipient: account,
                amount0Max: maxUint128,
                amount1Max: maxUint128,
              },
            ],
          });
        }
      };

  return (
    <>
      {/* {error && (
        <div>Error: {(error as BaseError).shortMessage || error.message}</div>
      )} */}
      <Button className="min-w-[300px]" onClick={onClick} disabled={disabled}>
        Collect {formatted} from {tokenIds.length} position
        {tokenIds.length !== 1 && "s"}
      </Button>
    </>
  );
}
