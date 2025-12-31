"use client";

import { HashIcon, TimerIcon } from "lucide-react";
import SteepsTableRow from "./SteepsTableRow";

type Props = { steeps: number[] };

const STEEP_NUMBERS = ["一", "二", "三", "四", "五", "六"];

function SteepsTimeComponent({ value }: { value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-center leading-none text-[19px] font-bold font-comfortaa">{value}</div>
      <span className="text-center leading-none text-[14px]">сек</span>
    </div>
  );
}

export default function SteepsTable({ steeps }: Props) {
  return (
    <div className="flex flex-1 flex-col gap-[15px]">
      <SteepsTableRow
        icon={HashIcon}
        values={STEEP_NUMBERS.slice(0, steeps.length)}
      />
      <SteepsTableRow
        icon={TimerIcon}
        values={steeps}
        valueComponent={SteepsTimeComponent}
      />
    </div>
  );
}
