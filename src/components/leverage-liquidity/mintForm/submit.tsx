import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { Button } from "@/components/ui/button";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import React, { useMemo } from "react";
import { useAccount } from "wagmi";
import { NotoTeapot } from "@/components/ui/icons/teapot-icon";
import { FxemojiMonkeyface } from "@/components/ui/icons/monkey-icon";
import Show from "@/components/shared/show";
import ErrorMessage from "@/components/ui/error-message";

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
  isApe,
  needsApproval,
  error,
}: {
  needsApproval: boolean;
  onClick: () => void;
  isValid: boolean;
  isApe: boolean;
  error?: string;
}) => {
  const { address } = useAccount();
  if (!address) return undefined;
  return (
    <Button
      disabled={!isValid}
      variant={!needsApproval && !isApe ? "greenSubmit" : "submit"}
      type="button"
      onClick={onClick}
    >
      <Show
        when={!error}
        fallback={
          <div className="flex items-center gap-x-1">
            <span>{error}</span>
          </div>
        }
      >
        {!needsApproval ? (
          <div className="flex items-center gap-x-1">
            <span>{isApe ? "Go Long" : "Provide Liquidity"}</span>
            <span>{isApe ? <FxemojiMonkeyface /> : <NotoTeapot />}</span>
          </div>
        ) : (
          "Approve"
        )}
      </Show>
    </Button>
  );
};
const FeeInfo = ({
  feePercent,
  feeAmount,
  feeValue,
  deposit,
  isValid,
  error,
}: {
  feeAmount: string | undefined;
  feePercent: string | undefined;
  deposit: string | undefined;
  feeValue: string | undefined;
  isValid: boolean;
  error?: string;
}) => {
  const disabled = useMemo(() => {
    if (
      feeValue === "" ||
      deposit === "" ||
      !isFinite(parseFloat(feeAmount ?? ""))
    ) {
      return true;
    } else {
      return false;
    }
  }, [deposit, feeAmount, feeValue]);
  return (
    <div className="h-[40px] w-[450px] text-gray-200 ">
      <Show when={!!error}>
        <ErrorMessage>{error}</ErrorMessage>
      </Show>
      <div
        data-state={isValid && !disabled ? "valid" : "invalid"}
        className=" justify-between text-[14px] data-[state=invalid]:opacity-0"
      >
        <div className="relative flex w-full justify-between text-[13px]">
          <h3 className="text-gray-300 ">
            <span className="z-20 flex items-center gap-x-1">Fee Percent</span>
          </h3>
          <h4>
            <DisplayFormattedNumber
              num={feePercent ? feePercent.toString() + "%" : "0%"}
            />
          </h4>
        </div>
        <div className="relative flex w-full justify-between text-[13px]">
          <h3 className="text-gray-300 ">
            <span className="z-20 flex items-center gap-x-1">Fee Amount</span>
          </h3>
          <h4>
            <DisplayFormattedNumber
              num={feeAmount ? feeAmount.toString() : "0"}
            />
          </h4>
        </div>
      </div>
    </div>
  );
};
// form.getValues("long").split(",")[1]

const MintFormSubmit = {
  Root,
  Errors,
  FeeInfo,
  OpenTransactionModalButton,
  ConnectButton,
};

export default MintFormSubmit;
