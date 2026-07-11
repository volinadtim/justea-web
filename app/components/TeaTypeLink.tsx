import Link from "next/link";
import { TEA_TYPE_LABELS } from "@/lib/teas";
import { TeaType } from "@/types/tea";
import { Leaf } from "lucide-react";

interface Props {
    type: TeaType;
}

export default function TeaTypeLink({ type }: Props) {
    return (
        <Link
            href={`/?type=${type}`}
            className="flex w-fit items-center gap-1 underline-offset-2 hover:underline"
        >
            <Leaf />
            <span className="text-[22px]">{TEA_TYPE_LABELS[type]}</span>
        </Link>
    );
}
