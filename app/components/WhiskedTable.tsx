"use client";

import { ScaleIcon, ThermometerIcon, TimerIcon, WavesIcon } from "lucide-react";
import SteepTimer from "./SteepTimer";
import { Range, WhiskedPreparation } from "@/types/tea";

type Props = {
    whisked: WhiskedPreparation[];
};

const STYLE_NAMES: Record<WhiskedPreparation["style"], string> = {
    usucha: "Усуча",
    koicha: "Коича",
};

// Взбивать до пены или вымешивать до однородной массы — в японском это разные
// глаголы (点てる и 練る) и разный результат, поэтому движение подписано словом,
// а не выведено из стиля.
const MOTION_NAMES: Record<WhiskedPreparation["motion"], string> = {
    whisk: "взбивать",
    knead: "вымешивать",
};

function formatNumber(value: number): string {
    return String(Math.round(value * 10) / 10).replace(".", ",");
}

function formatRange(value: number | Range): string {
    if (typeof value === "number") {
        return formatNumber(value);
    }

    if (value.from === value.to) {
        return formatNumber(value.from);
    }

    return `${formatNumber(value.from)}–${formatNumber(value.to)}`;
}

/** Строка панели: иконка и значение — та же форма, что у температуры и навески. */
function WhiskedRow({
    icon: Icon,
    value,
    unit,
}: {
    icon: React.ComponentType<{ className?: string }>;
    value: string;
    unit: string;
}) {
    return (
        <div className="flex items-center gap-3 text-[17px] sm:gap-[12px] sm:text-[19px]">
            <Icon className="h-6 w-6 shrink-0" />
            <span>
                <span className="font-comfortaa font-bold">{value}</span> <span>{unit}</span>
            </span>
        </div>
    );
}

/**
 * Панель взбивания — то же место и та же форма, что у таблицы проливов,
 * другое содержание: у матчи проливов нет ни одного.
 *
 * Таймер выводится только у коичи: её вымешивают заданные 15 секунд, а усучу
 * взбивают до результата — «тридцать секунд венчиком» не отсчёт, и таймер
 * на неё был бы выдумкой.
 */
export default function WhiskedTable({ whisked }: Props) {
    if (whisked.length === 0) {
        return null;
    }

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-[28px]">
            {whisked.map((preparation) => {
                const duration =
                    typeof preparation.duration === "number"
                        ? preparation.duration
                        : undefined;

                return (
                    <div key={preparation.style} className="flex min-w-0 flex-col">
                        <div className="mb-[12px] text-[14px] text-black/60 dark:text-white/60">
                            {STYLE_NAMES[preparation.style]} ·{" "}
                            {MOTION_NAMES[preparation.motion]}
                        </div>

                        <div className="flex flex-col gap-1">
                            <WhiskedRow
                                icon={ScaleIcon}
                                value={formatRange(preparation.powder)}
                                unit="гр порошка"
                            />
                            <WhiskedRow
                                icon={WavesIcon}
                                value={formatRange(preparation.water)}
                                unit="мл воды"
                            />
                            <WhiskedRow
                                icon={ThermometerIcon}
                                value={formatRange(preparation.temperature)}
                                unit="°C"
                            />
                            {preparation.duration !== undefined ? (
                                <WhiskedRow
                                    icon={TimerIcon}
                                    value={formatRange(preparation.duration)}
                                    unit="сек"
                                />
                            ) : null}
                        </div>

                        {preparation.target ? (
                            <p className="mt-[12px] text-[14px] text-black/60 dark:text-white/60">
                                До результата: {preparation.target}
                            </p>
                        ) : null}

                        {duration !== undefined ? (
                            <SteepTimer
                                steeps={[duration]}
                                labels={{
                                    idle: "Таймер вымешивания",
                                    done: "Готово",
                                    step: () => "Вымешивание идёт",
                                }}
                            />
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}
