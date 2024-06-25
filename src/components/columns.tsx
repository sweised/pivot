import type { ColumnDef } from "@tanstack/react-table";
import { type Address, formatUnits } from "viem";
import {
  ArrowUpDown,
  CircleAlert,
  CircleCheck,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Checkbox } from "@/components/ui/checkbox";
import { addressToSymbol } from "@/lib/token";

export type PositionDisplay = {
  inRange: boolean;
  id: bigint;
  pool: PoolInfo;
  totalFees: bigint;
  totalLiquidity: bigint;
};

export type PoolInfo = {
  token0: Address;
  token1: Address;
  fee: number;
};

export const columns: ColumnDef<PositionDisplay>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // {
  //   accessorKey: "inRange",
  //   header: () => <></>,
  //   cell: ({ row }) => {
  //     const inRange = row.getValue("inRange") as boolean;
  //     const logo = inRange ? <CircleCheck /> : <CircleAlert />;
  //     return logo;
  //   },
  // },
  {
    accessorKey: "pool",
    header: "Pool",
    cell: ({ row }) => {
      const { token0, token1, fee } = row.getValue("pool") as PoolInfo;
      return (
        <>
          <code className="rounded bg-muted text-mono mx-[0.3rem] px-[0.3rem] py-[0.2rem] text-sm font-semibold">
            {addressToSymbol(token0)}
          </code>
          /
          <code className="rounded bg-muted text-mono mx-[0.3rem] px-[0.3rem] py-[0.2rem] text-sm font-semibold">
            {addressToSymbol(token1)}
          </code>
        </>
      );
    },
  },
  {
    accessorKey: "poolFee",
    header: "Fee",
    cell: ({ row }) => {
      const { fee } = row.getValue("pool") as PoolInfo;
      return (
        <code className="rounded bg-muted text-mono mx-[0.3rem] px-[0.3rem] py-[0.2rem] text-sm font-semibold">
          {fee / 10000}%
        </code>
      );
    },
  },

  {
    accessorKey: "totalLiquidity",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() !== "desc")
            }
          >
            Liquidity
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      formatUnits;
      const amount = Number.parseFloat(
        formatUnits(row.getValue("totalLiquidity"), 6)
      );
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return (
        <div className="text-right">
          <code className="text-mono">{formatted}</code>
        </div>
      );
    },
  },
  {
    accessorKey: "totalFees",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() !== "desc")
            }
          >
            Fees
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      formatUnits;
      const amount = Number.parseFloat(
        formatUnits(row.getValue("totalFees"), 6)
      );
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return (
        <div className="text-right">
          <code className="text-mono">{formatted}</code>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const position = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(position.id.toString())
              }
            >
              Copy token ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <a
                href={`https://app.uniswap.org/pools/${position.id}`}
                target="_blank"
                rel="noreferrer"
              >
                View on Uniswap
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
