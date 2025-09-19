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
import Show from "./show";
import { getNativeCurrencySymbol } from "@/lib/chains";
import DisplayFormattedNumber from "./displayFormattedNumber";
import { formatUnits } from "viem";
import { WRAPPED_NATIVE_TOKEN_ADDRESS } from "@/data/constants";
import { TokenImage } from "./TokenImage";

export default function ClaimCard() {
  const [openModal, setOpenModal] = useState(false);

  const { claimData } = useClaim();

  const { isConnected, address } = useAccount();

  const { data: dividends, isLoading: dividendsLoading } = api.user.getUserSirDividends.useQuery(
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
      <TransactionModal.Root
        title={`Claim ${getNativeCurrencySymbol()}`}
        setOpen={setOpenModal}
        open={openModal}
      >
        <TransactionModal.Close setOpen={setOpenModal} />
        <TransactionModal.InfoContainer isConfirming={isConfirming} hash={hash}>
          {!isConfirmed && (
            <div className="space-y-4 px-6 pb-6 pt-4">
              <div className="pt-2">
                <div className="mb-2">
                  <label className="text-sm text-muted-foreground">Claiming Amount</label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl">
                    <DisplayFormattedNumber
                      num={formatUnits(dividends ?? 0n, 18)}
                      significant={3}
                    />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl text-muted-foreground">{getNativeCurrencySymbol()}</span>
                    <TokenImage
                      address={WRAPPED_NATIVE_TOKEN_ADDRESS}
                      alt={getNativeCurrencySymbol()}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {isConfirmed && <TransactionSuccess hash={hash} />}
        </TransactionModal.InfoContainer>
        <div className="mx-4 border-t border-foreground/10" />
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
      <div className="rounded-md bg-primary/5 p-2 pb-2 dark:bg-primary">
        <div className="flex justify-between rounded-md text-2xl">
          <div className="flex gap-x-2">
            <div className="flex w-full justify-between">
              <div>
                <h2 className="pb-1 text-sm text-muted-foreground">
                  Dividends
                </h2>
                <div className="flex justify-between text-3xl">
                  <div className="flex items-end gap-x-1">
                    <Show 
                      when={isConnected && !dividendsLoading} 
                      fallback={
                        isConnected ? (
                          <div className="h-8 w-20 bg-foreground/10 rounded animate-pulse"></div>
                        ) : (
                          <div className="text-sm text-foreground italic">
                            Connect to claim dividends
                          </div>
                        )
                      }
                    >
                      <TokenDisplay amount={dividends ?? 0n} unitLabel={getNativeCurrencySymbol()} />
                    </Show>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-end">
            <Button
              disabled={!isConnected || !dividends || !isValid.isValid}
              onClick={() => {
                if (isValid.isValid) setOpenModal(true);
              }}
              className="py-2 w-20"
            >
              Claim
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
