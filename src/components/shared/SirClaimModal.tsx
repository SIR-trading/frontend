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
    if (!value && onClose) {
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
        <TransactionStatus
          action="Claim"
          waitForSign={isPending}
          showLoading={isConfirming}
          isConfirmed={isConfirmed}
        />
        {!isConfirmed && (
          <div className="flex items-center justify-center gap-x-2 pt-2">
            <TokenImage
              address={SirContract.address}
              width={24}
              height={24}
              alt="SIR"
            />
            <TokenDisplay
              disableRounding
              amount={unclaimedAmount}
              decimals={12}
              unitLabel="SIR"
            />
          </div>
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
              Claim and Stake
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