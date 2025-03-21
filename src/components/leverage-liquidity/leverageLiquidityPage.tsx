import type { ReactNode } from "react";
import PageHeadingSpace from "../shared/pageHeadingSpace";

export default function LeverageLiquidityPage({
  children,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="xl:w-[1280px]">
      {/* <PageHeader>{title}</PageHeader> */}
      <PageHeadingSpace />
      {/* <div className="pt-[44px]"></div> */}
      <div className="w-full">{children}</div>
    </div>
  );
}
