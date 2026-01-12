"use client";

import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useWalletClient,
  usePublicClient,
} from "wagmi";
import {
  SystemControlContract,
  SYSTEM_CONTROL_OWNER,
} from "@/contracts/systemControl";
import { SirContract } from "@/contracts/sir";
import { TreasuryAbi } from "@/contracts/treasury";
import { erc20Abi } from "viem";
import { useState, useEffect, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  encodeFunctionData,
  parseUnits,
  formatUnits,
  type Address,
} from "viem";
import buildData from "@/../public/build-data.json";
import { api } from "@/trpc/react";
import { env } from "@/env";

// Check if LP Lock Time feature is available (not on Ethereum or HyperEVM)
const CHAIN_ID = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
const hasLpLockTimeFeature = CHAIN_ID !== 1 && CHAIN_ID !== 998 && CHAIN_ID !== 999;

export default function AdminPage() {
  const { address, isConnected } = useAccount();

  const isOwner =
    isConnected &&
    address?.toLowerCase() === SYSTEM_CONTROL_OWNER.toLowerCase();

  if (!isConnected) {
    return (
      <div className="p-8">
        <h1 className="mb-4 text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">
          Connect your wallet to continue.
        </p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="p-8">
        <h1 className="mb-4 text-2xl font-bold">Admin Panel</h1>
        <p className="text-red-500">
          Access denied. Only the SystemControl owner can access this page.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Connected: {address}
        </p>
        <p className="text-sm text-muted-foreground">
          Required: {SYSTEM_CONTROL_OWNER}
        </p>
      </div>
    );
  }

  const hasStaker =
    buildData.contractAddresses.uniswapV3Staker !==
    "0x0000000000000000000000000000000000000000";

  return (
    <div className="w-full max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Admin Panel</h1>

      <Tabs defaultValue="treasury">
        <TabsList className="mb-6 flex flex-wrap gap-6">
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="treasury">Treasury</TabsTrigger>
          <TabsTrigger value="issuances">Vault Issuances</TabsTrigger>
          <TabsTrigger value="oracle">Oracle</TabsTrigger>
          <TabsTrigger value="assistant">Assistant</TabsTrigger>
          {hasStaker && (
            <TabsTrigger value="incentives">Incentives</TabsTrigger>
          )}
          {hasLpLockTimeFeature && (
            <TabsTrigger value="lplocktime">LP Lock Time</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="contracts">
          <ContractsTab />
        </TabsContent>

        <TabsContent value="treasury">
          <TreasuryTab />
        </TabsContent>

        <TabsContent value="issuances">
          <UpdateVaultsIssuancesForm />
        </TabsContent>

        <TabsContent value="oracle">
          <OracleTab />
        </TabsContent>

        <TabsContent value="assistant">
          <AssistantTab />
        </TabsContent>

        {hasStaker && (
          <TabsContent value="incentives">
            <IncentivesTab />
          </TabsContent>
        )}

        {hasLpLockTimeFeature && (
          <TabsContent value="lplocktime">
            <LpLockTimeTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

const CONTRACT_LABELS: Record<string, string> = {
  assistant: "Assistant",
  vault: "Vault",
  sir: "SIR Token",
  systemControl: "System Control",
  systemControlOwner: "System Control Owner",
  oracle: "Oracle",
  uniswapV3Staker: "Uniswap V3 Staker",
  nftPositionManager: "NFT Position Manager",
  sirWethPool1Percent: "SIR/WETH Pool (1%)",
  contributors: "Contributors",
};

function ContractsTab() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopy = useCallback(async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 1500);
  }, []);

  const contracts = Object.entries(buildData.contractAddresses);

  return (
    <div className="rounded-lg border border-foreground/20 p-6">
      <h2 className="mb-4 text-lg font-semibold">Contract Addresses</h2>
      <div className="space-y-3">
        {contracts.map(([key, address]) => {
          const isZeroAddress =
            address === "0x0000000000000000000000000000000000000000";
          return (
            <div key={key} className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {CONTRACT_LABELS[key] ?? key}
                </p>
                <p
                  className={`break-all font-mono text-xs ${isZeroAddress ? "text-muted-foreground" : ""}`}
                >
                  {isZeroAddress ? "Not deployed" : address}
                </p>
              </div>
              {!isZeroAddress && (
                <button
                  onClick={() => handleCopy(address)}
                  className="flex-shrink-0 rounded p-2 transition-colors hover:bg-foreground/10"
                  title="Copy address"
                >
                  {copiedAddress === address ? (
                    <Check className="text-green-500 h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4 text-foreground/60" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TreasuryTab() {
  const [treasuryAddress, setTreasuryAddress] = useState("");
  const isValidTreasuryAddress = treasuryAddress.match(/^0x[a-fA-F0-9]{40}$/);

  return (
    <div className="space-y-6">
      {/* Treasury Address */}
      <div className="rounded-lg border border-foreground/20 p-6">
        <h2 className="mb-4 text-lg font-semibold">Treasury Address</h2>
        <input
          type="text"
          value={treasuryAddress}
          onChange={(e) => setTreasuryAddress(e.target.value)}
          placeholder="0x..."
          className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 font-mono text-sm"
        />
        {isValidTreasuryAddress && (
          <TreasurySirBalance treasuryAddress={treasuryAddress as Address} />
        )}
        {!isValidTreasuryAddress && (
          <p className="mt-1 text-xs text-muted-foreground">
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

  const formattedBalance =
    balance !== undefined ? formatUnits(balance, 12) : "0";

  return (
    <p className="mt-1 text-sm text-muted-foreground">
      Balance:{" "}
      {isLoading ? (
        "..."
      ) : (
        <span className="font-mono text-foreground">
          {Number(formattedBalance).toLocaleString()} SIR
        </span>
      )}
    </p>
  );
}

function TreasuryMintForm({ treasuryAddress }: { treasuryAddress: Address }) {
  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();
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
    <div className="rounded-lg border border-foreground/20 p-6">
      <h2 className="mb-4 text-lg font-semibold">Mint SIR Allocation</h2>
      <p className="mb-4 text-sm text-muted-foreground">
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
        <div className="bg-green-500/10 border-green-500/30 mt-4 rounded-md border p-3">
          <p className="text-green-500 text-sm">Transaction confirmed!</p>
          <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
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
        <div className="bg-red-500/10 border-red-500/30 mt-4 rounded-md border p-3">
          <p className="text-red-500 text-sm">Transaction failed</p>
          <p className="mt-1 break-all text-xs text-muted-foreground">
            {error.message.split("\n")[0]}
          </p>
        </div>
      )}
    </div>
  );
}

function TreasuryTransferForm({
  treasuryAddress,
}: {
  treasuryAddress: Address;
}) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();
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
    <div className="rounded-lg border border-foreground/20 p-6">
      <h2 className="mb-4 text-lg font-semibold">Transfer SIR</h2>
      <form onSubmit={handleTransfer} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 font-mono text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Amount (SIR)</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 1000"
            className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 font-mono text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
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
          <div className="bg-green-500/10 border-green-500/30 rounded-md border p-3">
            <p className="text-green-500 text-sm">Transaction confirmed!</p>
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
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
          <div className="bg-red-500/10 border-red-500/30 rounded-md border p-3">
            <p className="text-red-500 text-sm">Transaction failed</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">
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

  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Fetch active vaults via TRPC
  const { data: activeVaults, isLoading: isLoadingVaults } =
    api.vault.getActiveIssuanceVaults.useQuery();

  // Pre-populate oldVaults when data is loaded (convert hex IDs to decimal)
  useEffect(() => {
    if (activeVaults && activeVaults.length > 0) {
      const vaultIds = activeVaults.map((v) => {
        // Convert hex string to decimal number
        const hexId = v.id.startsWith("0x") ? v.id : `0x${v.id}`;
        return BigInt(hexId).toString();
      }).join(", ");
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
    <div className="rounded-lg border border-foreground/20 p-6">
      <h2 className="mb-4 text-lg font-semibold">Update Vaults Issuances</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Old Vaults (uint48[], comma-separated)
          </label>
          <input
            type="text"
            value={isLoadingVaults ? "Loading..." : oldVaults}
            onChange={(e) => setOldVaults(e.target.value)}
            placeholder="e.g., 1, 2, 3"
            className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 font-mono text-sm"
            disabled={isLoadingVaults}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Auto-populated with vaults currently receiving issuance (tax &gt; 0)
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            New Vaults (uint48[], comma-separated)
          </label>
          <input
            type="text"
            value={newVaults}
            onChange={(e) => setNewVaults(e.target.value)}
            placeholder="e.g., 4, 5, 6"
            className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 font-mono text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Vault IDs to add to issuance
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            New Taxes (uint8[], comma-separated)
          </label>
          <input
            type="text"
            value={newTaxes}
            onChange={(e) => setNewTaxes(e.target.value)}
            placeholder="e.g., 50, 100, 150"
            className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 font-mono text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
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
          <div className="bg-green-500/10 border-green-500/30 rounded-md border p-3">
            <p className="text-green-500 text-sm">Transaction confirmed!</p>
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
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
          <div className="bg-red-500/10 border-red-500/30 rounded-md border p-3">
            <p className="text-red-500 text-sm">Transaction failed</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">
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
  const [rewardAmount, setRewardAmount] = useState("");

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

  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();
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

    const startTimestamp = BigInt(
      Math.floor(new Date(startTime).getTime() / 1000),
    );
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
    <div className="rounded-lg border border-foreground/20 p-6">
      <h2 className="mb-4 text-lg font-semibold">Create Incentive</h2>

      <div className="mb-4 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Reward Token:</span>
            <p className="break-all font-mono text-xs">{rewardToken}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Pool:</span>
            <p className="break-all font-mono text-xs">{pool}</p>
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
                : "0"}{" "}
              SIR
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">End Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Reward Amount (SIR)
          </label>
          <input
            type="text"
            value={rewardAmount}
            onChange={(e) => setRewardAmount(e.target.value)}
            placeholder="e.g., 1000000"
            className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 font-mono text-sm"
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
            disabled={
              isPending ||
              isConfirming ||
              !startTime ||
              !endTime ||
              !rewardAmount
            }
          >
            {isPending
              ? "Confirm in Wallet..."
              : isConfirming
                ? "Confirming..."
                : "Create Incentive"}
          </Button>
        )}

        {isConfirmed && (
          <div className="bg-green-500/10 border-green-500/30 rounded-md border p-3">
            <p className="text-green-500 text-sm">Transaction confirmed!</p>
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
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
          <div className="bg-red-500/10 border-red-500/30 rounded-md border p-3">
            <p className="text-red-500 text-sm">Transaction failed</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              {error.message.split("\n")[0]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Oracle ABI for initialize function
const OracleAbi = [
  {
    type: "function",
    name: "initialize",
    inputs: [
      { name: "tokenA", type: "address", internalType: "address" },
      { name: "tokenB", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

// SystemControl ABI for setOracle function
const SystemControlSetOracleAbi = [
  {
    type: "function",
    name: "setOracle",
    inputs: [{ name: "newOracle", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

function OracleTab() {
  // Current oracle address from build data
  const currentOracle = buildData.contractAddresses.oracle as Address;
  const systemControlAddress = buildData.contractAddresses
    .systemControl as Address;

  return (
    <div className="space-y-6">
      {/* Current Oracle Info */}
      <div className="rounded-lg border border-foreground/20 p-6">
        <h2 className="mb-4 text-lg font-semibold">Current Oracle</h2>
        <p className="text-sm text-muted-foreground">Address:</p>
        <p className="break-all font-mono text-xs">{currentOracle}</p>
      </div>

      {/* Step 1: Deploy Oracle */}
      <DeployOracleForm />

      {/* Step 2: Initialize Oracle */}
      <InitializeOracleForm />

      {/* Step 3: Set Oracle in SystemControl */}
      <SetOracleForm systemControlAddress={systemControlAddress} />
    </div>
  );
}

// Oracle constructor ABI for deployment
const OracleConstructorAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "uniswapV3Factory", type: "address" },
      { name: "poolInitCodeHash", type: "bytes32" },
    ],
  },
  ...OracleAbi,
] as const;

function DeployOracleForm() {
  const [factoryAddress, setFactoryAddress] = useState("");
  const [poolInitCodeHash, setPoolInitCodeHash] = useState("");
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash });

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!factoryAddress || !poolInitCodeHash || !walletClient || !publicClient)
      return;

    setIsPending(true);
    setError(null);

    try {
      // Fetch bytecode on-demand from full contract JSON
      const response = await fetch("/data/Oracle.json");
      if (!response.ok) {
        throw new Error("Failed to fetch Oracle contract");
      }
      const contract = (await response.json()) as {
        bytecode: { object: `0x${string}` };
      };
      const bytecode = contract.bytecode.object;

      // Deploy the contract using walletClient.deployContract
      const txHash = await walletClient.deployContract({
        abi: OracleConstructorAbi,
        bytecode,
        args: [factoryAddress as Address, poolInitCodeHash as `0x${string}`],
        gas: 150_000_000n,
      });
      setHash(txHash);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Deployment failed"));
    } finally {
      setIsPending(false);
    }
  };

  const handleReset = () => {
    setHash(undefined);
    setError(null);
    setFactoryAddress("");
    setPoolInitCodeHash("");
  };

  return (
    <div className="rounded-lg border border-foreground/20 p-6">
      <h2 className="mb-2 text-lg font-semibold">1. Deploy New Oracle</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Deploy a new Oracle contract pointing to a different Uniswap V3 factory.
      </p>

      <form onSubmit={handleDeploy} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Uniswap V3 Factory Address
          </label>
          <input
            type="text"
            value={factoryAddress}
            onChange={(e) => setFactoryAddress(e.target.value)}
            placeholder="0x..."
            className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 font-mono text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Pool Init Code Hash
          </label>
          <input
            type="text"
            value={poolInitCodeHash}
            onChange={(e) => setPoolInitCodeHash(e.target.value)}
            placeholder="0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54"
            className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 font-mono text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            The init code hash used by the factory to compute pool addresses
          </p>
        </div>

        <Button
          type="submit"
          variant="submit"
          disabled={
            isPending || isConfirming || !factoryAddress || !poolInitCodeHash
          }
        >
          {isPending
            ? "Confirm in Wallet..."
            : isConfirming
              ? "Deploying..."
              : "Deploy Oracle"}
        </Button>

        {isConfirmed && receipt?.contractAddress && (
          <div className="bg-green-500/10 border-green-500/30 rounded-md border p-3">
            <p className="text-green-500 text-sm">Oracle deployed!</p>
            <p className="mt-1 text-xs text-muted-foreground">
              New Oracle Address:
            </p>
            <p className="break-all font-mono text-xs text-foreground">
              {receipt.contractAddress}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="mt-2"
            >
              Reset
            </Button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border-red-500/30 rounded-md border p-3">
            <p className="text-red-500 text-sm">Deployment failed</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              {error.message.split("\n")[0]}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

function InitializeOracleForm() {
  const [oracleAddress, setOracleAddress] = useState("");
  const [tokenA, setTokenA] = useState("");
  const [tokenB, setTokenB] = useState("");

  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const handleInitialize = (e: React.FormEvent) => {
    e.preventDefault();

    if (!oracleAddress || !tokenA || !tokenB) return;

    writeContract({
      address: oracleAddress as Address,
      abi: OracleAbi,
      functionName: "initialize",
      args: [tokenA as Address, tokenB as Address],
    });
  };

  const handleReset = () => {
    reset();
    setTokenA("");
    setTokenB("");
  };

  return (
    <div className="rounded-lg border border-foreground/20 p-6">
      <h2 className="mb-2 text-lg font-semibold">2. Initialize Oracle</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Initialize token pairs in the Oracle. Call this for each vault&apos;s
        collateral/debt token pair.
      </p>

      <form onSubmit={handleInitialize} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Oracle Address
          </label>
          <input
            type="text"
            value={oracleAddress}
            onChange={(e) => setOracleAddress(e.target.value)}
            placeholder="0x..."
            className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Token A</label>
            <input
              type="text"
              value={tokenA}
              onChange={(e) => setTokenA(e.target.value)}
              placeholder="0x..."
              className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Token B</label>
            <input
              type="text"
              value={tokenB}
              onChange={(e) => setTokenB(e.target.value)}
              placeholder="0x..."
              className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 font-mono text-sm"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="submit"
          disabled={
            isPending || isConfirming || !oracleAddress || !tokenA || !tokenB
          }
        >
          {isPending
            ? "Confirm in Wallet..."
            : isConfirming
              ? "Confirming..."
              : "Initialize Pair"}
        </Button>

        {isConfirmed && (
          <div className="bg-green-500/10 border-green-500/30 rounded-md border p-3">
            <p className="text-green-500 text-sm">Pair initialized!</p>
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
              Hash: {hash}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="mt-2"
            >
              Initialize Another Pair
            </Button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border-red-500/30 rounded-md border p-3">
            <p className="text-red-500 text-sm">Initialization failed</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              {error.message.split("\n")[0]}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

function SetOracleForm({
  systemControlAddress,
}: {
  systemControlAddress: Address;
}) {
  const [newOracleAddress, setNewOracleAddress] = useState("");

  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const handleSetOracle = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newOracleAddress) return;

    writeContract({
      address: systemControlAddress,
      abi: SystemControlSetOracleAbi,
      functionName: "setOracle",
      args: [newOracleAddress as Address],
    });
  };

  const handleReset = () => {
    reset();
    setNewOracleAddress("");
  };

  return (
    <div className="rounded-lg border border-foreground/20 p-6">
      <h2 className="mb-2 text-lg font-semibold">
        3. Set Oracle in SystemControl
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Update the Vault to use the new Oracle. Only works when system is NOT in
        Unstoppable mode.
      </p>

      <form onSubmit={handleSetOracle} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            New Oracle Address
          </label>
          <input
            type="text"
            value={newOracleAddress}
            onChange={(e) => setNewOracleAddress(e.target.value)}
            placeholder="0x..."
            className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 font-mono text-sm"
          />
        </div>

        <Button
          type="submit"
          variant="submit"
          disabled={isPending || isConfirming || !newOracleAddress}
        >
          {isPending
            ? "Confirm in Wallet..."
            : isConfirming
              ? "Confirming..."
              : "Set Oracle"}
        </Button>

        {isConfirmed && (
          <div className="bg-green-500/10 border-green-500/30 rounded-md border p-3">
            <p className="text-green-500 text-sm">Oracle updated!</p>
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
              Hash: {hash}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="mt-2"
            >
              Reset
            </Button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border-red-500/30 rounded-md border p-3">
            <p className="text-red-500 text-sm">Failed to set oracle</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              {error.message.split("\n")[0]}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

function AssistantTab() {
  // Current assistant address from build data
  const currentAssistant = buildData.contractAddresses.assistant as Address;

  return (
    <div className="space-y-6">
      {/* Current Assistant Info */}
      <div className="rounded-lg border border-foreground/20 p-6">
        <h2 className="mb-4 text-lg font-semibold">Current Assistant</h2>
        <p className="text-sm text-muted-foreground">Address:</p>
        <p className="break-all font-mono text-xs">{currentAssistant}</p>
      </div>

      {/* Deploy Assistant */}
      <DeployAssistantForm />
    </div>
  );
}

// Assistant constructor ABI for deployment
const AssistantConstructorAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "vault", type: "address" },
      { name: "oracle", type: "address" },
    ],
  },
] as const;

function DeployAssistantForm() {
  const [vaultAddress, setVaultAddress] = useState("");
  const [oracleAddress, setOracleAddress] = useState("");
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash });

  // Pre-populate with known addresses from build data
  useEffect(() => {
    if (buildData.contractAddresses.vault) {
      setVaultAddress(buildData.contractAddresses.vault);
    }
    if (buildData.contractAddresses.oracle) {
      setOracleAddress(buildData.contractAddresses.oracle);
    }
  }, []);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vaultAddress || !oracleAddress || !walletClient || !publicClient)
      return;

    setIsPending(true);
    setError(null);

    try {
      // Fetch bytecode on-demand from full contract JSON
      const response = await fetch("/data/Assistant.json");
      if (!response.ok) {
        throw new Error("Failed to fetch Assistant contract");
      }
      const contract = (await response.json()) as {
        bytecode: { object: `0x${string}` };
      };
      const bytecode = contract.bytecode.object;

      // Deploy the contract using walletClient.deployContract
      const txHash = await walletClient.deployContract({
        abi: AssistantConstructorAbi,
        bytecode,
        args: [vaultAddress as Address, oracleAddress as Address],
        gas: 350_000_000n,
      });
      setHash(txHash);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Deployment failed"));
    } finally {
      setIsPending(false);
    }
  };

  const handleReset = () => {
    setHash(undefined);
    setError(null);
  };

  return (
    <div className="rounded-lg border border-foreground/20 p-6">
      <h2 className="mb-2 text-lg font-semibold">Deploy New Assistant</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Deploy a new Assistant contract pointing to the Vault and Oracle.
      </p>

      <form onSubmit={handleDeploy} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Vault Address
          </label>
          <input
            type="text"
            value={vaultAddress}
            onChange={(e) => setVaultAddress(e.target.value)}
            placeholder="0x..."
            className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 font-mono text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Pre-populated from build data
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Oracle Address
          </label>
          <input
            type="text"
            value={oracleAddress}
            onChange={(e) => setOracleAddress(e.target.value)}
            placeholder="0x..."
            className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 font-mono text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Pre-populated from build data (update if using a new Oracle)
          </p>
        </div>

        <Button
          type="submit"
          variant="submit"
          disabled={
            isPending || isConfirming || !vaultAddress || !oracleAddress
          }
        >
          {isPending
            ? "Confirm in Wallet..."
            : isConfirming
              ? "Deploying..."
              : "Deploy Assistant"}
        </Button>

        {isConfirmed && receipt?.contractAddress && (
          <div className="bg-green-500/10 border-green-500/30 rounded-md border p-3">
            <p className="text-green-500 text-sm">Assistant deployed!</p>
            <p className="mt-1 text-xs text-muted-foreground">
              New Assistant Address:
            </p>
            <p className="break-all font-mono text-xs text-foreground">
              {receipt.contractAddress}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="mt-2"
            >
              Reset
            </Button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border-red-500/30 rounded-md border p-3">
            <p className="text-red-500 text-sm">Deployment failed</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              {error.message.split("\n")[0]}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

function LpLockTimeTab() {
  // LP_LOCK_TIME may not exist in older build-data.json, default to 0
  const lpLockTime = (buildData.systemParams as { lpLockTime?: number }).lpLockTime ?? 0;

  return (
    <div className="space-y-6">
      {/* Current LP Lock Time Info */}
      <div className="rounded-lg border border-foreground/20 p-6">
        <h2 className="mb-4 text-lg font-semibold">Current LP Lock Time</h2>
        <p className="text-sm text-muted-foreground">Max Lock Duration:</p>
        <p className="font-mono text-lg">
          {lpLockTime} seconds
          <span className="ml-2 text-sm text-muted-foreground">
            ({(lpLockTime / 86400).toFixed(1)} days)
          </span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          This is the maximum lock duration LPs can choose to reduce their
          minting fee. portionLockTime of 255 = full lock (no fee), 0 = no lock
          (full fee).
        </p>
      </div>

      {/* Set LP Lock Time Form */}
      <SetLpLockTimeForm />
    </div>
  );
}

function SetLpLockTimeForm() {
  const [lpLockTimeDays, setLpLockTimeDays] = useState("");

  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!lpLockTimeDays) return;

    // Convert days to seconds
    const lpLockTimeSeconds = Math.floor(parseFloat(lpLockTimeDays) * 86400);

    writeContract({
      ...SystemControlContract,
      functionName: "setLPLockTime",
      args: [lpLockTimeSeconds],
    });
  };

  const handleReset = () => {
    reset();
    setLpLockTimeDays("");
  };

  return (
    <div className="rounded-lg border border-foreground/20 p-6">
      <h2 className="mb-2 text-lg font-semibold">Set LP Lock Time</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Set the maximum lock duration for LP fee reduction. LPs who lock their
        TEA for this duration pay no fee. Shorter locks pay proportionally more.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Lock Time (Days)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={lpLockTimeDays}
            onChange={(e) => setLpLockTimeDays(e.target.value)}
            placeholder="e.g., 30"
            className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 font-mono text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {lpLockTimeDays
              ? `= ${Math.floor(parseFloat(lpLockTimeDays) * 86400)} seconds`
              : "Enter duration in days"}
          </p>
        </div>

        <Button
          type="submit"
          variant="submit"
          disabled={isPending || isConfirming || !lpLockTimeDays}
        >
          {isPending
            ? "Confirm in Wallet..."
            : isConfirming
              ? "Confirming..."
              : "Set LP Lock Time"}
        </Button>

        {isConfirmed && (
          <div className="bg-green-500/10 border-green-500/30 rounded-md border p-3">
            <p className="text-green-500 text-sm">Transaction confirmed!</p>
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
              Hash: {hash}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Note: Changes take effect after a delay. Rebuild the frontend to
              update build-data.json.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="mt-2"
            >
              Reset
            </Button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border-red-500/30 rounded-md border p-3">
            <p className="text-red-500 text-sm">Transaction failed</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              {error.message.split("\n")[0]}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
