"use client";

import { ScaleIcon } from "lucide-react";
import { useState } from "react";
import VolumeSelect from "./VolumeSelect";

type RatioType = number; // | [number, number];

interface BrewRatioProps {
  ratio: RatioType;
  options?: number[];
}

export default function BrewRatio({ ratio, options }: BrewRatioProps) {
  const [volume, setVolume] = useState(100);
  const [gram, setGram] = useState((ratio * 100) / 100);

  const getCoffeeWeight = (volume: number) => {
    if (typeof ratio === "number") {
      return (volume * ratio) / 100;
    } else {
      // Handle range ratio
      return ((volume * ratio[0]) / 100 + (volume * ratio[1]) / 100) / 2;
    }
  };

//   const formatRatio = () => {
//     if (typeof ratio === "number") {
//       return `1:${ratio}`;
//     } else {
//       return `1:${ratio[0]}-${ratio[1]}`;
//     }
//   };

//   useEffect(() => {}, [volume]);

  return (
    <div className="flex items-center gap-[12px]">
      <ScaleIcon className="w-6 h-6 flex-shrink-0" />

      <div className="flex items-center gap-[4px] text-[19px]">
        <span className="text-[19px] font-comfortaa font-bold">{volume * ratio / 100}</span>
        <span>гр на</span>

        <VolumeSelect
          volume={volume}
          onVolumeChange={(volume) => {
            setVolume(volume);
            // setGram(volume *)
          }}
          options={options}
        />

        <span>мл</span>
      </div>
    </div>
  );
}
