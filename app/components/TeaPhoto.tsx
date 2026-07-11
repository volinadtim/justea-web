import Image from "next/image";
import { Leaf } from "lucide-react";
import { Tea } from "@/types/tea";

type Props = {
    tea: Tea;
    className?: string;
};

export default function TeaPhoto({ tea, className = "mb-[40px]" }: Props) {
    const liquorColor = tea.characteristics.liquorColor;

    if (!tea.photo) {
        return (
            <div
                className={`flex aspect-[4/3] items-center justify-center bg-main-200 ${className}`}
                style={liquorColor ? { backgroundColor: liquorColor } : undefined}
            >
                <Leaf className="size-16 opacity-40" />
            </div>
        );
    }

    return (
        <div className={`relative aspect-[4/3] overflow-hidden bg-main-200 ${className}`}>
            <Image
                src={tea.photo}
                alt={tea.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 670px"
                priority
            />
        </div>
    );
}
