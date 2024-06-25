import { INonfungiblePositionManagerAbi } from "@/abi/INonfungiblePositionManager";
import { IUniswapV3FactoryAbi } from "@/abi/IUniswapV3Factory";
import { IUniswapV3PoolAbi } from "@/abi/IUniswapV3Pool";
import { OffChainOracleAbi } from "@/abi/OffchainOracle";
import { POSITION_ADDRESS, getFees, getTokenAmounts } from "@/lib/uniswap";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import {
  type Abi,
  type Address,
  erc20Abi,
  zeroAddress,
  formatUnits,
} from "viem";
import { multicall, readContract } from "viem/actions";
import { useClient } from "wagmi";
import { PositionTable } from "@/components/position-table";
import { useState } from "react";
import { type PositionDisplay, columns } from "@/components/columns";
import type { RowSelectionState } from "@tanstack/react-table";
import { CollectFees } from "@/components/collect-fees";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { toSignificantFigures } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

function getUniswapData(address: Address) {
  const publicClient = useClient({ config });

  // 4. Create a "custom" Query Hook that utilizes the Client.
  const { data: balanceOf } = useQuery({
    queryKey: ["balanceOf", publicClient?.uid],
    queryFn: () =>
      readContract(publicClient, {
        abi: INonfungiblePositionManagerAbi,
        address: POSITION_ADDRESS,
        functionName: "balanceOf",
        args: [address],
      }),
  });

  const totalPositionsNum = Number(balanceOf);

  const indices = Array.from({ length: totalPositionsNum }, (_, i) => i);

  const { data: tokenIds } = useQuery({
    queryKey: ["tokenIds", JSON.stringify(indices)],
    queryFn: () =>
      multicall(publicClient, {
        contracts: indices.map((index) => {
          return {
            abi: INonfungiblePositionManagerAbi,
            address: POSITION_ADDRESS,
            functionName: "tokenOfOwnerByIndex",
            args: [address, index],
          } as const;
        }),
        allowFailure: false,
      }),
    enabled: !!balanceOf,
  });

  const { data: positionArrays } = useQuery({
    queryKey: [
      "positions",
      JSON.stringify(tokenIds?.map((tokenId) => tokenId.toString())),
    ],
    queryFn: () =>
      multicall(publicClient, {
        contracts: (tokenIds ?? []).map((tokenId) => {
          return {
            abi: INonfungiblePositionManagerAbi,
            address: POSITION_ADDRESS,
            functionName: "positions",
            args: [tokenId],
          } as const;
        }),
        allowFailure: false,
      }),
    enabled: !!tokenIds,
  });

  const positions =
    (positionArrays?.length ?? 0) > 0
      ? positionArrays?.map((position, index) => {
          const tokenId = tokenIds?.[index];

          const positionInfo = {
            tokenId,
            nonce: position[0],
            operator: position[1],
            token0: position[2],
            token1: position[3],
            fee: position[4],
            tickLower: position[5],
            tickUpper: position[6],
            liquidity: position[7],
            feeGrowthInside0LastX128: position[8],
            feeGrowthInside1LastX128: position[9],
            tokensOwed0: position[10],
            tokensOwed1: position[11],
          };

          return positionInfo;
        })
      : [];

  const openPositions = positions?.filter((pos) => pos.liquidity > 0n);

  const setPools = new Set<string>();
  const setTokens = new Set<`0x${string}`>();

  const poolSet = openPositions?.reduce((prev, position) => {
    prev.add(
      JSON.stringify({
        token0: position.token0,
        token1: position.token1,
        fee: position.fee,
      })
    );
    setTokens.add(position.token0);
    setTokens.add(position.token1);
    return prev;
  }, setPools);

  const tokens = [...setTokens];

  const offChainOracleAddress = "0x7F069df72b7A39bCE9806e3AfaF579E54D8CF2b9";

  const dstToken: Address = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT

  const oracleContractCallsInitial: {
    abi: Abi;
    address: Address;
    functionName: string;
    args: [string, string, boolean];
  }[] = [];

  const oracleContractCalls = tokens.reduce((prev, token) => {
    if (token === dstToken) {
      return prev;
    }
    prev.push({
      abi: OffChainOracleAbi,
      address: offChainOracleAddress,
      functionName: "getRate",
      args: [
        token, // source token
        dstToken,
        true, // use source wrappers
      ],
    });
    return prev;
  }, oracleContractCallsInitial);

  const { data: tokenPrices } = useQuery({
    queryKey: ["tokenPrices", JSON.stringify(tokens)],
    queryFn: () =>
      multicall(publicClient, {
        contracts: oracleContractCalls,
        allowFailure: false,
      }),
    enabled: !!tokens,
  });

  const { data: erc20Info } = useQuery({
    queryKey: ["erc20Info", JSON.stringify(tokens)],
    queryFn: () =>
      multicall(publicClient, {
        contracts: tokens.map((token) => ({
          abi: erc20Abi,
          address: token,
          functionName: "decimals",
        })),
        allowFailure: false,
      }),
    enabled: !!tokens,
  });

  const dstIndex = tokens.findIndex((token) => token === dstToken);

  // prices in stable/currency
  const prices = erc20Info?.map((decimals, index) => {
    const token = tokens[index];
    if (token === dstToken) {
      return {
        token,
        price: 10n ** 6n,
        decimals: 6n,
      };
    }

    const srcIndex = oracleContractCalls.findIndex(
      (call) => call.args[0] === token
    );

    const numerator = 10n ** BigInt(decimals);
    const denominator = 10n ** BigInt((erc20Info?.[dstIndex] as number) + 12);
    const price =
      (((tokenPrices?.[srcIndex] ?? 0n) as bigint) * numerator) / denominator;
    return {
      token,
      price,
      decimals: BigInt(decimals),
    };
  });

  const pools = [...(poolSet ?? [])].map(
    (val) =>
      JSON.parse(val) as {
        token0: `0x${string}`;
        token1: `0x${string}`;
        fee: number;
      }
  );

  const UNISWAP_V3_FACTORY_ADDRESS: `0x${string}` =
    "0x1F98431c8aD98523631AE4a59f267346ea31F984";

  const { data: poolAddresses } = useQuery({
    queryKey: ["poolAddresses", JSON.stringify(pools)],
    queryFn: () =>
      multicall(publicClient, {
        contracts: pools.map((pool) => {
          return {
            abi: IUniswapV3FactoryAbi,
            address: UNISWAP_V3_FACTORY_ADDRESS,
            functionName: "getPool",
            args: [pool.token0, pool.token1, pool.fee],
          };
        }),
        allowFailure: false,
      }),
    enabled: !!pools,
  });

  interface TickAddressArg {
    address: `0x${string}`;
    args: number[];
  }

  const initial: TickAddressArg[] = [];

  const tickAddressArgs = openPositions?.reduce((prev, position) => {
    const poolIndex = pools.findIndex(
      (pool) =>
        position.token0 === pool.token0 &&
        position.token1 === pool.token1 &&
        position.fee === pool.fee
    );

    prev.push({
      address: poolAddresses?.[poolIndex] ?? zeroAddress,
      args: [position.tickLower],
    });

    prev.push({
      address: poolAddresses?.[poolIndex] ?? zeroAddress,
      args: [position.tickUpper],
    });

    return prev;
  }, initial);

  const tickCalls = tickAddressArgs?.map((tickCall) => {
    return {
      ...tickCall,
      abi: IUniswapV3PoolAbi,
      functionName: "ticks",
    };
  });

  const slot0Calls = poolAddresses?.map((address) => {
    return {
      address: address,
      abi: IUniswapV3PoolAbi,
      functionName: "slot0",
    };
  });

  const feeGrowthCalls0 = poolAddresses?.map((address) => {
    return {
      address: address,
      abi: IUniswapV3PoolAbi,
      functionName: "feeGrowthGlobal0X128",
    };
  });

  const feeGrowthCalls1 = poolAddresses?.map((address) => {
    return {
      address: address,
      abi: IUniswapV3PoolAbi,
      functionName: "feeGrowthGlobal1X128",
    };
  });

  const poolDataContracts = [
    ...(slot0Calls ?? []),
    ...(feeGrowthCalls0 ?? []),
    ...(feeGrowthCalls1 ?? []),
    ...(tickCalls ?? []),
  ];

  const {
    data: poolData,
    isPending,
    isError,
    isFetched,
    isLoading,
  } = useQuery({
    queryKey: ["poolData", JSON.stringify(poolDataContracts)],
    queryFn: () =>
      multicall(publicClient, {
        contracts: poolDataContracts,
        allowFailure: false,
      }),
    enabled: !!pools,
  });

  if (isPending || isError || !isFetched || isLoading) {
    return {
      data: [],
      isPending,
      isError,
      isFetched,
      isLoading,
    };
  }

  const totalPools = poolAddresses?.length ?? 0;

  const slot0Data = poolData?.slice(0, totalPools);
  const feeGrowthData0 = poolData?.slice(totalPools, totalPools * 2);
  const feeGrowthData1 = poolData?.slice(totalPools * 2, totalPools * 3);
  const tickData = poolData?.slice(totalPools * 3);

  const positionAmounts = openPositions?.map((position, index) => {
    const poolIndex = pools.findIndex(
      (pool) =>
        position.token0 === pool.token0 &&
        position.token1 === pool.token1 &&
        position.fee === pool.fee
    );

    const slot0 = slot0Data?.[poolIndex] as readonly [
      bigint,
      number,
      number,
      number,
      number,
      number,
      boolean,
    ];

    // always an upper and lower tick
    const tickLower = tickData?.[index * 2] as readonly [
      bigint,
      number,
      number,
      number,
      number,
      number,
      boolean,
    ];

    const tickLowerFeeGrowthOutside_0 = tickLower[2];
    const tickLowerFeeGrowthOutside_1 = tickLower[3];

    const tickUpper = tickData?.[index * 2 + 1] as readonly [
      bigint,
      number,
      number,
      number,
      number,
      number,
      boolean,
    ];

    const tickUpperFeeGrowthOutside_0 = tickUpper[2];
    const tickUpperFeeGrowthOutside_1 = tickUpper[3];

    const sqrtPriceX96 = slot0[0];
    const tick = slot0[1];

    const feeGrowthGlobal0X128 = feeGrowthData0?.[poolIndex];
    const feeGrowthGlobal1X128 = feeGrowthData1?.[poolIndex];

    const fees = getFees(
      (feeGrowthGlobal0X128 ?? 0n) as bigint,
      (feeGrowthGlobal1X128 ?? 0n) as bigint,
      BigInt(tickLowerFeeGrowthOutside_0 ?? 0),
      BigInt(tickUpperFeeGrowthOutside_0 ?? 0),
      BigInt(position.feeGrowthInside0LastX128 ?? 0),
      BigInt(tickLowerFeeGrowthOutside_1 ?? 0),
      BigInt(tickUpperFeeGrowthOutside_1 ?? 0),
      BigInt(position.feeGrowthInside1LastX128 ?? 0),
      BigInt(position.liquidity ?? 0),
      BigInt(position.tickLower ?? 0),
      BigInt(position.tickUpper ?? 0),
      BigInt(tick ?? 0)
    );

    const amounts = getTokenAmounts({
      liquidity: Number(position.liquidity),
      sqrtPriceX96: Number(sqrtPriceX96),
      tickLow: position.tickLower,
      tickHigh: position.tickUpper,
      tick: Number(tick),
    });

    const tokenAmounts = {
      amount0: amounts.token0,
      amount1: amounts.token1,
      fees0: fees.token0,
      fees1: fees.token1,
      tick,
    };

    return tokenAmounts;
  });

  const positionAmountsConverted =
    positionAmounts?.map(({ amount0, amount1, fees0, fees1, tick }, index) => {
      const position = openPositions?.[index];

      if (position === undefined) {
        return {
          amount0,
          amount1,
          fees0,
          fees1,
          tick,
        };
      }
      const token0 = position.token0;
      const token1 = position.token1;

      const price0 = prices?.find(({ token }) => token === token0);
      const price1 = prices?.find(({ token }) => token === token1);

      const { price: token0Rate, decimals: token0Decimals } = price0 ?? {
        price: 0n,
        decimals: 18n,
      };
      const { price: token1Rate, decimals: token1Decimals } = price1 ?? {
        price: 0n,
        decimals: 18n,
      };

      return {
        amount0: (amount0 * token0Rate) / 10n ** (token0Decimals ?? 0n),
        amount1: (amount1 * token1Rate) / 10n ** (token1Decimals ?? 0n),
        fees0: (fees0 * token0Rate) / 10n ** (token0Decimals ?? 0n),
        fees1: (fees1 * token1Rate) / 10n ** (token1Decimals ?? 0n),
        tick,
      };
    }) ?? [];

  const positionData =
    openPositions?.map((position, index) => {
      return {
        ...position,
        positionAmounts: positionAmounts?.[index],
        positionAmountsConverted: positionAmountsConverted?.[index],
      };
    }) ?? [];

  return {
    data: positionData,
    isPending,
    isError,
    isFetched,
    isLoading,
  };
}

export function UniswapPositions({ address }: { address: `0x${string}` }) {
  const [rowSelection, setRowSelection] = useState({} as RowSelectionState);

  const { data, isPending, isError, isFetched, isLoading } =
    getUniswapData(address);

  const dataAvailable = !isPending && !isError && isFetched && !isLoading;

  if (!dataAvailable || data?.length === 0) {
    return (
      <div className="col-span-2 overflow-y-auto">
        <div className="flex flex-col items-center justify-center h-full">
          <div className="flex flex-row items-center">
            <div className="px-4">
              <LoaderCircle
                size={35}
                strokeWidth={2}
                className="animate-spin"
              />
            </div>
            <h1 className="text-3xl font-semibold">
              {" "}
              Loading Uniswap V3 investments...
            </h1>
          </div>
        </div>
      </div>
    );
  }

  const totalFunds =
    data?.reduce((prev, { positionAmountsConverted }) => {
      const { amount0, amount1, fees0, fees1 } = positionAmountsConverted;
      return prev + amount0 + amount1 + fees0 + fees1;
    }, 0n) ?? 0n;

  const displayData =
    data?.map((position) => {
      return {
        id: position.tokenId ?? 0n,
        inRange:
          position.tickLower <= (position.positionAmounts?.tick ?? 0) &&
          position.tickUpper >= (position.positionAmounts?.tick ?? 0),
        totalFees:
          (position.positionAmountsConverted.fees0 ?? 0n) +
          (position.positionAmountsConverted.fees1 ?? 0n),
        totalLiquidity:
          (position.positionAmountsConverted.amount0 ?? 0n) +
          (position.positionAmountsConverted.amount1 ?? 0n),
        pool: {
          token0: position.token0,
          token1: position.token1,
          fee: position.fee,
        },
      } as PositionDisplay;
    }) ?? [];

  const tokenIds = Object.keys(rowSelection).map((indexString) => {
    const index = Number(indexString);
    return data[index]?.tokenId ?? 0n;
  });

  const totalFees = Object.keys(rowSelection).reduce((prev, indexString) => {
    const index = Number(indexString);
    indexString;
    const { fees0, fees1 } = data[index].positionAmountsConverted;
    return prev + (fees0 ?? 0n) + (fees1 ?? 0n);
  }, 0n);

  return (
    <>
      <div className="overflow-y-auto">
        <div className="relative grid grid-cols-1 grid-rows-[1fr_auto] h-full">
          {dataAvailable && (
            <div className="px-4 sm:px-6 lg:px-8">
              <PositionTable
                columns={columns}
                data={displayData}
                rowSelection={rowSelection}
                setRowSelection={setRowSelection}
              />
            </div>
          )}
          {/* {totalFunds > 0n && (
        <p>
          Total: 
        </p>
      )} */}
        </div>
      </div>
      <div className="flex flex-col px-4 sm:px-6 lg:px-8">
        <Card className="w-fill mb-4">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Select positions to act on</CardDescription>
          </CardHeader>
          <CardContent>
            <CollectFees
              account={address}
              tokenIds={tokenIds}
              totalFees={totalFees}
            />
          </CardContent>
        </Card>
        <Card className="w-fill mb-4">
          <CardHeader>
            <CardTitle>Portfolio</CardTitle>
            <CardDescription>
              Total ${toSignificantFigures(formatUnits(totalFunds ?? 0n, 6), 2)}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </>
  );
}
