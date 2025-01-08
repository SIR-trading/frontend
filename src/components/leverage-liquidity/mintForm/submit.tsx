import { Button } from "@/components/ui/button";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import React, { useState } from "react";
import { useAccount } from "wagmi";
import { ESubmitType } from "./hooks/useCheckSubmitValid";

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
  submitType,
}: {
  submitType: ESubmitType;
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
      {submitType === ESubmitType.mint ? "Mint" : "Approve"}
    </Button>
  );
};
const FeeInfo = ({
  feePercent,
  feeAmount,
  isApe,
  feeValue,
  deposit,
  isValid,
}: {
  feeAmount: string | undefined;

  feePercent: string | undefined;
  deposit: string | undefined;
  feeValue: string | undefined;
  isApe: boolean;
  isValid: boolean;
}) => {
  const [open, setOpen] = useState(false);
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
        {/* <div className="flex gap-x-1"> */}
        {/*   <span>{fee ? fee.toString() + "%" : "0%"} </span> <span>in fees</span> */}
        {/* </div> */}

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
        {/* <div */}
        {/*   onClick={() => { */}
        {/*     setOpen(!open); */}
        {/*   }} */}
        {/*   className="cursor-pointer" */}
        {/* > */}
        {/*   <ChevronDown */}
        {/*     data-state={open ? "open" : "close"} */}
        {/*     className="transition-transform data-[state=open]:rotate-180" */}
        {/*   /> */}
        {/* </div> */}
      </div>

      {/* {open && ( */}
      {/*   <div className="animate-fade-in pt-1 text-[14px] text-gray-100"> */}
      {/*     <div className="flex justify-between py-1"> */}
      {/*       <span className="select-none">Fee Amount</span> */}
      {/*       <span className="text-white"> */}
      {/*         {formatNumber( */}
      {/*           parseFloat(deposit ?? "0") * (parseFloat(fee ?? "0") / 100), */}
      {/*         )} */}
      {/*         <span className="text-gray-400"> {feeValue}</span> */}
      {/*       </span> */}
      {/*     </div> */}
      {/*     <div className="pt-1  text-[14px] text-gray-400"> */}
      {/*       {isApe */}
      {/*         ? "Apes pay fees only twice: once when minting and once when burning their APE tokens. No additional fees are charged while holding APE tokens, regardless of the duration." */}
      {/*         : "Gentlemen pay fees when minting and burning liquidity. These fees deter attacks and reward early liquidity providers. It's advantageous to mint TEA early and burn it late."} */}
      {/*     </div> */}
      {/*   </div> */}
      {/* )} */}
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
