"use client";

import { useEffect, useState } from "react";
import BrewMethodSwitcher from "./BrewMethodSwitcher";
import BrewInfo from "./BrewInfo";
import SteepsTable from "./SteepsTable";
import SteepTimer from "./SteepTimer";
import { BrewMethod } from "@/types/tea";

type Props = {
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
    // `infusions` стало необязательным: у взбивания (матча) проливов нет ни
    // одного. Защита, а не изменение вида — без неё сборка не проходит.
    return (method.infusions ?? []).map((infusion) => infusion.time);
}

export default function TeaBrewSection({ brewMethods, defaultMethodId }: Props) {
    const [activeId, setActiveId] = useState(defaultMethodId);
    const activeMethod =
        brewMethods.find((method) => method.id === activeId) ?? brewMethods[0];
    const [activeSteepIndex, setActiveSteepIndex] = useState<number | null>(null);
    const steeps = getSteepsFromMethod(activeMethod);

    useEffect(() => {
        setActiveSteepIndex(null);
    }, [activeMethod.id]);

    if (!activeMethod) {
        return null;
    }

    return (
        <section>
            <BrewMethodSwitcher
                methods={brewMethods}
                activeId={activeMethod.id}
                onChange={setActiveId}
            />

            <h2 className="mb-3 text-[28px] leading-none sm:text-[34px] lg:text-[37px]">
                {activeMethod.name}
            </h2>
            <p className="mb-6 text-[17px] sm:mb-8 sm:text-[19px]">{activeMethod.description}</p>

            <div className="flex min-w-0 flex-col gap-4 md:flex-row md:gap-[14px]">
                <BrewInfo
                    temperature={getTemperature(activeMethod)}
                    ratio={activeMethod.ratio}
                />
                {/*
                    Таблица проливов и таймер — только когда проливы есть.
                    У взбивания (матча) их нет ни одного, и пустая таблица с
                    таймером на ноль шагов была бы дефектом, а не решением.

                    Это защита, а не оформление: как показывать взбивание —
                    вопрос к justea-design, он описан в outbox justea-seo #12.
                    Своего облика агент не придумывает (решение пользователя
                    07.11.2026).
                */}
                {steeps.length > 0 && (
                    <div className="flex flex-1 flex-col">
                        <SteepsTable steeps={steeps} activeIndex={activeSteepIndex} />
                        <SteepTimer
                            steeps={steeps}
                            onActiveIndexChange={setActiveSteepIndex}
                        />
                    </div>
                )}
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
