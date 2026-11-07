"use client";

import React from "react";
import BrewTemperature from "./BrewTemperature";
import BrewRatio from "./BrewRatio";
import ArrowHint from "./ArrowHint";

type Props = {
  temperature: number | [number, number];
  /**
   * Навески может не быть: у взбивания (матча) её нет ни одной верной —
   * 2,4 г/100 мл у усучи против 13,3 у коичи.
   *
   * То же самое justea-design делает в PR #27; здесь это повторено, иначе
   * ветка не собирается. При мерже достаточно любой из двух версий.
   */
  ratio?: number;
};

export default function BrewInfo({ temperature, ratio }: Props) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <BrewTemperature temperature={temperature} />
      {ratio !== undefined && <BrewRatio ratio={ratio} />}
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
