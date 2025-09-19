import { Button } from "@/components/ui/button";
import { ESubmitType } from "@/lib/types";
import { useMemo } from "react";
import Spinner from "./spinner";
interface Props {
  waitForSign: boolean;
  isTxPending: boolean;
  isTxSuccess: boolean;
  submitType: ESubmitType;
  isValid: boolean;
}
export default function SubmitAndProgressButton({
  waitForSign,
  isTxPending,
  isTxSuccess,
  submitType,
  isValid,
}: Props) {
  const data = useMemo(() => {
    if (isTxSuccess) {
      return { message: "Success!", success: true };
    }
    if (waitForSign) {
      return {
        message: (
          <div className="flex items-center gap-x-1">
            <Spinner />
            <span>Please sign transaction.</span>
          </div>
        ),
      };
    }
    if (isTxPending) {
      return { message: "Pending..." };
    }
    return {};
  }, [waitForSign, isTxPending, isTxSuccess]);
  return (
    <div>
      <Button disabled={!isValid} variant={"submit"} type="submit">
        {data?.message ? (
          data.message
        ) : (
          <> {submitType === ESubmitType.mint ? "Mint" : "Approve"}</>
        )}
      </Button>
    </div>
  );
}
