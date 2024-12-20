import type { ReactNode } from "react";
import PageHeader from "../shared/pageHeader";
import PageHeadingSpace from "../shared/pageHeadingSpace";

export default function LeverageLiquidityPage({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="xl:w-[1250px]">
      {/* <PageHeader>{title}</PageHeader> */}
      <PageHeadingSpace />
      {/* <div className="pt-[44px]"></div> */}
      <div className="w-full">{children}</div>
    </div>
  );
}
