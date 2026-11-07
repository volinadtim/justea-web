"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import BrewMethodSwitcher from "./BrewMethodSwitcher";
import BrewInfo from "./BrewInfo";
import SteepsTable from "./SteepsTable";
import SteepTimer from "./SteepTimer";
import QuickBrewButton from "./features/QuickBrewButton";
import { MaximizeIcon, PlayIcon } from "lucide-react";
import { getBrewRecord, rememberBrewStart } from "@/lib/journal/brews";
import { subscribeToJournal } from "@/lib/journal/storage";
import { BrewMethod } from "@/types/tea";

type Props = {
    slug: string;
    brewMethods: BrewMethod[];
    defaultMethodId: string;
};

function getTemperature(method: BrewMethod): number | [number, number] {
    const { from, to } = method.temperature;

    if (from === to) {
        return from;
    }

    return [from, to];
}

function getSteepsFromMethod(method: BrewMethod): number[] {
    return method.infusions.map((infusion) => infusion.time);
}

/**
 * ?start=1 — запуск таймера по ссылке с главной. Параметр читаем из
 * window.location, а не через useSearchParams: страница чая должна остаться
 * статической. На сервере сигнала нет, в разметку он не попадает.
 */
function readStartSignal(): number {
    if (typeof window === "undefined") {
        return 0;
    }

    return new URLSearchParams(window.location.search).get("start") === "1" ? 1 : 0;
}

export default function TeaBrewSection({ slug, brewMethods, defaultMethodId }: Props) {
    // Запомненный способ лежит в localStorage; useSyncExternalStore читает его
    // без setState в эффекте и держит страницу в согласии с хранилищем.
    const rememberedMethodId = useSyncExternalStore(
        subscribeToJournal,
        () => getBrewRecord(slug)?.methodId ?? null,
        () => null
    );
    const [chosenId, setChosenId] = useState<string | null>(null);
    const fallbackId =
        rememberedMethodId &&
        brewMethods.some((method) => method.id === rememberedMethodId)
            ? rememberedMethodId
            : defaultMethodId;
    const activeId = chosenId ?? fallbackId;
    const activeMethod =
        brewMethods.find((method) => method.id === activeId) ?? brewMethods[0];
    const [activeSteepIndex, setActiveSteepIndex] = useState<number | null>(null);
    const [startSignal, setStartSignal] = useState(readStartSignal);
    const [fullscreen, setFullscreen] = useState(false);
    const timerRef = useRef<HTMLDivElement>(null);
    const previousSteepIndex = useRef<number | null>(null);
    const steeps = getSteepsFromMethod(activeMethod);

    useEffect(() => {
        setActiveSteepIndex(null);
        previousSteepIndex.current = null;
    }, [activeMethod.id]);

    useEffect(() => {
        if (startSignal === 0) {
            return;
        }

        // Параметр одноразовый: при возврате назад таймер не перезапускается.
        if (new URLSearchParams(window.location.search).get("start") === "1") {
            window.history.replaceState(
                null,
                "",
                window.location.pathname + window.location.hash
            );
        }

        timerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [startSignal]);

    // Запуск таймера — это и есть «заварил»: отсюда берётся список
    // «Заварить снова» и запомненный способ.
    const handleActiveIndexChange = useCallback(
        (index: number | null) => {
            setActiveSteepIndex(index);

            const previous = previousSteepIndex.current;
            previousSteepIndex.current = index;

            if (previous === null && index !== null) {
                rememberBrewStart(slug, activeId);
            }
        },
        [slug, activeId]
    );

    if (!activeMethod) {
        return null;
    }

    return (
        <section>
            <BrewMethodSwitcher
                methods={brewMethods}
                activeId={activeMethod.id}
                onChange={setChosenId}
            />

            <h2 className="mb-3 text-[28px] leading-none sm:text-[34px] lg:text-[37px]">
                {activeMethod.name}
            </h2>
            <p className="mb-6 text-[17px] sm:mb-8 sm:text-[19px]">{activeMethod.description}</p>

            {steeps.length > 0 && (
                <div className="mb-6 flex flex-wrap items-center gap-[8px] sm:mb-8">
                    <QuickBrewButton
                        label="Заварить"
                        icon={<PlayIcon className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />}
                        onClick={() => setStartSignal((value) => value + 1)}
                    />
                    <QuickBrewButton
                        label="Во весь экран"
                        variant="secondary"
                        icon={<MaximizeIcon className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />}
                        onClick={() => setFullscreen(true)}
                    />
                </div>
            )}

            <div className="flex min-w-0 flex-col gap-4 md:flex-row md:gap-[14px]">
                <BrewInfo
                    temperature={getTemperature(activeMethod)}
                    ratio={activeMethod.ratio}
                />
                <div className="flex flex-1 flex-col">
                    <SteepsTable steeps={steeps} activeIndex={activeSteepIndex} />
                    <div ref={timerRef}>
                        <SteepTimer
                            steeps={steeps}
                            startSignal={startSignal}
                            fullscreen={fullscreen}
                            onFullscreenChange={setFullscreen}
                            onActiveIndexChange={handleActiveIndexChange}
                        />
                    </div>
                </div>
            </div>

            {activeMethod.notes && activeMethod.notes.length > 0 && (
                <ul className="mt-[32px] list-disc space-y-[8px] pl-[20px] text-[16px]">
                    {activeMethod.notes.map((note) => (
                        <li key={note}>{note}</li>
                    ))}
                </ul>
            )}
        </section>
    );
}
