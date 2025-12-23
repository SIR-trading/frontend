"use client";

import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useWalletClient, usePublicClient } from "wagmi";
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
        <TabsList className="flex gap-6 mb-6 flex-wrap">
          <TabsTrigger value="treasury">Treasury</TabsTrigger>
          <TabsTrigger value="issuances">Vault Issuances</TabsTrigger>
          <TabsTrigger value="oracle">Oracle</TabsTrigger>
          {hasStaker && <TabsTrigger value="incentives">Incentives</TabsTrigger>}
        </TabsList>

        <TabsContent value="treasury">
          <TreasuryTab />
        </TabsContent>

        <TabsContent value="issuances">
          <UpdateVaultsIssuancesForm />
        </TabsContent>

        <TabsContent value="oracle">
          <OracleTab />
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
    inputs: [
      { name: "newOracle", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

function OracleTab() {
  // Current oracle address from build data
  const currentOracle = buildData.contractAddresses.oracle as Address;
  const systemControlAddress = buildData.contractAddresses.systemControl as Address;

  return (
    <div className="space-y-6">
      {/* Current Oracle Info */}
      <div className="border border-foreground/20 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Current Oracle</h2>
        <p className="text-sm text-muted-foreground">Address:</p>
        <p className="font-mono text-xs break-all">{currentOracle}</p>
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

// Oracle contract bytecode (from Core/out/Oracle.sol/Oracle.json)
// Constructor: (address uniswapV3Factory, bytes32 poolInitCodeHash)
const ORACLE_BYTECODE = "0x60c060405234801561000f575f5ffd5b5060405161328c38038061328c83398101604081905261002e91610044565b6001600160a01b0390911660805260a05261007b565b5f5f60408385031215610055575f5ffd5b82516001600160a01b038116811461006b575f5ffd5b6020939093015192949293505050565b60805160a0516131e26100aa5f395f6119ad01525f81816111ac0152818161197901526125f301526131e25ff3fe608060405234801561000f575f5ffd5b506004361061009f575f3560e01c8063ac41865a11610072578063c7dd5c0a11610058578063c7dd5c0a1461016c578063ca4bc9f114610193578063f3209e00146101b3575f5ffd5b8063ac41865a14610131578063bbbe310f14610157575f5ffd5b806304b7ca55146100a3578063485cc955146100ea57806379b00adf146100ff578063879ac8f814610112575b5f5ffd5b6100b66100b13660046127ea565b6101eb565b6040805160079390930b835273ffffffffffffffffffffffffffffffffffffffff9091166020830152015b60405180910390f35b6100fd6100f83660046127ea565b610add565b005b6100fd61010d366004612821565b61114d565b61011b61070881565b60405164ffffffffff90911681526020016100e1565b61014461013f3660046127ea565b611339565b60405160079190910b81526020016100e1565b61015f611595565b6040516100e19190612843565b61017f61017a3660046127ea565b611766565b60405162ffffff90911681526020016100e1565b6101a66101a13660046127ea565b6117b2565b6040516100e191906128a2565b6101c66101c13660046127ea565b611930565b60405173ffffffffffffffffffffffffffffffffffffffff90911681526020016100e1565b5f5f5f5f6101f986866119d8565b73ffffffffffffffffffffffffffffffffffffffff8083165f90815260208181526040808320938516835292815290829020825160e0810184528154600781900b825264ffffffffff68010000000000000000820481168386015260ff6d010000000000000000000000000083048116848801526e0100000000000000000000000000008304811660608501526f01000000000000000000000000000000830490911660808401527401000000000000000000000000000000000000000090910416151560a08201908152845180860190955260019092015462ffffff811685526301000000900460020b9284019290925260c0820192909252905192945090925090610332576040517f4eb0db8f00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b42816020015164ffffffffff1614610a77575f61035784848460c001515f0151611a1a565b9050805f015194507f2057082503b92cc4e796d9307690c1ae83ab6fb24ce5da475c7af2cb162603af8260c001515f01518260400151836060015184608001516040516103e2949392919062ffffff94909416845270ffffffffffffffffffffffffffffffffff92909216602084015264ffffffffff16604083015261ffff16606082015260800190565b60405180910390a1806060015164ffffffffff16600103610481575f815f015173ffffffffffffffffffffffffffffffffffffffff16633850c7bd6040518163ffffffff1660e01b815260040160e060405180830381865afa15801561044a573d5f5f3e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061046e9190612956565b5050505060029190910b60208501525050505b5f61048c838361236a565b90508373ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff167f751600799d4232b751da1b16a16cbaa54e27b2069fe5659d8936eb3a3a8efad783865f01516040516104fe929190911515825260070b602082015260400190565b60405180910390a364ffffffffff4281166020850152608084015161052791610e109116612a0d565b4210610894575f5f836060015164ffffffffff161180156105565750836060015160ff16846040015160ff1614155b156107a6575f6105698560600151612460565b90505f61057a8888845f0151611a1a565b82516040808301516060840151608085015192519495507f2057082503b92cc4e796d9307690c1ae83ab6fb24ce5da475c7af2cb162603af946105f994939062ffffff94909416845270ffffffffffffffffffffffffffffffffff92909216602084015264ffffffffff16604083015261ffff16606082015260800190565b60405180910390a1604081015170ffffffffffffffffffffffffffffffffff161561079a575f610644866040015170ffffffffffffffffffffffffffffffffff168860c001516125aa565b90505f610668836040015170ffffffffffffffffffffffffffffffffff16856125aa565b90508181111561078e57608083015161ffff161561070c57825160808401516040517f32148f6700000000000000000000000000000000000000000000000000000000815261ffff909116600482015273ffffffffffffffffffffffffffffffffffffffff909116906332148f67906024015f604051808303815f87803b1580156106f1575f5ffd5b505af1158015610703573d5f5f3e3d5ffd5b50505050610793565b61070864ffffffffff16836060015164ffffffffff161061078957606088015160ff166040808a019190915260c0890151518551825162ffffff9283168152911660208201527f050d6709031a30cdd3bca5de123ee39fa8c5bdefa6b19d8bfdf5491416addd5d910160405180910390a160c0880184905282519a505b610793565b600194505b505061079f565b600192505b50506107aa565b5060015b8080156107be57505f836080015161ffff16115b1561084b57825160808401516040517f32148f6700000000000000000000000000000000000000000000000000000000815261ffff909116600482015273ffffffffffffffffffffffffffffffffffffffff909116906332148f67906024015f604051808303815f87803b158015610834575f5ffd5b505af1158015610846573d5f5f3e3d5ffd5b505050505b5f600154600461085b9190612a20565b60ff16905080856060015160016108729190612a20565b61087c9190612a66565b60ff166060860152505064ffffffffff421660808401525b505073ffffffffffffffffffffffffffffffffffffffff8084165f908152602081815260408083209386168352928152908290208351815483860151948601516060870151608088015160a0890151151574010000000000000000000000000000000000000000027fffffffffffffffffffffff00ffffffffffffffffffffffffffffffffffffffff64ffffffffff9283166f0150000000000000000000000000000002167fffffffffffffffffffffff000000000000ffffffffffffffffffffffffffffff60ff9485166e010000000000000000000000000000027fffffffffffffffffffffffffffffffffff00ffffffffffffffffffffffffffff959096166d010000000000000000000000000002949094167fffffffffffffffffffffffffffffffffff0000ffffffffffffffffffffffffff93909a1668010000000000000000027fffffffffffffffffffffffffffffffffffffff0000000000000000000000000090961667ffffffffffffffff9097169690961794909417169690961717949094161792909217825560c0830151805160019093018054919092015162ffffff9081166301000000027fffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000909216931692909217919091179055610a8c565b610a8983838360c001515f01516125ed565b93505b8173ffffffffffffffffffffffffffffffffffffffff168773ffffffffffffffffffffffffffffffffffffffff1614610ac6578051610ad1565b8051610ad190612a87565b94505050509250929050565b610ae782826119d8565b73ffffffffffffffffffffffffffffffffffffffff8083165f90815260208181526040808320938516835292815290829020825160e0810184528154600781900b825264ffffffffff68010000000000000000820481168386015260ff6d010000000000000000000000000083048116848801526e0100000000000000000000000000008304811660608501526f01000000000000000000000000000000830490911660808401527401000000000000000000000000000000000000000090910416151560a08201908152845180860190955260019092015462ffffff811685526301000000900460020b9284019290925260c082019290925290519294509092509015610bf457505050565b5f610bfd611595565b80516040805160a0810182525f80825260208201819052918101829052606081018290526080810182905292935090916040805160a0810182525f808252602082018190529181018290526060810182905260808101919091525f5b84811015610db357610c888989888481518110610c7857610c78612ac3565b60200260200101515f0151611a1a565b92507f2057082503b92cc4e796d9307690c1ae83ab6fb24ce5da475c7af2cb162603af868281518110610cbd57610cbd612ac3565b60200260200101515f0151846040015185606001518660800151604051610d22949392919062ffffff94909416845270ffffffffffffffffffffffffffffffffff92909216602084015264ffffffffff16604083015261ffff16606082015260800190565b60405180910390a1604083015170ffffffffffffffffffffffffffffffffff1615610dab575f610d8f846060015164ffffffffff16856040015170ffffffffffffffffffffffffffffffffff1602888481518110610d8257610d82612ac3565b60200260200101516125aa565b905084811115610da95760ff821660408901529350829150835b505b600101610c59565b50825f03610ded576040517f94113d8100000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b8360ff16866040015160010160ff1681610e0957610e09612a39565b0660ff9081166060880152600160a088015260408701518651879291909116908110610e3757610e37612ac3565b602090810291909101015160c087015264ffffffffff421660808088019190915281015161ffff1615610eec57805160808201516040517f32148f6700000000000000000000000000000000000000000000000000000000815261ffff909116600482015273ffffffffffffffffffffffffffffffffffffffff909116906332148f67906024015f604051808303815f87803b158015610ed5575f5ffd5b505af1158015610ee7573d5f5f3e3d5ffd5b505050505b855f5f8a73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8973ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f820151815f015f6101000a81548167ffffffffffffffff021916908360070b67ffffffffffffffff1602179055506020820151815f0160086101000a81548164ffffffffff021916908364ffffffffff1602179055506040820151815f01600d6101000a81548160ff021916908360ff1602179055506060820151815f01600e6101000a81548160ff021916908360ff1602179055506080820151815f01600f6101000a81548164ffffffffff021916908364ffffffffff16021790555060a0820151815f0160146101000a81548160ff02191690831515021790555060c0820151816001015f820151815f015f6101000a81548162ffffff021916908362ffffff1602179055506020820151815f0160036101000a81548162ffffff021916908360020b62ffffff16021790555050509050508673ffffffffffffffffffffffffffffffffffffffff168873ffffffffffffffffffffffffffffffffffffffff167fc358c6596f9b51f4378cf53b7b2a45ddaf005b76af5c24f1e291e4cf1382f0578860c001515f01518460400151856060015160405161113b9392919062ffffff93909316835270ffffffffffffffffffffffffffffffffff91909116602083015264ffffffffff16604082015260600190565b60405180910390a35050505050505050565b5f8162ffffff161161115d575f5ffd5b5f611166611595565b805190915060098110611177575f5ffd5b6040517f22afcccb00000000000000000000000000000000000000000000000000000000815262ffffff841660048201525f907f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff16906322afcccb90602401602060405180830381865afa158015611206573d5f5f3e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061122a9190612af0565b90505f8160020b1361123a575f5ffd5b5f5b8281101561127d5783818151811061125657611256612ac3565b60200260200101515f015162ffffff168562ffffff1603611275575f5ffd5b60010161123c565b50611289600483612b09565b611294906030612b1c565b61129f906008612a0d565b60018054601884901b65ffffff0000001662ffffff88161790921b9091177effffffffffffffffffffffffffffffffffffffffffffffffffffffffffff008116825560ff16906112f0908290612a0d565b6001805491909117905560405162ffffff861681527f37838f2f499547532188da41cb82201ea74862853547fdaf0da38a33bbfe48219060200160405180910390a15050505050565b5f5f5f61134685856119d8565b73ffffffffffffffffffffffffffffffffffffffff8083165f90815260208181526040808320938516835292815290829020825160e0810184528154600781900b825264ffffffffff68010000000000000000820481168386015260ff6d010000000000000000000000000083048116848801526e0100000000000000000000000000008304811660608501526f01000000000000000000000000000000830490911660808401527401000000000000000000000000000000000000000090910416151560a08201908152845180860190955260019092015462ffffff811685526301000000900460020b9284019290925260c082019290925290519294509092509061147f576040517f4eb0db8f00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b42816020015164ffffffffff161461154a575f6114a484848460c001515f0151611a1a565b9050806060015164ffffffffff1660010361153d575f815f015173ffffffffffffffffffffffffffffffffffffffff16633850c7bd6040518163ffffffff1660e01b815260040160e060405180830381865afa158015611506573d5f5f3e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061152a9190612956565b5050505060029190910b60208501525050505b611547828261236a565b50505b8173ffffffffffffffffffffffffffffffffffffffff168673ffffffffffffffffffffffffffffffffffffffff1614611584578051611589565b80515f035b93505050505b92915050565b60015460609060ff81166004810167ffffffffffffffff8111156115bb576115bb612b33565b6040519080825280602002602001820160405280156115ff57816020015b604080518082019091525f80825260208201528152602001906001900390816115d95790505b5092506040518060400160405280606462ffffff168152602001600160020b815250835f8151811061163357611633612ac3565b602002602001018190525060405180604001604052806101f462ffffff168152602001600a60020b8152508360018151811061167157611671612ac3565b60200260200101819052506040518060400160405280610bb862ffffff168152602001603c60020b815250836002815181106116af576116af612ac3565b6020026020010181905250604051806040016040528061271062ffffff16815260200160c860020b815250836003815181106116ed576116ed612ac3565b602090810291909101015280156117615760089190911c905f5b8181101561175f5760405180604001604052808462ffffff168152602001601885901c60020b81525084826004018151811061174557611745612ac3565b602090810291909101015260309290921c91600101611707565b505b505090565b5f61177183836119d8565b73ffffffffffffffffffffffffffffffffffffffff9182165f9081526020818152604080832093909416825291909152206001015462ffffff169392505050565b6117fd6040805160e0810182525f8082526020808301829052828401829052606083018290526080830182905260a0830182905283518085019094528184528301529060c082015290565b8173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1610611834575f5ffd5b5073ffffffffffffffffffffffffffffffffffffffff9182165f90815260208181526040808320939094168252918252829020825160e0810184528154600781900b825264ffffffffff68010000000000000000820481168386015260ff6d010000000000000000000000000083048116848801526e0100000000000000000000000000008304811660608501526f01000000000000000000000000000000830490911660808401527401000000000000000000000000000000000000000090910416151560a0820152835180850190945260019091015462ffffff811684526301000000900460020b9183019190915260c081019190915290565b5f61193b83836119d8565b73ffffffffffffffffffffffffffffffffffffffff8083165f908152602081815260408083209385168352929052206001015491945092506119d1907f0000000000000000000000000000000000000000000000000000000000000000906119ab908690869062ffffff16612625565b7f00000000000000000000000000000000000000000000000000000000000000006126b6565b9392505050565b5f5f8273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff161115611a12579192915b509192909150565b6040805160a0810182525f80825260208201819052918101829052606081018290526080810191909152611a4f8484846125ed565b73ffffffffffffffffffffffffffffffffffffffff168082523b156119d1576040805160028082526060820183525f92602083019080368337019050509050610708815f81518110611aa357611aa3612ac3565b602002602001019063ffffffff16908163ffffffff16815250505f81600181518110611ad157611ad1612ac3565b602002602001019063ffffffff16908163ffffffff1681525050606080835f015173ffffffffffffffffffffffffffffffffffffffff1663883bdbfd846040518263ffffffff1660e01b8152600401611b2a9190612b60565b5f60405180830381865afa925050508015611b8457506040513d5f823e601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0168201604052611b819190810190612c96565b60015b61225057611b90612d67565b806308c379a0036122465750611ba4612d80565b80611baf5750612248565b60408051808201909152600381527f4f4c4400000000000000000000000000000000000000000000000000000000006020918201528151908201207fd30c0d219016dd7e5cf2b2c30c4d7c091820fc329f335b57cab26b9ff3384a9e14611c1957505050506119d1565b5f5f5f875f015173ffffffffffffffffffffffffffffffffffffffff16633850c7bd6040518163ffffffff1660e01b815260040160e060405180830381865afa158015611c68573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190611c8c9190612956565b50508c5160408051600180825281830190925294995092975090955073ffffffffffffffffffffffffffffffffffffffff16935063883bdbfd925060208083019080368337019050506040518263ffffffff1660e01b8152600401611cf19190612b60565b5f60405180830381865afa158015611d0b573d5f5f3e3d5ffd5b505050506040513d5f823e601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0168201604052611d509190810190612c96565b80965081975050505f865f81518110611d6b57611d6b612ac3565b602002602001015190505f865f81518110611d8857611d88612ac3565b60200260200101519050600267ffffffffffffffff811115611dac57611dac612b33565b604051908082528060200260200182016040528015611dd5578160200160208202803683370190505b50604080516002808252606082018352929a5091906020830190803683370190505096508188600181518110611e0d57611e0d612ac3565b602002602001019060060b908160060b815250508087600181518110611e3557611e35612ac3565b602002602001019073ffffffffffffffffffffffffffffffffffffffff16908173ffffffffffffffffffffffffffffffffffffffff16815250505f5f60018661ffff161115611f35578b5173ffffffffffffffffffffffffffffffffffffffff1663252c09d787611ea78a6001612e40565b611eb19190612e5a565b6040517fffffffff0000000000000000000000000000000000000000000000000000000060e084901b16815261ffff9091166004820152602401608060405180830381865afa158015611f06573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190611f2a9190612e7d565b919650945090925090505b80611fdf578b516040517f252c09d70000000000000000000000000000000000000000000000000000000081525f600482015273ffffffffffffffffffffffffffffffffffffffff9091169063252c09d790602401608060405180830381865afa158015611fa5573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190611fc99190612e7d565b5090955093509150611fdc876001612e40565b95505b50611ff063ffffffff821642612b09565b8a5f8151811061200257612002612ac3565b602002602001019063ffffffff16908163ffffffff1681525050895f8151811061202e5761202e612ac3565b602002602001015163ffffffff165f03612126578a5f015173ffffffffffffffffffffffffffffffffffffffff16631a6865026040518163ffffffff1660e01b8152600401602060405180830381865afa15801561208e573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906120b29190612eda565b6fffffffffffffffffffffffffffffffff1660408c018190525f036120d957600160408c01525b600160608c018190526120ed81603c612f09565b6120f79190612f26565b612102906001612e40565b61210d906001612e40565b61ffff1660808c0152506119d198505050505050505050565b5f8a5f8151811061213957612139612ac3565b602002602001015163ffffffff16600161070864ffffffffff168861ffff166121629190612b1c565b61216c9190612b09565b6121769190612f4f565b612181906001612a0d565b90508461ffff168111156121c557600161219c81603c612f09565b6121a69190612f26565b6121b1906001612e40565b6121bb9086612e40565b61ffff1660808d01525b838a5f815181106121d8576121d8612ac3565b602002602001019060060b908160060b8152505082895f815181106121ff576121ff612ac3565b602002602001019073ffffffffffffffffffffffffffffffffffffffff16908173ffffffffffffffffffffffffffffffffffffffff16815250505050505050505050612256565b505b3d5f5f3e3d5ffd5b90925090505b805f8151811061226857612268612ac3565b60200260200101518160018151811061228357612283612ac3565b60200260200101516122959190612f62565b6080845f815181106122a9576122a9612ac3565b602002602001015163ffffffff1673ffffffffffffffffffffffffffffffffffffffff16901b6122d99190612f8e565b70ffffffffffffffffffffffffffffffffff166040850152815182905f9061230357612303612ac3565b60200260200101518260018151811061231e5761231e612ac3565b60200260200101516123309190612fd5565b60060b6020850152825183905f9061234a5761234a612ac3565b602090810291909101015163ffffffff1660608501525050509392505050565b5f5f602a836020015160060b901b90506001836060015164ffffffffff1611156123a75760608301516123a49064ffffffffff168261301a565b90505b836020015164ffffffffff165f036123c557600781900b8452612459565b60208401515f9065040000000000906123e59064ffffffffff1642612b09565b6123ef9190613081565b855190915061240290829060070b6130cc565b8213156124295780855f0181815161241a91906130eb565b60070b90525060019250612457565b845160070b61243882846130cc565b121561244f5780855f0181815161241a9190613131565b600782900b85525b505b5092915050565b604080518082019091525f80825260208201528160ff165f0361249757505060408051808201909152606481526001602082015290565b8160ff166001036124bd575050604080518082019091526101f48152600a602082015290565b8160ff166002036124e357505060408051808201909152610bb88152603c602082015290565b8160ff1660030361250957505060408051808201909152612710815260c8602082015290565b60015460ff811661251b816004612a0d565b8460ff1610612556576040517fd8463cb800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b612561600485613177565b61256c906030613190565b612577906008612a20565b6040805180820190915260ff919091169290921c62ffffff8116835260181c60020b60208301525092915050565b919050565b5f816020015162ffffff1660016048845f015162ffffff16866125cd9190612b1c565b6125d892911b612b09565b6125e29190612f4f565b6119d1906001612a0d565b5f61261d7f00000000000000000000000000000000000000000000000000000000000000006119ab868686612625565b949350505050565b604080516060810182525f80825260208201819052918101919091528273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff161115612679579192915b506040805160608101825273ffffffffffffffffffffffffffffffffffffffff948516815292909316602083015262ffffff169181019190915290565b5f826020015173ffffffffffffffffffffffffffffffffffffffff16835f015173ffffffffffffffffffffffffffffffffffffffff16106126f5575f5ffd5b508151602080840151604094850151855173ffffffffffffffffffffffffffffffffffffffff94851681850152939091168386015262ffffff166060808401919091528451808403820181526080840186528051908301207fff0000000000000000000000000000000000000000000000000000000000000060a085015295901b7fffffffffffffffffffffffffffffffffffffffff0000000000000000000000001660a183015260b582019490945260d5808201929092528251808203909201825260f501909152805191012090565b73ffffffffffffffffffffffffffffffffffffffff811681146127e7575f5ffd5b50565b5f5f604083850312156127fb575f5ffd5b8235612806816127c6565b91506020830135612816816127c6565b809150509250929050565b5f60208284031215612831575f5ffd5b813562ffffff811681146119d1575f5ffd5b602080825282518282018190525f918401906040840190835b8181101561289757612881838551805162ffffff16825260209081015160020b910152565b602093909301926040929092019160010161285c565b509095945050505050565b5f61010082019050825160070b825264ffffffffff602084015116602083015260ff604084015116604083015260ff606084015116606083015264ffffffffff608084015116608083015260a083015161290060a084018215159052565b5060c083015161245960c0840182805162ffffff16825260209081015160020b910152565b8051600281900b81146125a5575f5ffd5b805161ffff811681146125a5575f5ffd5b805180151581146125a5575f5ffd5b5f5f5f5f5f5f5f60e0888a03121561296c575f5ffd5b8751612977816127c6565b965061298560208901612925565b955061299360408901612936565b94506129a160608901612936565b93506129af60808901612936565b925060a088015160ff811681146129c4575f5ffd5b91506129d260c08901612947565b905092959891949750929550565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b8082018082111561158f5761158f6129e0565b60ff818116838216019081111561158f5761158f6129e0565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601260045260245ffd5b5f60ff831680612a7857612a78612a39565b8060ff84160691505092915050565b5f8160070b7fffffffffffffffffffffffffffffffffffffffffffffffff80000000000000008103612abb57612abb6129e0565b5f0392915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52603260045260245ffd5b5f60208284031215612b00575f5ffd5b6119d182612925565b8181038181111561158f5761158f6129e0565b808202811582820484141761158f5761158f6129e0565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b602080825282518282018190525f918401906040840190835b8181101561289757835163ffffffff16835260209384019390920191600101612b79565b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f830116810181811067ffffffffffffffff82111715612be157612be1612b33565b6040525050565b5f67ffffffffffffffff821115612c0157612c01612b33565b5060051b60200190565b8051600681900b81146125a5575f5ffd5b5f82601f830112612c2b575f5ffd5b8151612c3681612be8565b604051612c438282612b9d565b80915082815260208101915060208360051b860101925085831115612c66575f5ffd5b602085015b83811015612c8c578051612c7e816127c6565b835260209283019201612c6b565b5095945050505050565b5f5f60408385031215612ca7575f5ffd5b825167ffffffffffffffff811115612cbd575f5ffd5b8301601f81018513612ccd575f5ffd5b8051612cd881612be8565b604051612ce58282612b9d565b80915082815260208101915060208360051b850101925087831115612d08575f5ffd5b6020840193505b82841015612d3157612d2084612c0b565b825260209384019390910190612d0f565b80955050505050602083015167ffffffffffffffff811115612d51575f5ffd5b612d5d85828601612c1c565b9150509250929050565b5f60033d1115612d7d5760045f5f3e505f5160e01c5b90565b5f60443d1015612d8d5790565b6040517ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc3d016004823e80513d602482011167ffffffffffffffff82111715612dd557505090565b808201805167ffffffffffffffff811115612df1575050505090565b7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc3d8501016020828401011115612e29575050505090565b612e3860208285010185612b9d565b509392505050565b61ffff818116838216019081111561158f5761158f6129e0565b5f61ffff831680612e6d57612e6d612a39565b8061ffff84160691505092915050565b5f5f5f5f60808587031215612e90575f5ffd5b845163ffffffff81168114612ea3575f5ffd5b9350612eb160208601612c0b565b92506040850151612ec1816127c6565b9150612ecf60608601612947565b905092959194509250565b5f60208284031215612eea575f5ffd5b81516fffffffffffffffffffffffffffffffff811681146119d1575f5ffd5b64ffffffffff828116828216039081111561158f5761158f6129e0565b5f64ffffffffff831680612f3c57612f3c612a39565b8064ffffffffff84160491505092915050565b5f82612f5d57612f5d612a39565b500490565b73ffffffffffffffffffffffffffffffffffffffff828116828216039081111561158f5761158f6129e0565b5f73ffffffffffffffffffffffffffffffffffffffff831680612fb357612fb3612a39565b8073ffffffffffffffffffffffffffffffffffffffff84160491505092915050565b600682810b9082900b037fffffffffffffffffffffffffffffffffffffffffffffffffff800000000000008112667fffffffffffff8213171561158f5761158f6129e0565b5f8261302857613028612a39565b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff83147f80000000000000000000000000000000000000000000000000000000000000008314161561307c5761307c6129e0565b500590565b8082025f82127f8000000000000000000000000000000000000000000000000000000000000000841416156130b8576130b86129e0565b818105831482151761158f5761158f6129e0565b8082018281125f831280158216821582161715612457576124576129e0565b600781810b9083900b01677fffffffffffffff81137fffffffffffffffffffffffffffffffffffffffffffffffff80000000000000008212171561158f5761158f6129e0565b600782810b9082900b037fffffffffffffffffffffffffffffffffffffffffffffffff80000000000000008112677fffffffffffffff8213171561158f5761158f6129e0565b60ff828116828216039081111561158f5761158f6129e0565b60ff8181168382160290811690818114612459576124596129e056fea26469706673582212206e1fafafd277a300d773a04ecd34f446d4945eee6fb5d8df7908f25738f6bcc064736f6c634300081c0033";

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
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } =
    useWaitForTransactionReceipt({ hash });

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!factoryAddress || !poolInitCodeHash || !walletClient || !publicClient) return;

    setIsPending(true);
    setError(null);

    try {
      // Deploy the contract using walletClient.deployContract
      const txHash = await walletClient.deployContract({
        abi: OracleConstructorAbi,
        bytecode: ORACLE_BYTECODE,
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
    <div className="border border-foreground/20 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-2">1. Deploy New Oracle</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Deploy a new Oracle contract pointing to a different Uniswap V3 factory.
      </p>

      <form onSubmit={handleDeploy} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Uniswap V3 Factory Address
          </label>
          <input
            type="text"
            value={factoryAddress}
            onChange={(e) => setFactoryAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 bg-background border border-foreground/20 rounded-md text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Pool Init Code Hash
          </label>
          <input
            type="text"
            value={poolInitCodeHash}
            onChange={(e) => setPoolInitCodeHash(e.target.value)}
            placeholder="0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54"
            className="w-full px-3 py-2 bg-background border border-foreground/20 rounded-md text-sm font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">
            The init code hash used by the factory to compute pool addresses
          </p>
        </div>

        <Button
          type="submit"
          variant="submit"
          disabled={isPending || isConfirming || !factoryAddress || !poolInitCodeHash}
        >
          {isPending
            ? "Confirm in Wallet..."
            : isConfirming
              ? "Deploying..."
              : "Deploy Oracle"}
        </Button>

        {isConfirmed && receipt?.contractAddress && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-md">
            <p className="text-green-500 text-sm">Oracle deployed!</p>
            <p className="text-xs text-muted-foreground mt-1">
              New Oracle Address:
            </p>
            <p className="font-mono text-xs break-all text-foreground">
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
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
            <p className="text-red-500 text-sm">Deployment failed</p>
            <p className="text-xs text-muted-foreground mt-1 break-all">
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

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
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
    <div className="border border-foreground/20 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-2">2. Initialize Oracle</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Initialize token pairs in the Oracle. Call this for each vault&apos;s collateral/debt token pair.
      </p>

      <form onSubmit={handleInitialize} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Oracle Address
          </label>
          <input
            type="text"
            value={oracleAddress}
            onChange={(e) => setOracleAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 bg-background border border-foreground/20 rounded-md text-sm font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Token A</label>
            <input
              type="text"
              value={tokenA}
              onChange={(e) => setTokenA(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-background border border-foreground/20 rounded-md text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Token B</label>
            <input
              type="text"
              value={tokenB}
              onChange={(e) => setTokenB(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-background border border-foreground/20 rounded-md text-sm font-mono"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="submit"
          disabled={isPending || isConfirming || !oracleAddress || !tokenA || !tokenB}
        >
          {isPending
            ? "Confirm in Wallet..."
            : isConfirming
              ? "Confirming..."
              : "Initialize Pair"}
        </Button>

        {isConfirmed && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-md">
            <p className="text-green-500 text-sm">Pair initialized!</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
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
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
            <p className="text-red-500 text-sm">Initialization failed</p>
            <p className="text-xs text-muted-foreground mt-1 break-all">
              {error.message.split("\n")[0]}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

function SetOracleForm({ systemControlAddress }: { systemControlAddress: Address }) {
  const [newOracleAddress, setNewOracleAddress] = useState("");

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
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
    <div className="border border-foreground/20 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-2">3. Set Oracle in SystemControl</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Update the Vault to use the new Oracle. Only works when system is NOT in Unstoppable mode.
      </p>

      <form onSubmit={handleSetOracle} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            New Oracle Address
          </label>
          <input
            type="text"
            value={newOracleAddress}
            onChange={(e) => setNewOracleAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 bg-background border border-foreground/20 rounded-md text-sm font-mono"
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
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-md">
            <p className="text-green-500 text-sm">Oracle updated!</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
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
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
            <p className="text-red-500 text-sm">Failed to set oracle</p>
            <p className="text-xs text-muted-foreground mt-1 break-all">
              {error.message.split("\n")[0]}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
