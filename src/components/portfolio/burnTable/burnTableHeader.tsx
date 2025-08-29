export default function BurnTableHeaders() {
  return (
    <div className="grid grid-cols-4 gap-x-4 border-b border-foreground/15 pb-1 text-left text-[14px] font-thin text-foreground/70">
      <div className="font-normal">Token</div>
      <div className="font-normal">Vault</div>
      <div className="font-normal">Balance</div>
      <div className="font-normal text-right">Actions</div>
    </div>
  );
}
