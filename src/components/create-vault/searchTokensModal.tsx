import React, { useMemo } from "react";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import type { TToken } from "@/contexts/tokenListProvider";
import { useTokenlistContext } from "@/contexts/tokenListProvider";
import type { Address } from "viem";
import SearchInput from "./searchInput";
import ImageWithFallback from "../shared/ImageWithFallback";
import { useTokenLogo } from "@/hooks/useTokenLogo";
import { useFormContext } from "react-hook-form";
import type { CreateVaultInputValues } from "@/lib/schemas";
import type { z } from "zod";
import Show from "../shared/show";
import { Input } from "../ui/input";
import { ArrowLeft, LoaderIcon } from "lucide-react";
import useRetrieveToken from "./hooks/useRetrieveToken";
import { Button } from "../ui/button";
import { useDebounce } from "../shared/hooks/useDebounce";

export default function SearchTokensModal({
  open,
  onOpen,
  selectedTokens,
  tokenSelection,
}: {
  open?: boolean;
  onOpen?: (b: boolean) => void;
  tokenSelection: "longToken" | "versusToken" | undefined;
  selectedTokens: `0x${string}`[];
}) {
  const { setValue } = useFormContext<z.infer<typeof CreateVaultInputValues>>();
  const { tokenlist } = useTokenlistContext();
  const [searchQuery, setSearchQuery] = React.useState("");
  const { debouncedValue: deSearch } = useDebounce(searchQuery, 400);
  const [enterManually, setEnterManually] = React.useState(false);
  const tokens = useMemo(() => {
    return tokenlist?.filter((token) => {
      if (
        token.address === selectedTokens[0] ||
        token.address === selectedTokens[1]
      ) {
        return false;
      }
      const inclSymb = token.name
        .toLowerCase()
        .includes(deSearch.trim().toLowerCase());
      const inclName = token.symbol.toLowerCase().includes(deSearch.trim());
      const inclAddress = token.address.toLowerCase().includes(deSearch.trim());
      if (inclName || inclSymb || inclAddress) {
        return true;
      }
      return false;
    });
  }, [deSearch, selectedTokens, tokenlist]);
  const [manualAddress, setManualAddress] = React.useState("");
  const { name, symbol, address, isLoading } = useRetrieveToken({
    tokenAddress: manualAddress,
  });
  const { primary: manualTokenLogo, fallback: manualTokenFallback } = useTokenLogo(address as Address | undefined, "1");
  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent
        title="Search Tokens"
        className="w-[440px] overflow-hidden border border-foreground/10 bg-secondary p-0 text-foreground"
      >
        <DialogClose></DialogClose>
        <div className="relative  h-[80vh] space-y-6 pt-4 text-foreground">
          <Show when={enterManually}>
            <div className="px-6">
              <button onClick={() => setEnterManually(false)}>
                <ArrowLeft />
              </button>
              <div className="pt-2"></div>
              <div>
                <label htmlFor="">Enter Token Address</label>
              </div>
              <div className="pt-1"></div>
              <div className="">
                <Input
                  type="text"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="rounded-md p-2 text-[14px] ring-foreground/60 focus:ring-2"
                  inputMode="decimal"
                  autoComplete="off"
                  pattern="^[0-9]*[.,]?[0-9]*$"
                  background="primary"
                  placeholder="0x"
                  minLength={1}
                  textSize="xl"
                  step="any"
                />
              </div>
              {address && symbol && !isLoading && (
                <div className="flex justify-between pt-4">
                  <div className="flex items-center gap-x-2">
                    <div className="h-10 w-10">
                      <ImageWithFallback
                        width={35}
                        className="h-full w-full rounded-full"
                        height={35}
                        src={manualTokenLogo}
                        secondaryFallbackUrl={manualTokenFallback}
                        alt=""
                      />
                    </div>
                    <div>
                      <div className="">{symbol}</div>
                      <div className="text-gray-400 text-sm">{name}</div>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button
                      disabled={!address}
                      onClick={() => {
                        if (tokenSelection && address) {
                          setValue(tokenSelection, address);
                          onOpen?.(false);
                          setTimeout(() => {
                            setEnterManually(false);
                            setManualAddress("");
                          }, 400);
                        }
                      }}
                      variant="outline"
                    >
                      Select Token
                    </Button>
                  </div>
                </div>
              )}
              {manualAddress && !address && (
                <div className="flex items-center gap-x-2 pt-4">
                  <span className="text-red">Not a valid Token Address!</span>
                </div>
              )}
              {address && !symbol && !isLoading && (
                <div className="flex items-center gap-x-2 pt-4">
                  <span className="text-foreground/60">Token not found!</span>
                </div>
              )}
              {isLoading && (
                <div className="flex pt-4">
                  <LoaderIcon className="animate-spin" />
                </div>
              )}
            </div>
          </Show>
          <Show when={!enterManually}>
            <div className="space-y-2 px-6">
              <DialogTitle className="text-center font-geist text-[28px]">
                Select a token
              </DialogTitle>
              {/* <h1 className="font-geist">Select a token</h1> */}
              <div className="">
                <SearchInput setValue={setSearchQuery} value={searchQuery} />
                <div className="pt-2 text-sm">
                  <span className="text-foreground/70">
                    Can&apos;t find token? Enter the token{" "}
                  </span>
                  <button
                    onClick={() => setEnterManually(true)}
                    className="text-foreground underline"
                  >
                    here.
                  </button>
                </div>
              </div>
            </div>
            <div className="relative z-0 h-[calc(100%-210px)] border-t border-foreground/10">
              <h2 className="py-3 pl-6 font-geist text-[14px] text-[#999999]">
                Tokens ({tokens?.length})
              </h2>
              <div className=" scrollbar h-[calc(100%-22px)] space-y-2 overflow-y-auto px-2 pb-2">
                {tokens
                  ?.filter(
                    (token) =>
                      !selectedTokens.includes(token.address as Address),
                  )
                  .map((token) => {
                    return (
                      <TokenItem
                        token={token}
                        selectToken={(token) => {
                          setSearchQuery("");
                          setValue(
                            tokenSelection ?? "longToken",
                            token.address,
                          );
                          if (onOpen) onOpen(false);
                        }}
                        key={token.address}
                      />
                    );
                  })}
              </div>
            </div>
          </Show>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TokenItem({
  token,
  selectToken,
}: {
  token: TToken;
  selectToken: (token: TToken) => void;
}) {
  const { primary, fallback } = useTokenLogo(token.address as Address, "1");
  
  return (
    <button
      type="button"
      onClick={() => {
        selectToken(token);
      }}
      className="mb-2 flex w-full justify-between rounded-md px-4 py-2 text-left transition-colors hover:bg-primary/20 dark:hover:bg-primary"
    >
      <span className="flex items-center gap-x-2">
        <ImageWithFallback
          className="h-10 w-10 rounded-full"
          src={primary}
          secondaryFallbackUrl={fallback}
          width={40}
          height={40}
          alt=""
        />
        <span>
          <span className="block">
            {token.symbol}
          </span>
          <span className="block text-gray-400 text-sm">{token.name}</span>
        </span>
      </span>
    </button>
  );
}
