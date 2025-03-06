import React, { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { api } from "@/trpc/react";
import { useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useClaim } from "../stake/hooks/useClaim";
import TransactionModal from "../shared/transactionModal";
import TransactionSuccess from "../shared/transactionSuccess";
import { TransactionStatus } from "../leverage-liquidity/mintForm/transactionStatus";
import { TokenDisplay } from "../ui/token-display";
export default function ClaimCard() {
  const [openModal, setOpenModal] = useState(false);

  const { claimData } = useClaim();

  const { isConnected, address } = useAccount();

  const { data: dividends } = api.user.getUserSirDividends.useQuery(
    { user: address },
    {
      enabled: isConnected,
    },
  );

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isSuccess: isConfirmed, isLoading: isConfirming } =
    useWaitForTransactionReceipt({ hash });
  const isValid = useMemo(() => {
    if (claimData?.request) {
      return { isValid: true, error: null };
    } else {
      return { isValid: false, error: "Error Occured." };
    }
  }, [claimData?.request]);

  const onSubmit = () => {
    if (claimData?.request) {
      writeContract(claimData?.request);
    }
  };

  useEffect(() => {
    if (isConfirmed && !openModal) {
      reset();
    }
  }, [isConfirmed, reset, openModal]);

  return (
    <div className=" border-secondary-300">
      <TransactionModal.Root setOpen={setOpenModal} open={openModal}>
        <TransactionModal.InfoContainer hash={hash} isConfirming={isConfirming}>
          <TransactionStatus
            waitForSign={isPending}
            action="Claim"
            showLoading={isConfirming}
            isConfirmed={isConfirmed}
          />
          {!isConfirmed && (
            <div>
              <h3 className=" space-x-0.5 py-2">
                <TokenDisplay amount={dividends} unitLabel="ETH" />
              </h3>
            </div>
          )}
          {isConfirmed && <TransactionSuccess hash={hash} />}
        </TransactionModal.InfoContainer>
        <TransactionModal.Close setOpen={setOpenModal} />
        <TransactionModal.StatSubmitContainer>
          <TransactionModal.SubmitButton
            isPending={isPending}
            isConfirmed={isConfirmed}
            disabled={isPending || isConfirming}
            loading={isConfirming}
            onClick={() => {
              if (isConfirmed) {
                setOpenModal(false);
              } else {
                onSubmit();
              }
            }}
          >
            Claim
          </TransactionModal.SubmitButton>
        </TransactionModal.StatSubmitContainer>
      </TransactionModal.Root>
      {/* <claimDataModal open={openModal} setOpen={setOpenModal} /> */}
      <div className="rounded-md bg-secondary-600 bg-opacity-40 px-2 py-2 text-2xl">
        <h2 className="flex items-center gap-x-1 pb-1 text-sm text-gray-200 ">
          <span>Your Dividends</span>
        </h2>
        <div className="flex items-center justify-between">
          <TokenDisplay amount={dividends ?? 0n} unitLabel="ETH" />
          <Button
            disabled={dividends === 0n || dividends === undefined}
            onClick={() => {
              if (isValid.isValid) setOpenModal(true);
            }}
            className="py-2"
          >
            Claim
          </Button>
        </div>
      </div>
    </div>
  );
}
