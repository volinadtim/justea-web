import Link from "next/link";
import Scrollable from "./Scrollable";
import { getAvailableTeaTypes, TEA_TYPE_LABELS } from "@/lib/teas";
import { TeaType } from "@/types/tea";

type Props = {
    activeType?: TeaType;
};

function filterLinkClass(isActive: boolean) {
    return [
        "rounded-full border-2 px-3 py-1.5 text-[14px] transition-colors sm:px-[14px] sm:py-[6px] sm:text-[16px]",
        isActive
            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
            : "border-black/20 hover:border-black/40 dark:border-white/20 dark:hover:border-white/40",
    ].join(" ");
}

export default function TeaTypeFilter({ activeType }: Props) {
    const availableTypes = getAvailableTeaTypes();

    return (
        <Scrollable
            className="mb-6 sm:mb-8"
            options={{ overflow: { y: "hidden" } }}
        >
            <nav
                aria-label="Фильтр по типу чая"
                className="flex gap-2 sm:flex-wrap sm:gap-[8px]"
            >
                <Link href="/" className={filterLinkClass(!activeType) + " shrink-0"}>
                    Все
                </Link>
                {availableTypes.map((type) => (
                    <Link
                        key={type}
                        href={`/?type=${type}`}
                        className={filterLinkClass(activeType === type) + " shrink-0"}
                    >
                        {TEA_TYPE_LABELS[type]}
                    </Link>
                ))}
            </nav>
        </Scrollable>
    );
}
