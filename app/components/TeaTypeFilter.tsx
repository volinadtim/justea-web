import Link from "next/link";
import { getAvailableTeaTypes, TEA_TYPE_LABELS } from "@/lib/teas";
import { TeaType } from "@/types/tea";

type Props = {
    activeType?: TeaType;
};

function filterLinkClass(isActive: boolean) {
    return [
        "rounded-full border-2 px-[14px] py-[6px] text-[16px] transition-colors",
        isActive
            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
            : "border-black/20 hover:border-black/40 dark:border-white/20 dark:hover:border-white/40",
    ].join(" ");
}

export default function TeaTypeFilter({ activeType }: Props) {
    const availableTypes = getAvailableTeaTypes();

    return (
        <nav aria-label="Фильтр по типу чая" className="mb-[32px] flex flex-wrap gap-[8px]">
            <Link href="/" className={filterLinkClass(!activeType)}>
                Все
            </Link>
            {availableTypes.map((type) => (
                <Link
                    key={type}
                    href={`/?type=${type}`}
                    className={filterLinkClass(activeType === type)}
                >
                    {TEA_TYPE_LABELS[type]}
                </Link>
            ))}
        </nav>
    );
}
