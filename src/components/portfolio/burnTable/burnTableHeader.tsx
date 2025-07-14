export default function BurnTableHeaders() {
  return (
    <div className=" hidden grid-cols-7 gap-x-4 border-b border-foreground/15 pb-1 text-left text-[14px] font-thin  text-foreground/70 md:grid">
      <div className="font-normal">Token</div>
      <div className="font-normal">Long</div>
      <div className="font-normal">Versus</div>
      <div className="font-normal">Leverage</div>
      <div className="col-span-3 font-normal">Balance</div>
    </div>
  );
}
