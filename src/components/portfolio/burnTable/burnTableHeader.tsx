export default function BurnTableHeaders() {
  return (
    <tr className=" hidden grid-cols-7 gap-x-4 border-b border-white border-opacity-10 pb-1 text-left text-[14px] font-thin  text-gray-500 md:grid">
      <th className="font-normal">Token</th>
      <th className="font-normal">Long</th>
      <th className="font-normal">Versus</th>
      <th className="font-normal">Leverage</th>
      <th className="col-span-3 font-normal">Balance</th>
    </tr>
  );
}
