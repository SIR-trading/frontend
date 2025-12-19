"use client";

import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import {
  SystemControlContract,
  SYSTEM_CONTROL_OWNER,
} from "@/contracts/systemControl";
import { SirContract } from "@/contracts/sir";
import { TreasuryAbi } from "@/contracts/treasury";
import { erc20Abi } from "viem";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { encodeFunctionData, parseUnits, formatUnits, type Address } from "viem";
import buildData from "@/../public/build-data.json";
import { api } from "@/trpc/react";

export default function AdminPage() {
  const { address, isConnected } = useAccount();

  const isOwner =
    isConnected &&
    address?.toLowerCase() === SYSTEM_CONTROL_OWNER.toLowerCase();

  if (!isConnected) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
        <p className="text-muted-foreground">Connect your wallet to continue.</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
        <p className="text-red-500">Access denied. Only the SystemControl owner can access this page.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Connected: {address}
        </p>
        <p className="text-sm text-muted-foreground">
          Required: {SYSTEM_CONTROL_OWNER}
        </p>
      </div>
    );
  }

  const hasStaker = buildData.contractAddresses.uniswapV3Staker !== "0x0000000000000000000000000000000000000000";

  return (
    <div className="p-8 w-full max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      <Tabs defaultValue="treasury">
        <TabsList className="flex gap-6 mb-6">
          <TabsTrigger value="treasury">Treasury</TabsTrigger>
          <TabsTrigger value="issuances">Vault Issuances</TabsTrigger>
          {hasStaker && <TabsTrigger value="incentives">Incentives</TabsTrigger>}
        </TabsList>

        <TabsContent value="treasury">
          <TreasuryTab />
        </TabsContent>

        <TabsContent value="issuances">
          <UpdateVaultsIssuancesForm />
        </TabsContent>

        {hasStaker && (
          <TabsContent value="incentives">
            <IncentivesTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function TreasuryTab() {
  const [treasuryAddress, setTreasuryAddress] = useState("");
  const isValidTreasuryAddress = treasuryAddress.match(/^0x[a-fA-F0-9]{40}$/);

  return (
    <div className="space-y-6">
      {/* Treasury Address */}
      <div className="border border-foreground/20 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Treasury Address</h2>
        <input
          type="text"
          value={treasuryAddress}
          onChange={(e) => setTreasuryAddress(e.target.value)}
          placeholder="0x..."
          className="w-full px-3 py-2 bg-background border border-foreground/20 rounded-md text-sm font-mono"
        />
        {isValidTreasuryAddress && (
          <TreasurySirBalance treasuryAddress={treasuryAddress as Address} />
        )}
        {!isValidTreasuryAddress && (
          <p className="text-xs text-muted-foreground mt-1">
            Enter the Treasury contract address for this chain
          </p>
        )}
      </div>

      {isValidTreasuryAddress && (
        <>
          <TreasuryMintForm treasuryAddress={treasuryAddress as Address} />
          <TreasuryTransferForm treasuryAddress={treasuryAddress as Address} />
        </>
      )}
    </div>
  );
}

function TreasurySirBalance({ treasuryAddress }: { treasuryAddress: Address }) {
  const { data: balance, isLoading } = useReadContract({
    address: SirContract.address,
    abi: SirContract.abi,
    functionName: "balanceOf",
    args: [treasuryAddress],
  });

  const formattedBalance = balance !== undefined
    ? formatUnits(balance, 12)
    : "0";

  return (
    <p className="text-sm text-muted-foreground mt-1">
      Balance: {isLoading ? "..." : <span className="font-mono text-foreground">{Number(formattedBalance).toLocaleString()} SIR</span>}
    </p>
  );
}

function TreasuryMintForm({ treasuryAddress }: { treasuryAddress: Address }) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const handleMint = () => {
    const mintCalldata = encodeFunctionData({
      abi: SirContract.abi,
      functionName: "contributorMint",
    });

    writeContract({
      address: treasuryAddress,
      abi: TreasuryAbi,
      functionName: "relayCall",
      args: [SirContract.address, mintCalldata],
    });
  };

  return (
    <div className="border border-foreground/20 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Mint SIR Allocation</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Mint the treasury&apos;s pending SIR contributor allocation.
      </p>

      <Button
        type="button"
        variant="submit"
        onClick={handleMint}
        disabled={isPending || isConfirming}
      >
        {isPending
          ? "Confirm in Wallet..."
          : isConfirming
            ? "Confirming..."
            : "Mint SIR Allocation"}
      </Button>

      {isConfirmed && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-md">
          <p className="text-green-500 text-sm">Transaction confirmed!</p>
          <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
            Hash: {hash}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={reset}
            className="mt-2"
          >
            Reset
          </Button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md">
          <p className="text-red-500 text-sm">Transaction failed</p>
          <p className="text-xs text-muted-foreground mt-1 break-all">
            {error.message.split("\n")[0]}
          </p>
        </div>
      )}
    </div>
  );
}

function TreasuryTransferForm({ treasuryAddress }: { treasuryAddress: Address }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipient || !amount) return;

    const amountInWei = parseUnits(amount, 12);

    const transferCalldata = encodeFunctionData({
      abi: SirContract.abi,
      functionName: "transfer",
      args: [recipient as Address, amountInWei],
    });

    writeContract({
      address: treasuryAddress,
      abi: TreasuryAbi,
      functionName: "relayCall",
      args: [SirContract.address, transferCalldata],
    });
  };

  const handleReset = () => {
    reset();
    setRecipient("");
    setAmount("");
  };

  return (
    <div className="border border-foreground/20 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Transfer SIR</h2>
      <form onSubmit={handleTransfer} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 bg-background border border-foreground/20 rounded-md text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Amount (SIR)
          </label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 1000"
            className="w-full px-3 py-2 bg-background border border-foreground/20 rounded-md text-sm font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Amount in SIR tokens (12 decimals)
          </p>
        </div>

        <Button
          type="submit"
          variant="submit"
          disabled={isPending || isConfirming || !recipient || !amount}
        >
          {isPending
            ? "Confirm in Wallet..."
            : isConfirming
              ? "Confirming..."
              : "Transfer SIR"}
        </Button>

        {isConfirmed && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-md">
            <p className="text-green-500 text-sm">Transaction confirmed!</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
              Hash: {hash}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="mt-2"
            >
              Reset Form
            </Button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
            <p className="text-red-500 text-sm">Transaction failed</p>
            <p className="text-xs text-muted-foreground mt-1 break-all">
              {error.message.split("\n")[0]}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

function UpdateVaultsIssuancesForm() {
  const [oldVaults, setOldVaults] = useState("");
  const [newVaults, setNewVaults] = useState("");
  const [newTaxes, setNewTaxes] = useState("");

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Fetch active vaults via TRPC
  const { data: activeVaults, isLoading: isLoadingVaults } = api.vault.getActiveIssuanceVaults.useQuery();

  // Pre-populate oldVaults when data is loaded
  useEffect(() => {
    if (activeVaults && activeVaults.length > 0) {
      const vaultIds = activeVaults.map((v) => v.id).join(", ");
      setOldVaults(vaultIds);
    }
  }, [activeVaults]);

  const parseNumberArray = (input: string): number[] => {
    if (!input.trim()) return [];
    return input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((v) => parseInt(v, 10));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const oldVaultsArray = parseNumberArray(oldVaults);
    const newVaultsArray = parseNumberArray(newVaults);
    const newTaxesArray = parseNumberArray(newTaxes);

    writeContract({
      ...SystemControlContract,
      functionName: "updateVaultsIssuances",
      args: [oldVaultsArray, newVaultsArray, newTaxesArray],
    });
  };

  const handleResetIssuances = () => {
    reset();
    setOldVaults("");
    setNewVaults("");
    setNewTaxes("");
  };

  return (
    <div className="border border-foreground/20 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Update Vaults Issuances</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Old Vaults (uint48[], comma-separated)
          </label>
          <input
            type="text"
            value={isLoadingVaults ? "Loading..." : oldVaults}
            onChange={(e) => setOldVaults(e.target.value)}
            placeholder="e.g., 1, 2, 3"
            className="w-full px-3 py-2 bg-background border border-foreground/20 rounded-md text-sm font-mono"
            disabled={isLoadingVaults}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Auto-populated with vaults currently receiving issuance (tax &gt; 0)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            New Vaults (uint48[], comma-separated)
          </label>
          <input
            type="text"
            value={newVaults}
            onChange={(e) => setNewVaults(e.target.value)}
            placeholder="e.g., 4, 5, 6"
            className="w-full px-3 py-2 bg-background border border-foreground/20 rounded-md text-sm font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Vault IDs to add to issuance
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            New Taxes (uint8[], comma-separated)
          </label>
          <input
            type="text"
            value={newTaxes}
            onChange={(e) => setNewTaxes(e.target.value)}
            placeholder="e.g., 50, 100, 150"
            className="w-full px-3 py-2 bg-background border border-foreground/20 rounded-md text-sm font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Tax values for each new vault (0-255)
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            variant="submit"
            disabled={isPending || isConfirming}
          >
            {isPending
              ? "Confirm in Wallet..."
              : isConfirming
                ? "Confirming..."
                : "Update Issuances"}
          </Button>
        </div>

        {isConfirmed && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-md">
            <p className="text-green-500 text-sm">Transaction confirmed!</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
              Hash: {hash}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetIssuances}
              className="mt-2"
            >
              Reset Form
            </Button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
            <p className="text-red-500 text-sm">Transaction failed</p>
            <p className="text-xs text-muted-foreground mt-1 break-all">
              {error.message.split("\n")[0]}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

const UniswapV3StakerAbi = [
  {
    type: "function",
    name: "createIncentive",
    inputs: [
      {
        name: "key",
        type: "tuple",
        components: [
          { name: "rewardToken", type: "address" },
          { name: "pool", type: "address" },
          { name: "startTime", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "refundee", type: "address" },
        ],
      },
      { name: "reward", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

function IncentivesTab() {
  const { address } = useAccount();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [rewardAmount, setRewardAmount]  = useState("");

  const stakerAddress = buildData.contractAddresses.uniswapV3Staker as Address;
  const rewardToken = buildData.contractAddresses.sir as Address;
  const pool = buildData.contractAddresses.sirWethPool1Percent as Address;

  // Check owner's SIR balance
  const { data: sirBalance, isLoading: isLoadingBalance } = useReadContract({
    address: rewardToken,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  // Check SIR allowance
  const { data: allowance } = useReadContract({
    address: rewardToken,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, stakerAddress] : undefined,
  });

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const rewardAmountWei = rewardAmount ? parseUnits(rewardAmount, 12) : 0n;
  const needsApproval = allowance !== undefined && allowance < rewardAmountWei;

  const handleApprove = () => {
    writeContract({
      address: rewardToken,
      abi: erc20Abi,
      functionName: "approve",
      args: [stakerAddress, rewardAmountWei],
    });
  };

  const handleCreateIncentive = () => {
    if (!startTime || !endTime || !rewardAmount || !address) return;

    const startTimestamp = BigInt(Math.floor(new Date(startTime).getTime() / 1000));
    const endTimestamp = BigInt(Math.floor(new Date(endTime).getTime() / 1000));

    writeContract({
      address: stakerAddress,
      abi: UniswapV3StakerAbi,
      functionName: "createIncentive",
      args: [
        {
          rewardToken,
          pool,
          startTime: startTimestamp,
          endTime: endTimestamp,
          refundee: address,
        },
        rewardAmountWei,
      ],
    });
  };

  const handleReset = () => {
    reset();
    setStartTime("");
    setEndTime("");
    setRewardAmount("");
  };

  return (
    <div className="border border-foreground/20 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Create Incentive</h2>

      <div className="space-y-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Reward Token:</span>
            <p className="font-mono text-xs break-all">{rewardToken}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Pool:</span>
            <p className="font-mono text-xs break-all">{pool}</p>
          </div>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Your SIR Balance: </span>
          {isLoadingBalance ? (
            <span>...</span>
          ) : (
            <span className="font-mono text-foreground">
              {sirBalance !== undefined
                ? Number(formatUnits(sirBalance, 12)).toLocaleString()
                : "0"} SIR
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-foreground/20 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-foreground/20 rounded-md text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Reward Amount (SIR)</label>
          <input
            type="text"
            value={rewardAmount}
            onChange={(e) => setRewardAmount(e.target.value)}
            placeholder="e.g., 1000000"
            className="w-full px-3 py-2 bg-background border border-foreground/20 rounded-md text-sm font-mono"
          />
        </div>

        {needsApproval ? (
          <Button
            type="button"
            variant="submit"
            onClick={handleApprove}
            disabled={isPending || isConfirming || !rewardAmount}
          >
            {isPending
              ? "Confirm in Wallet..."
              : isConfirming
                ? "Confirming..."
                : "Approve SIR"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="submit"
            onClick={handleCreateIncentive}
            disabled={isPending || isConfirming || !startTime || !endTime || !rewardAmount}
          >
            {isPending
              ? "Confirm in Wallet..."
              : isConfirming
                ? "Confirming..."
                : "Create Incentive"}
          </Button>
        )}

        {isConfirmed && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-md">
            <p className="text-green-500 text-sm">Transaction confirmed!</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
              Hash: {hash}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="mt-2"
            >
              Reset Form
            </Button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
            <p className="text-red-500 text-sm">Transaction failed</p>
            <p className="text-xs text-muted-foreground mt-1 break-all">
              {error.message.split("\n")[0]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
