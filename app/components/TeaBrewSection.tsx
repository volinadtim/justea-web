"use client";

import { useEffect, useState } from "react";
import BrewMethodSwitcher from "./BrewMethodSwitcher";
import BrewInfo from "./BrewInfo";
import SteepsTable from "./SteepsTable";
import SteepTimer from "./SteepTimer";
import WhiskedTable from "./WhiskedTable";
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

/** «Перед первым проливом ополоснуть лист 1–2 раза и сразу слить.» */
function formatRinse(method: BrewMethod): string | null {
    const { rinse } = method;

    if (!rinse) {
        return null;
    }

    const times =
        typeof rinse.count === "number"
            ? `${rinse.count}`
            : `${rinse.count.from}–${rinse.count.to}`;

    return [
        `Перед первым проливом ополоснуть лист горячей водой ${times} раза и сразу слить`,
        rinse.note,
    ]
        .filter(Boolean)
        .join(". ")
        .concat(".");
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
    const rinseNote = formatRinse(activeMethod);
    const whisked = activeMethod.whisked ?? [];
    const isWhisked = steeps.length === 0 && whisked.length > 0;

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
                {/*
                    Навеску слева показываем только у способов с проливами.
                    У взбивания их две — 2,4 г/100 мл у усучи против 13,3
                    у коичи, — и одно число рядом с панелью читалось бы как
                    противоречие. Обе навески целиком есть в самой панели.
                */}
                <BrewInfo
                    temperature={getTemperature(activeMethod)}
                    ratio={isWhisked ? undefined : activeMethod.ratio}
                />
                {/*
                    Справа — таблица проливов либо панель взбивания: у матчи
                    проливов нет ни одного, и это место раньше оставалось
                    пустым. Форма та же, содержание другое.
                */}
                {steeps.length > 0 ? (
                    <div className="flex flex-1 flex-col">
                        <SteepsTable steeps={steeps} activeIndex={activeSteepIndex} />
                        <SteepTimer
                            steeps={steeps}
                            onActiveIndexChange={setActiveSteepIndex}
                        />
                    </div>
                ) : isWhisked ? (
                    <WhiskedTable whisked={whisked} />
                ) : null}
            </div>

            {/*
                Промывка (醒茶) идёт первой строкой того же списка, что и
                заметки. Раньше она лежала в `notes` текстом; теперь это поле
                `BrewMethod.rinse`, и строка собирается из него.

                Видимой она быть обязана: в разметке промывка — отдельный шаг
                `HowTo`, а разметка не должна заявлять то, чего читатель не
                видит. Список, классы и место те же — вида это не меняет.
            */}
            {(rinseNote || (activeMethod.notes && activeMethod.notes.length > 0)) && (
                <ul className="mt-[32px] list-disc space-y-[8px] pl-[20px] text-[16px]">
                    {rinseNote && <li>{rinseNote}</li>}
                    {activeMethod.notes?.map((note) => (
                        <li key={note}>{note}</li>
                    ))}
                </ul>
            )}
        </section>
    );
}
