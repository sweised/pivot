import { INonfungiblePositionManagerAbi } from "@/abi/INonfungiblePositionManager";
import { type Address, encodeFunctionData, maxUint128 } from "viem";

const ZERO = BigInt(0);
const Q96 = BigInt(2) ** BigInt(96);
const Q128 = BigInt(2) ** BigInt(128);
const Q256 = BigInt(2) ** BigInt(256);

export const POSITION_ADDRESS = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

export function getTokenAmounts({
  liquidity,
  sqrtPriceX96,
  tickLow,
  tickHigh,
  tick,
}: {
  liquidity: number;
  sqrtPriceX96: number;
  tickLow: number;
  tickHigh: number;
  tick: number;
}) {
  const sqrtRatioA = Math.sqrt(1.0001 ** tickLow);
  const sqrtRatioB = Math.sqrt(1.0001 ** tickHigh);
  const currentTick = tick;
  const sqrtPrice = sqrtPriceX96 / Number(Q96);
  let amount0 = 0;
  let amount1 = 0;
  if (currentTick < tickLow) {
    amount0 = Math.floor(
      liquidity * ((sqrtRatioB - sqrtRatioA) / (sqrtRatioA * sqrtRatioB))
    );
  } else if (currentTick >= tickHigh) {
    amount1 = Math.floor(liquidity * (sqrtRatioB - sqrtRatioA));
  } else if (currentTick >= tickLow && currentTick < tickHigh) {
    amount0 = Math.floor(
      liquidity * ((sqrtRatioB - sqrtPrice) / (sqrtPrice * sqrtRatioB))
    );
    amount1 = Math.floor(liquidity * (sqrtPrice - sqrtRatioA));
  }

  return { token0: BigInt(amount0), token1: BigInt(amount1) };
} // this handles the over and underflows which is needed for all subtraction in the fees math
function subIn256(x: bigint, y: bigint) {
  const difference = x - y;
  if (difference < ZERO) {
    return Q256 + difference;
  }
  return difference;
}
export function getFees(
  feeGrowthGlobal0: bigint,
  feeGrowthGlobal1: bigint,
  feeGrowth0Low: bigint,
  feeGrowth0Hi: bigint,
  feeGrowthInside0: bigint,
  feeGrowth1Low: bigint,
  feeGrowth1Hi: bigint,
  feeGrowthInside1: bigint,
  liquidity: bigint,
  tickLower: bigint,
  tickUpper: bigint,
  tickCurrent: bigint
) {
  // all needs to be bigNumber
  const feeGrowthGlobal_0 = feeGrowthGlobal0;
  const feeGrowthGlobal_1 = feeGrowthGlobal1;
  const tickLowerFeeGrowthOutside_0 = feeGrowth0Low;
  const tickLowerFeeGrowthOutside_1 = feeGrowth1Low;
  const tickUpperFeeGrowthOutside_0 = feeGrowth0Hi;
  const tickUpperFeeGrowthOutside_1 = feeGrowth1Hi;
  // preset variables to 0 BigNumber
  let tickLowerFeeGrowthBelow_0 = ZERO;
  let tickLowerFeeGrowthBelow_1 = ZERO;
  let tickUpperFeeGrowthAbove_0 = ZERO;
  let tickUpperFeeGrowthAbove_1 = ZERO;

  // As stated above there is different math needed if the position is in or out of range
  // If current tick is above the range fg- fo,iu Growth Above range
  if (tickCurrent >= tickUpper) {
    tickUpperFeeGrowthAbove_0 = subIn256(
      feeGrowthGlobal_0,
      tickUpperFeeGrowthOutside_0
    );
    tickUpperFeeGrowthAbove_1 = subIn256(
      feeGrowthGlobal_1,
      tickUpperFeeGrowthOutside_1
    );
  } else {
    // Else if current tick is in range only need fg for upper growth
    tickUpperFeeGrowthAbove_0 = tickUpperFeeGrowthOutside_0;
    tickUpperFeeGrowthAbove_1 = tickUpperFeeGrowthOutside_1;
  }
  // If current tick is in range only need fg for lower growth
  if (tickCurrent >= tickLower) {
    tickLowerFeeGrowthBelow_0 = tickLowerFeeGrowthOutside_0;
    tickLowerFeeGrowthBelow_1 = tickLowerFeeGrowthOutside_1;
  } else {
    // If current tick is above the range fg- fo,il Growth below range
    tickLowerFeeGrowthBelow_0 = subIn256(
      feeGrowthGlobal_0,
      tickLowerFeeGrowthOutside_0
    );
    tickLowerFeeGrowthBelow_1 = subIn256(
      feeGrowthGlobal_1,
      tickLowerFeeGrowthOutside_1
    );
  }

  // fr(t1) For both token0 and token1
  const fr_t1_0 = subIn256(
    subIn256(feeGrowthGlobal_0, tickLowerFeeGrowthBelow_0),
    tickUpperFeeGrowthAbove_0
  );
  const fr_t1_1 = subIn256(
    subIn256(feeGrowthGlobal_1, tickLowerFeeGrowthBelow_1),
    tickUpperFeeGrowthAbove_1
  );
  // feeGrowthInside to BigNumber
  const feeGrowthInsideLast_0 = BigInt(feeGrowthInside0);
  const feeGrowthInsideLast_1 = BigInt(feeGrowthInside1);

  // The final calculations uncollected fees formula
  // for both token 0 and token 1 since we now know everything that is needed to compute it
  // subtracting the two values and then multiplying with liquidity l *(fr(t1) - fr(t0))
  const uncollectedFees_0 =
    (liquidity * subIn256(fr_t1_0, feeGrowthInsideLast_0)) / Q128;
  const uncollectedFees_1 =
    (liquidity * subIn256(fr_t1_1, feeGrowthInsideLast_1)) / Q128;

  return {
    token0: uncollectedFees_0,
    token1: uncollectedFees_1,
  };
}

type CollectContractParams = {
  tokenId: bigint;
  account: Address;
};

export function collectContractData({
  tokenId,
  account,
}: CollectContractParams) {
  const collectOptions = {
    tokenId: tokenId,
    recipient: account,
    amount0Max: maxUint128,
    amount1Max: maxUint128,
  };

  return encodeFunctionData({
    abi: INonfungiblePositionManagerAbi,
    functionName: "collect",
    args: [collectOptions],
  });
}
