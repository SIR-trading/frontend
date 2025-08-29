export default function BurnTableHeaders() {
  return (
    <div className="grid grid-cols-[0.8fr_1.5fr_1.2fr_1fr] lg:grid-cols-[0.6fr_0.6fr_1.2fr_1fr_1fr] gap-x-4 border-b border-foreground/15 pb-1 text-left text-[14px] font-thin text-foreground/70">
      <div className="font-normal">Token</div>
      <div className="hidden font-normal lg:block">Amount</div>
      <div className="font-normal">Vault</div>
      <div className="font-normal">Balance</div>
      <div className="font-normal text-center">Actions</div>
    </div>
  );
}
