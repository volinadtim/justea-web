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
    return method.infusions.map((infusion) => infusion.time);
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

            <h2 className="mb-[12px] text-[37px] leading-none">{activeMethod.name}</h2>
            <p className="mb-[33px] text-[19px]">{activeMethod.description}</p>

            <div className="flex flex-col gap-[14px] md:flex-row">
                <BrewInfo
                    temperature={getTemperature(activeMethod)}
                    ratio={activeMethod.ratio}
                />
                <div className="flex flex-1 flex-col">
                    <SteepsTable steeps={steeps} activeIndex={activeSteepIndex} />
                    <SteepTimer
                        steeps={steeps}
                        onActiveIndexChange={setActiveSteepIndex}
                    />
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
