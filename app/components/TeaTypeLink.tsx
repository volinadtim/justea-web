import { TEA_TYPE_LABELS } from "@/lib/teas";
import { TeaType } from "@/types/tea";
import { Leaf } from "lucide-react";

interface Props {
    type: TeaType;
}

export default function TeaTypeLink({ type }: Props) {
    return (
        <div className="flex gap-1 items-center">
            <Leaf />
            <span className="text-[22px]">{TEA_TYPE_LABELS[type]}</span>
        </div>
    );
}
