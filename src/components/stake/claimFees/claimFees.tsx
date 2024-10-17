import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

import Image from "next/image";
import { useEffect } from "react";
// import GasFeeEstimation from "@/components/shared/gasFeeEstimation";

import { type SimulateContractReturnType } from "viem";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatNumber } from "@/lib/utils";
import TransactionModal from "@/components/shared/transactionModal";
import { TransactionStatus } from "@/components/leverage-liquidity/mintForm/transactionStatus";
import { useState } from "react";
import { isValid } from "zod";

import { api } from "@/trpc/react";
type SimulateReq = SimulateContractReturnType["request"] | undefined;
interface Props {
  ethBalance?: string;
  claimAmount?: string;
  claimSimulate: SimulateReq;
  claimResult: bigint | undefined;
  claimFetching: boolean;
}

const ClaimFees = ({
  ethBalance,
  claimAmount,
  claimSimulate,
  claimResult,
  claimFetching,
}: Props) => {
  const utils = api.useUtils();
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) {
      utils.user.getEthBalance.invalidate().catch((e) => console.log(e));
    }
  }, [isConfirming, isConfirmed, utils.user.getEthBalance]);

  const onSubmit = () => {
    if (claimSimulate && Boolean(claimResult)) {
      writeContract(claimSimulate);
      return;
    }
  };
  const [open, setOpen] = useState(false);
  return (
    <>
      <Card className="">
        <TransactionModal.Root setOpen={setOpen} open={open}>
          <TransactionModal.InfoContainer>
            <TransactionStatus
              waitForSign={isPending}
              showLoading={isConfirming}
            />
            <h2>Amount to Claim</h2>
            <h3>{formatNumber(claimAmount ?? "0")}</h3>
          </TransactionModal.InfoContainer>
          <TransactionModal.StatSubmitContainer>
            <TransactionModal.SubmitButton
              disabled={Boolean(claimSimulate) && Boolean(claimResult)}
              onClick={() => onSubmit()}
              loading={isPending || isConfirming}
            >
              Submit
            </TransactionModal.SubmitButton>
          </TransactionModal.StatSubmitContainer>
        </TransactionModal.Root>
        <h2 className="pb-6 text-center font-lora text-2xl ">Claim</h2>
        <div className=" rounded-md bg-secondary-300 px-3 py-2">
          <div className="py-1 text-sm font-medium leading-none">
            Amount to claim{" "}
          </div>
          <div className="flex justify-between">
            <div className="flex flex-col justify-between">
              <div className="h-10 w-40 rounded-md bg-card text-[28px] ring-offset-background">
                {formatNumber(claimAmount ?? "0")}
              </div>
              {/* <div className="pt-2 text-sm italic text-gray-500">$66.88</div> */}
            </div>
            <div>
              <div className="flex flex-col justify-between gap-y-3">
                <div
                  className={`flex items-center justify-end gap-x-2 rounded-md py-1`}
                >
                  <Image
                    src={
                      "https://raw.githubusercontent.com/fusionxx23/assets/master/blockchains/ethereum/info/logo.png"
                    }
                    alt="sir-logo"
                    width={25}
                    height={25}
                  />
                  <span className="font-medium">ETH</span>
                </div>
                <h2 className="pt-1 text-right text-sm text-[#B6B6C9]">
                  Balance: {formatNumber(ethBalance ?? "0", 6)}
                </h2>
              </div>
            </div>
          </div>
        </div>
        <div className=" mt-[20px] flex flex-col items-center justify-center">
          {address && (
            <Button
              variant={"submit"}
              type="submit"
              className="md:w-full"
              onClick={() => {
                if (claimSimulate && Boolean(claimResult)) {
                  setOpen(true);
                }
              }}
              disabled={!Boolean(claimResult) || claimFetching}
            >
              Claim
            </Button>
          )}
          {!address && (
            <Button
              onClick={() => openConnectModal?.()}
              variant="submit"
              className="md:w-full"
              type="button"
            >
              Connect Wallet
            </Button>
          )}
          {/* <GasFeeEstimation></GasFeeEstimation> */}
        </div>
      </Card>
    </>
  );
};

export default ClaimFees;
