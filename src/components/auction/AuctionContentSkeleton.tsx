const AuctionContentSkeleton = ({ count = 4 }: { count?: number }) => {
  return (
    <div>
      <div className="pb-4"></div>
      <div className="grid min-h-[172px] gap-4 gap-y-4 md:grid-cols-2 lg:gap-6">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="mx-auto h-[259px] w-full max-w-[436px] animate-pulse rounded-2xl bg-[#090523AA] md:h-[271px]"
          />
        ))}
      </div>
    </div>
  );
};

export default AuctionContentSkeleton;
