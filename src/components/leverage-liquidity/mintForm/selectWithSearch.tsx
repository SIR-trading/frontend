import Select from "@/components/shared/Select";
import { useDebounce } from "@/components/shared/hooks/useDebounce";
import { getLogoAsset } from "@/lib/assets";
import useVaultFilterStore from "@/lib/store";
import type { TMintForm } from "@/lib/types";
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
  form: TMintForm;
  name: "leverageTier" | "long" | "versus" | "depositToken";
  title: string;
}
export default function SelectWithSearch({ form, name, title, items }: Props) {
  const type = name === "long" ? "collateral" : "debt";
  const [input, setInput] = useState("");
  const { debouncedValue, debouncing } = useDebounce(input, 300);
  const versus = useVaultFilterStore((store) => store.versus);
  const long = useVaultFilterStore((store) => store.long);
  const leverageTier = useVaultFilterStore((store) => store.leverageTier);
  const { data, isFetching } = api.vault.getSearchVaults.useQuery(
    {
      search: debouncedValue.toUpperCase(),
      type,
      filters: {
        filterLeverage: leverageTier,
        filterDebtToken: versus,
        filterCollateralToken: long,
      },
    },
    {
      enabled: Boolean(debouncedValue),
    },
  );
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
        label: e.collateralSymbol,
        value: e.collateralToken + "," + e.collateralSymbol,
        imageUrl: getLogoAsset(e.collateralToken as `0x${string}`),
      };
    } else {
      return {
        label: e.debtSymbol,
        value: e.debtToken + "," + e.debtSymbol,
        imageUrl: getLogoAsset(e.debtToken as `0x${string}`),
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
      form={form}
      value={input}
    />
  );
}
