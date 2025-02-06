import React, { createContext, useContext } from "react";
import type { TMintFormFieldKeys } from "./mintFormProvider";
interface state {
  setValue: (name: TMintFormFieldKeys, value: string) => void;
}

const MintFormProviderApiContext = createContext<state | undefined>(undefined);
export function useMintFormProviderApi() {
  const context = useContext(MintFormProviderApiContext);
  if (context === undefined) {
    throw new Error(
      "useMintFormProviderApi must be used within a MintFormProvider",
    );
  }
  return context;
}

export default function MintFormProviderApi({
  children,
  setValue,
}: {
  children: React.ReactNode;
  setValue: (name: TMintFormFieldKeys, value: string) => void;
}) {
  return (
    <MintFormProviderApiContext.Provider value={{ setValue }}>
      {children}
    </MintFormProviderApiContext.Provider>
  );
}
