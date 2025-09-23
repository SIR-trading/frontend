import Select from "@/components/shared/Select";
import { useDebounce } from "@/components/shared/hooks/useDebounce";
import { useTokenlistContext } from "@/contexts/tokenListProvider";
import useVaultFilterStore from "@/lib/store";
import { api } from "@/trpc/react";
import type { StaticImageData } from "next/image";
import React, { useState } from "react";

type TItem = {
  value: string;
  label: string;
  imageUrl?: string | StaticImageData;
};
interface Props {
  items: TItem[];
  name: "leverageTier" | "long" | "versus" | "depositToken";
  title: string;
}
export default function SelectWithSearch({ name, title, items }: Props) {
  const type = name === "long" ? "collateral" : "debt";
  const [input, setInput] = useState("");
  const { debouncedValue, debouncing } = useDebounce(input, 300);
  const { tokenlist } = useTokenlistContext();
  
  const { data, isFetching } = api.vault.getSearchVaults.useQuery(
    {
      search: debouncedValue.toUpperCase(),
      type,
    },
    {
      enabled: Boolean(debouncedValue),
    },
  );
  
  // Helper function to get logo with fallback from tokenlist
  const getLogoWithFallback = (address: string) => {
    // First try to find from tokenlist (which has curated logoURIs)
    const token = tokenlist?.find(
      (t) => t.address.toLowerCase() === address.toLowerCase()
    );
    if (token?.logoURI) {
      return token.logoURI;
    }
    // Fall back to Trust Wallet
    return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`;
  };
  
  let searchItems: TItem[] | undefined = [
    ...new Map(
      data?.vaults?.map((item) => [
        item[type === "debt" ? "debtToken" : "collateralToken"],
        item,
      ]),
    ).values(),
  ].map((e) => {
    if (type === "collateral") {
      return {
        label: e.collateralToken.symbol ?? 'Unknown',
        value: e.collateralToken.id + "," + (e.collateralToken.symbol ?? 'Unknown'),
        imageUrl: getLogoWithFallback(e.collateralToken.id),
      };
    } else {
      return {
        label: e.debtToken.symbol ?? 'Unknown',
        value: e.debtToken.id + "," + (e.debtToken.symbol ?? 'Unknown'),
        imageUrl: getLogoWithFallback(e.debtToken.id),
      };
    }
  });
  if (input === "") {
    searchItems = undefined;
  }
  const setStore = useVaultFilterStore((state) =>
    type === "debt" ? state.setVersus : state.setLong,
  );
  return (
    <Select
      setStore={setStore}
      loading={isFetching || debouncing}
      searchItems={searchItems}
      title={title}
      onChangeInput={(s) => {
        setInput(s);
      }}
      items={items}
      name={name}
      value={input}
    />
  );
}
