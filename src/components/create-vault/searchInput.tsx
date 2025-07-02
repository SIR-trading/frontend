"use client";
import { Search, X } from "lucide-react";
import React, { useState } from "react";
interface Props {
  value: string;
  setValue?: (s: string) => void;
  className?: string;
}
export default function SearchInput({ value, setValue, className }: Props) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <div
      data-focused={isFocused ? "focused" : "not-focused"}
      className={
        "flex h-[42px] gap-x-3 rounded-md bg-tertiary p-2 outline-1 data-[focused=focused]:outline data-[focused=focused]:outline-foreground" +
        className
      }
    >
      <div className="flex items-center">
        <Search className="text-gray-400 h-5 w-5" />
      </div>
      <input
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        type="text"
        onChange={(e) => setValue?.(e.target.value)}
        value={value}
        className="w-full bg-transparent font-geist placeholder:text-sm placeholder:text-foreground/60 focus:outline-none"
        placeholder="Search by name or symbol"
      />
      {value !== "" && (
        <button onClick={() => setValue?.("")}>
          <X className="text-gray-400" />
        </button>
      )}
    </div>
  );
}
