"use client";
import React from "react";
import { useVaultProvider } from "@/components/providers/vaultProvider";
import Pagination from "@/components/shared/pagination";

const VaultPagination = ({}: { max: number }) => {
  const { nextPage, vaultLength, prevPage, page } = useVaultProvider();

  // Calculate the number of items on the current page
  const itemsPerPage = 10;
  const startIndex = (page - 1) * itemsPerPage;
  const currentPageLength = Math.min(itemsPerPage, Math.max(0, vaultLength - startIndex));

  return (
    <Pagination
      length={currentPageLength}
      nextPage={nextPage}
      page={page}
      prevPage={prevPage}
      max={10}
    />
  );
};

export default VaultPagination;
