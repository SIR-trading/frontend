import React from "react";
import TransactionModal from "./transactionModal";
import { TransactionStatus } from "../leverage-liquidity/mintForm/transactionStatus";
import { CircleCheck } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import Show from "./show";
import ExplorerLink from "./explorerLink";
import { getSirSymbol, getSirLogo } from "@/lib/assets";
import Image from "next/image";
import DisplayFormattedNumber from "./displayFormattedNumber";
import { formatUnits } from "viem";

interface SirClaimModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  unclaimedAmount: bigint | undefined;
  isPending: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  hash: `0x${string}` | undefined;
  claimAndStake: boolean;
  setClaimAndStake: (value: boolean) => void;
  onSubmit: () => void;
  onClose?: () => void;
}

export function SirClaimModal({
  open,
  setOpen,
  unclaimedAmount,
  isPending,
  isConfirming,
  isConfirmed,
  hash,
  claimAndStake,
  setClaimAndStake,
  onSubmit,
  onClose,
}: SirClaimModalProps) {
  const handleClose = (value: boolean) => {
    setOpen(value);
    if (!value && !isConfirmed && onClose) {
      onClose();
    }
  };

  return (
    <TransactionModal.Root
      title={`Claim ${getSirSymbol()}`}
      setOpen={handleClose}
      open={open}
    >
      <TransactionModal.Close setOpen={handleClose} />
      <TransactionModal.InfoContainer isConfirming={isConfirming} hash={hash}>
        {!isConfirmed && (
          <>
            <TransactionStatus
              action="Claim"
              waitForSign={isPending}
              showLoading={isConfirming}
              isConfirmed={isConfirmed}
            />
            <div className="space-y-4 px-6 pb-6 pt-4">
              <div className="pt-2">
                <div className="mb-2">
                  <label className="text-sm text-muted-foreground">Claiming Amount</label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl">
                    <DisplayFormattedNumber
                      num={formatUnits(unclaimedAmount ?? 0n, 12)}
                      significant={undefined}
                    />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl text-muted-foreground">{getSirSymbol()}</span>
                    <Image
                      src={getSirLogo()}
                      alt={getSirSymbol()}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        {isConfirmed && (
          <div className="space-y-2">
            <div className="flex justify-center">
              <CircleCheck size={40} color="hsl(173, 73%, 36%)" />
            </div>
            <h2 className="text-center">Transaction Successful!</h2>
            <ExplorerLink transactionHash={hash} />
          </div>
        )}
      </TransactionModal.InfoContainer>

      <div className="mx-4 border-t border-foreground/10" />
      <TransactionModal.StatSubmitContainer>
        <Show when={!isConfirmed}>
          <div className="flex w-full items-center justify-end gap-x-2 py-2">
            <label htmlFor="stake" className="text-sm text-foreground/80">
              Mint and stake
            </label>
            <Checkbox
              className="border border-foreground bg-foreground/5"
              id="stake"
              checked={claimAndStake}
              onCheckedChange={(value) => {
                setClaimAndStake(Boolean(value));
              }}
            />
          </div>
        </Show>
        <TransactionModal.SubmitButton
          isConfirmed={isConfirmed}
          loading={isConfirming}
          isPending={isPending}
          disabled={isPending || isConfirming}
          onClick={() => onSubmit()}
        >
          Claim
        </TransactionModal.SubmitButton>
      </TransactionModal.StatSubmitContainer>
    </TransactionModal.Root>
  );
}