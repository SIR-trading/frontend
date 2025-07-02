import type { ReactNode } from "react";

const AuctionContentWrapper = ({
  header,
  children,
}: {
  header: string;
  children: ReactNode;
}) => {
  return (
    <div>
      <h3 className="mb-8 h-[32px] text-center font-geist text-[32px] font-normal leading-[32px] text-foreground">
        {header}
      </h3>
      <div className="grid min-h-[172px] gap-4 gap-y-8 md:grid-cols-2 lg:gap-8">
        {children}
      </div>
    </div>
  );
};

export default AuctionContentWrapper;
