import React from "react";

export default function PageHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h1 className="text-center font-geist text-[32px] font-bold">{children}</h1>
  );
}
