// "use client";

// import { ScaleIcon } from "lucide-react";
// import { useState } from "react";
// import VolumeSelect from "./VolumeSelect";

// const options = [50, 100, 150, 200, 250, 300, 350, 500, 1000];

// type Props = {
//   ratio: number;
// };

// export default function BrewRatio({ ratio }: Props) {
//   const [volume, setVolume] = useState(100);

//   // useEffect(() => {}, [volume]);

//   const ratioLine =
//     typeof ratio === "number" ? `${ratio}` : `${ratio[0] - ratio[1]}`;

//   return (
//     <div className="flex gap-[12px]">
//       <ScaleIcon />
//       {/* <div></div> */}
//       {((volume * ratio) / 100).toFixed(1)} гр на{" "}
//       <VolumeSelect
//         volume={volume}
//         onVolumeChange={(value) => setVolume(value)}
//       />{" "}
//       мл
//     </div>
//   );
// }
