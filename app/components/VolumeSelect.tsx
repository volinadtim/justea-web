"use client";

type Props = {
  volume: number;
  onVolumeChange: (volume: number) => void;
};

export default function VolumeSelect({ volume, onVolumeChange }: Props) {
  const handleChange = (event: InputEvent) => {
    onVolumeChange(parseInt((event!.target! as any).value));
  };

  return (
    <div className="">
      <input
        className="border-b-1"
        value={volume}
        onChange={(e) => handleChange(e)}
      />
    </div>
  );
}
