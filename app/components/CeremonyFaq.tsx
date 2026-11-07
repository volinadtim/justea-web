import { ChevronDownIcon } from "lucide-react";
import { CEREMONY_FAQ } from "@/app/ceremony/content";

/** Вопросы и ответы. Нативные details — работают без JS. */
export default function CeremonyFaq() {
    return (
        <div className="flex flex-col">
            {CEREMONY_FAQ.map((item) => (
                <details
                    key={item.q}
                    className="group border-b-2 border-black/10 py-[14px] dark:border-white/10"
                >
                    <summary className="flex cursor-pointer items-center justify-between gap-[12px] text-[19px] leading-[1.3] marker:content-none [&::-webkit-details-marker]:hidden">
                        {item.q}
                        <ChevronDownIcon className="size-5 shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-[10px] text-[16px] leading-[1.45] text-black/70 dark:text-white/70">
                        {item.a}
                    </p>
                </details>
            ))}
        </div>
    );
}
