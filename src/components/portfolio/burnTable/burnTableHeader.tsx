export default function BurnTableHeaders() {
  return (
    <div className="grid grid-cols-[0.6fr_1.2fr_1.5fr_0.8fr_0.7fr] md:grid-cols-[0.6fr_0.8fr_1.2fr_1fr_0.8fr_0.7fr] lg:grid-cols-[0.6fr_0.6fr_1fr_0.8fr_0.8fr_0.7fr] gap-x-4 border-b border-foreground/15 pb-1 text-left text-[14px] font-thin text-muted-foreground">
      <div className="font-normal">Token</div>
      <div className="hidden font-normal md:block">Balance</div>
      <div className="font-normal">Vault</div>
      <div className="font-normal">Value</div>
      <div className="font-normal">PnL</div>
      <div className="font-normal text-center">Actions</div>
    </div>
  );
}
