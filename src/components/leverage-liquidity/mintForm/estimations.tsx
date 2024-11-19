import { formatNumber } from "@/lib/utils";

export default function Estimations({
  ape,
  disabled,
  isApe,
}: {
  ape: string;
  isApe: boolean;
  disabled: boolean;
}) {
  return (
    <div className={` pt-2 ${disabled ? "opacity-50" : ""}`}>
      <h2 className="text-sm">You receive</h2>
      <div className="pt-1"></div>
      <div className="rounded-md bg-primary p-3">
        <h2 className={`text-md `}>
          {ape}
          <span className="text-sm text-gray-300">
            {" "}
            {isApe ? "APE" : "TEA"}
          </span>
        </h2>
        {/* <h2 className=" text-sm italic text-gray-500">{"$20.55 (-X.XX%)"}</h2> */}
      </div>
    </div>
  );
}
