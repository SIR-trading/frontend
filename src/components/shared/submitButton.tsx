import { useAccount } from "wagmi";
import Show from "./show";
import { Button } from "../ui/button";
import type { ReactNode } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
interface Props {
  error?: string;
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
}
export default function SubmitButton({
  onClick,
  disabled,
  error,
  children,
}: Props) {
  const { openConnectModal } = useConnectModal();
  const { address } = useAccount();
  return (
    <>
      <Show
        when={!!address}
        fallback={
          <Button
            onClick={() => openConnectModal?.()}
            variant="submit"
            type="button"
          >
            Connect Wallet
          </Button>
        }
      >
        <Button
          variant={"submit"}
          onClick={onClick}
          type="button"
          disabled={disabled || !!error}
        >
          <Show when={!error} fallback={error}>
            {children}
          </Show>
        </Button>
      </Show>
    </>
  );
}
