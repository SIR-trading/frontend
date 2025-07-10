import type { ReactNode } from "react";

const AuctionContentWrapper = ({
  header,
  children,
}: {
  header?: string;
  children: ReactNode;
}) => {
  return (
    <div>
      {header && (
        <h3 className="h-[20px] text-center font-geist text-[20px] font-semibold leading-[20px] text-foreground">
          {header}
        </h3>
      )}
      <div className="pb-4"></div>
      <div className="grid min-h-[172px] gap-4 gap-y-8 md:grid-cols-2 lg:gap-8">
        {children}
      </div>
    </div>
  );
};

export default AuctionContentWrapper;
