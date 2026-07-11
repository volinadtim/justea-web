"use client";

import { ScaleIcon } from "lucide-react";
import { useState } from "react";
import VolumeSelect from "./VolumeSelect";

interface BrewRatioProps {
  ratio: number;
  options?: number[];
}

function formatGrams(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`;
}

export default function BrewRatio({ ratio, options }: BrewRatioProps) {
  const [volume, setVolume] = useState(100);
  const grams = (volume * ratio) / 100;

  return (
    <div className="flex flex-wrap items-center gap-3 text-[17px] sm:gap-[12px] sm:text-[19px]">
      <ScaleIcon className="h-6 w-6 shrink-0" />

      <div className="flex items-center gap-[4px] text-[19px]">
        <span className="font-comfortaa text-[19px] font-bold">
          {formatGrams(grams)}
        </span>
        <span>гр на</span>

        <VolumeSelect
          volume={volume}
          onVolumeChange={setVolume}
          options={options}
        />

        <span>мл</span>
      </div>
    </div>
  );
}
