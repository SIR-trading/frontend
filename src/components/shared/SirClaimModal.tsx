import React from "react";
import TransactionModal from "./transactionModal";
import { TransactionStatus } from "../leverage-liquidity/mintForm/transactionStatus";
import { CircleCheck } from "lucide-react";
import { TokenDisplay } from "../ui/token-display";
import { Checkbox } from "../ui/checkbox";
import Show from "./show";
import ExplorerLink from "./explorerLink";
import { TokenImage } from "./TokenImage";
import { SirContract } from "@/contracts/sir";
import { getSirSymbol } from "@/lib/assets";

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
  title?: string;
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
  title = "Claim Rewards",
}: SirClaimModalProps) {
  const handleClose = (value: boolean) => {
    setOpen(value);
    if (!value && !isConfirmed && onClose) {
      onClose();
    }
  };

  return (
    <TransactionModal.Root
      title={title}
      setOpen={handleClose}
      open={open}
    >
      <TransactionModal.Close setOpen={handleClose} />
      <TransactionModal.InfoContainer isConfirming={isConfirming} hash={hash}>
        <h2 className="text-center text-xl font-semibold mb-4">{title}</h2>
        {!isConfirmed && (
          <>
            {(isPending || isConfirming) && (
              <TransactionStatus
                action="Claim"
                waitForSign={isPending}
                showLoading={isConfirming}
                isConfirmed={isConfirmed}
              />
            )}
            <div className="pt-2">
              <div className="mb-2">
                <label className="text-sm text-foreground/70">Amount</label>
              </div>
              <div className="flex items-center justify-between">
                <TokenDisplay
                  disableRounding
                  amount={unclaimedAmount}
                  decimals={12}
                  unitLabel=""
                  amountSize="large"
                />
                <div className="flex items-center gap-x-2">
                  <span className="text-foreground/70">{getSirSymbol()}</span>
                  <TokenImage
                    address={SirContract.address}
                    width={24}
                    height={24}
                    alt={getSirSymbol()}
                  />
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