"use client";

import React from "react";
import BrewTemperature from "./BrewTemperature";
import BrewRatio from "./BrewRatio";
import ArrowHint from "./ArrowHint";

type Props = {
  temperature: number | [number, number];
  /**
   * Навеска. У взбивания её не передают: у матчи навесок две, и они
   * расходятся в пять раз (2,4 г/100 мл у усучи против 13,3 у коичи).
   * Одно число рядом с панелью взбивания читалось бы как противоречие,
   * а в самой панели обе навески показаны полностью.
   */
  ratio?: number;
};

export default function BrewInfo({ temperature, ratio }: Props) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <BrewTemperature temperature={temperature} />
      {ratio !== undefined && (
        <>
          <BrewRatio ratio={ratio} />
          {/* Подсказка указывает на поле объёма внутри навески, поэтому
              держится вместе с ней. */}
          <div className="relative mb-6 hidden h-[60px] sm:block">
            <ArrowHint className="absolute left-[121px] top-[19px]" position="bottom">
              <div className="text-[14px] leading-[18px] whitespace-nowrap select-none">
                можно <br />
                менять :)
              </div>
            </ArrowHint>
          </div>
        </>
      )}
    </div>
  );
}
