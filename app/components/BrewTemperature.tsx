"use client";

import { ThermometerIcon } from "lucide-react";

type Props = {
  temperature: number | [number, number];
};

export default function BrewTemperature({ temperature }: Props) {
  const temperatureLine =
    typeof temperature === "number"
      ? `${temperature}`
      : `${temperature[0]}–${temperature[1]}`;

  return (
    <div className="flex items-center gap-3 text-[17px] sm:gap-[12px] sm:text-[19px]">
      <ThermometerIcon />
      <span>
        <span className="font-comfortaa font-bold">{temperatureLine}</span> <span>°C</span>
      </span>
    </div>
  );
}
