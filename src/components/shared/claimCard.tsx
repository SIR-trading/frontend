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
  const utils = api.useUtils();
  useEffect(() => {
    if (isConfirmed && !openModal) {
      reset();
    }
  }, [isConfirmed, reset, openModal, utils.user.getUserSirDividends]);

  useEffect(() => {
    if (isConfirmed)
      utils.user.getUserSirDividends.invalidate().catch((e) => console.log(e));
  }, [isConfirmed, utils.user.getUserSirDividends]);
  return (
    <div className=" border-secondary-300">
      <TransactionModal.Root setOpen={setOpenModal} open={openModal}>
        <TransactionModal.InfoContainer>
          {!isConfirmed && (
            <div>
              <h2>Claim</h2>
              <TokenDisplay
                disableRounding
                amount={dividends}
                unitLabel="ETH"
              />
              {/* <span>{formatUnits(dividends ?? 0n, 18)} Eth</span> */}
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
      <div className="rounded-md bg-secondary-600/40 px-2 py-2 text-2xl">
        <h2 className="flex items-center gap-x-1 pb-1 text-sm text-gray-200 ">
          <span>Dividends</span>
        </h2>
        <div className="flex items-center justify-between">
          <TokenDisplay amount={dividends ?? 0n} unitLabel={"ETH"} />
          <Button
            disabled={!dividends || !isValid.isValid}
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
