export default function BurnTableHeaders() {
  return (
    <tr className=" hidden grid-cols-7 gap-x-4 border-b border-foreground/15 pb-1 text-left text-[14px] font-thin  text-foreground/70 md:grid">
      <th className="font-normal">Token</th>
      <th className="font-normal">Long</th>
      <th className="font-normal">Versus</th>
      <th className="font-normal">Leverage</th>
      <th className="col-span-3 font-normal">Balance</th>
    </tr>
  );
}
