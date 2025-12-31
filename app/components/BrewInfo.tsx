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
      <div className="relative h-[60px] mb-[52px]">
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
