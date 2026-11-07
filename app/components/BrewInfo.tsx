"use client";

import React from "react";
import BrewTemperature from "./BrewTemperature";
import BrewRatio from "./BrewRatio";
import ArrowHint from "./ArrowHint";

type Props = {
  temperature: number | [number, number];
  ratio: number;
};

export default function BrewInfo({ temperature, ratio }: Props) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <BrewTemperature temperature={temperature} />
      <BrewRatio ratio={ratio} />
      {/* На мобильном стрелка не помещается, но без неё подчёркнутое «100»
          выглядит случайным подчёркиванием, а не редактируемым полем —
          поэтому там та же подсказка словами. */}
      <p className="text-[14px] text-muted sm:hidden">Объём воды можно менять</p>
      <div className="relative mb-6 hidden h-[60px] sm:block">
        <ArrowHint className="absolute left-[121px] top-[19px]" position="bottom">
          <div className="text-[14px] leading-[18px] whitespace-nowrap select-none">
            можно <br />
            менять :)
          </div>
        </ArrowHint>
      </div>
    </div>
  );
}
