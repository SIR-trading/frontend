import React, { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { api } from "@/trpc/react";
import { useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther, formatUnits } from "viem";
import { useClaim } from "../stake/hooks/useClaim";
import TransactionModal from "../shared/transactionModal";
import TransactionSuccess from "../shared/transactionSuccess";

export default function ClaimCard() {
  const [openModal, setOpenModal] = useState(false);

  const { claimData } = useClaim();

  const { isConnected, address } = useAccount();

  const { data: dividends } = api.user.getDividends.useQuery(
    { staker: address },
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
        <TransactionModal.InfoContainer>
          {!isConfirmed && (
            <div>
              <h2>Claim</h2>
              <span>{formatUnits(dividends ?? 0n, 18)} Eth</span>
            </div>
          )}
          {isConfirmed && <TransactionSuccess />}
        </TransactionModal.InfoContainer>
        <TransactionModal.Close setOpen={setOpenModal} />
        <TransactionModal.StatSubmitContainer>
          <TransactionModal.SubmitButton
            isConfirmed={isConfirmed}
            disabled={isPending || isConfirming}
            loading={isPending || isConfirming}
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
      <div className="rounded-md bg-secondary-400 px-2 py-2 text-2xl">
        <h2 className="flex items-center gap-x-1 pb-1 text-sm text-gray-200 ">
          <span>Dividends</span>
        </h2>
        <div className="flex items-center justify-between">
          <h3 className="text-3xl">
            {formatEther(dividends ?? 0n)}
            <span className="text-sm text-gray-500"> ETH</span>
          </h3>
          <Button
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
