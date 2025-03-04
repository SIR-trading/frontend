import { Button } from "@/components/ui/button";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import React from "react";
import { useAccount } from "wagmi";

const SubmitContext = React.createContext(undefined);

const Root = ({ children }: { children: React.ReactNode }) => {
  return (
    <SubmitContext.Provider value={undefined}>
      <div className=" flex flex-col items-center justify-center gap-y-2 pt-4">
        {children}
      </div>
    </SubmitContext.Provider>
  );
};

const Errors = ({ children }: { children: React.ReactNode }) => {
  const { address } = useAccount();
  return (
    <div className="md:w-[450px]">
      <p className="h-[14px] text-left text-sm text-red-400">
        {/* Don't show form errors if users is not connected. */}
        {address && <>{children}</>}
      </p>
    </div>
  );
};

const ConnectButton = () => {
  const { openConnectModal } = useConnectModal();
  const { address } = useAccount();
  if (address) return undefined;
  return (
    <Button onClick={() => openConnectModal?.()} variant="submit" type="button">
      Connect Wallet
    </Button>
  );
};

const OpenTransactionModalButton = ({
  onClick,
  isValid,
  needsApproval,
}: {
  needsApproval: boolean;
  onClick: () => void;
  isValid: boolean;
}) => {
  const { address } = useAccount();
  if (!address) return undefined;
  return (
    <Button
      disabled={!isValid}
      variant="submit"
      type="button"
      onClick={onClick}
    >
      Calculate
    </Button>
  );
};
const FeeInfo = ({
  feePercent,
  feeAmount,
  feeValue,
  deposit,
  isValid,
}: {
  feeAmount: string | undefined;

  feePercent: string | undefined;
  deposit: string | undefined;
  feeValue: string | undefined;
  isValid: boolean;
}) => {
  if (
    feeValue === "" ||
    deposit === "" ||
    !isFinite(parseFloat(feeAmount ?? ""))
  ) {
    return undefined;
  }
  if (!isValid) return;
  return (
    <div className="w-[450px]  text-gray-200">
      <div className=" justify-between text-[14px]">
        <div className="relative flex w-full justify-between text-[13px]">
          <h3 className="text-gray-300 ">
            <span className="z-20 flex items-center gap-x-1">Fee Percent</span>
          </h3>
          <h4>{feePercent ? feePercent.toString() + "%" : "0%"}</h4>
        </div>
        <div className="relative flex w-full justify-between text-[13px]">
          <h3 className="text-gray-300 ">
            <span className="z-20 flex items-center gap-x-1">Fee Amount</span>
          </h3>
          <h4>{feeAmount ? feeAmount.toString() : "0"}</h4>
        </div>
      </div>
    </div>
  );
};

const MintFormSubmit = {
  Root,
  Errors,
  FeeInfo,
  OpenTransactionModalButton,
  ConnectButton,
};

export default MintFormSubmit;
