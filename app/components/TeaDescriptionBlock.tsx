type Props = {
  title: string;
  descriptors: string[];
};

export default function TeaDescriptionBlock({ title, descriptors }: Props) {
  let inlineDescriptors =
    (descriptors.length > 2 ? descriptors.slice(0, -2).join(", ") + ", " : "") +
    descriptors.slice(-2).join(" и ") +
    ".";
  inlineDescriptors =
    inlineDescriptors[0].toUpperCase() +
    inlineDescriptors.slice(1).toLowerCase();

  return (
    <div className="flex-1">
      <h3 className="text-[28px] mb-[6px]">{title}</h3>
      <p className="text-[19px]">{inlineDescriptors}</p>
    </div>
  );
}
