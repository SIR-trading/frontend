"use client";
import React from "react";
import { useVaultProvider } from "@/components/providers/vaultProvider";
import Pagination from "@/components/shared/pagination";

const ITEMS_PER_PAGE = 10;

const VaultPagination = () => {
  const { nextPage, vaultLength, prevPage, page } = useVaultProvider();

  const totalPages = Math.ceil(vaultLength / ITEMS_PER_PAGE);

  return (
    <Pagination
      totalPages={totalPages || 1}
      page={page}
      nextPage={nextPage}
      prevPage={prevPage}
    />
  );
};

export default VaultPagination;
