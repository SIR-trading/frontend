"use client";
import React from "react";
import { useVaultProvider } from "@/components/providers/vaultProvider";
import Pagination from "@/components/shared/pagination";

const VaultPagination = ({}: { max: number }) => {
  const { nextPage, vaultLength, prevPage, page } = useVaultProvider();
  return (
    <Pagination
      length={vaultLength}
      nextPage={nextPage}
      page={page}
      prevPage={prevPage}
      max={10}
    />
  );
};

export default VaultPagination;
