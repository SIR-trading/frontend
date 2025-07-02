import type { CSSProperties } from "react";

const AuctionContentSkeleton = () => {
  return (
    <div>
      <h3 className="mb-8 flex h-[32px] justify-center font-geist text-[28px] font-normal leading-[32px] text-foreground">
        <Skeleton
          width="200px"
          height="32px"
          borderRadius="6px"
          background="#090523AA"
        />
      </h3>
      <div className="grid min-h-[172px] gap-4 gap-y-8 md:grid-cols-2 lg:gap-8">
        {[1, 2].map((i) => (
          <Skeleton
            key={i}
            borderRadius="16px"
            maxWidth="436px"
            width="100%"
            margin="auto"
            height="200px"
            background="#090523AA"
          />
        ))}
      </div>
    </div>
  );
};

function Skeleton(props: CSSProperties) {
  return <div style={{ ...props }} className="animate-pulse"></div>;
}

export default AuctionContentSkeleton;
