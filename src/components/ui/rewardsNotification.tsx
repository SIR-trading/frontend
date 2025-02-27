"use client";
import { api } from "@/trpc/react";
import { motion } from "motion/react";
import Link from "next/link";
import React, { useState } from "react";
import { useAccount } from "wagmi";

export default function RewardsNotification() {
  const [open, setOpen] = useState(true);

  const { address } = useAccount();
  const { data: dividends } = api.user.getUserSirDividends.useQuery(
    { user: address },
    { enabled: Boolean(address) },
  );
  if (!open) return;
  if (!dividends) {
    return;
  }
  if (dividends < 1) {
    return;
  }
  return (
    <motion.div
      className="absolute flex w-full justify-center "
      initial={{ y: -26 }}
      animate={{ y: 0 }}
    >
      <div className="flex w-[400px] justify-center gap-x-4 rounded-b-md bg-yellow-100 text-sm ">
        <div className="flex items-center gap-x-2">
          <h4>You have to rewards to claim!</h4>
          <Link
            onClick={() => {
              setOpen(false);
            }}
            href="/portfolio"
            className=" p-1 text-black underline"
          >
            Claim Now
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
