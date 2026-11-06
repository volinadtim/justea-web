"use client";

import { useMachine } from "@xstate/react";
import { PauseIcon, PlayIcon, RotateCcwIcon, SkipForwardIcon } from "lucide-react";
import { useEffect } from "react";
import { formatSteepTime } from "@/lib/format-steep-time";
import { steepTimerMachine } from "@/lib/machines/steep-timer";

type Props = {
    steeps: number[];
    onActiveIndexChange?: (index: number | null) => void;
};

function TimerIconButton({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-line transition-colors hover:border-line-strong"
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export default function SteepTimer({ steeps, onActiveIndexChange }: Props) {
    const [snapshot, send] = useMachine(steepTimerMachine, {
        input: { steeps },
    });

    const { currentIndex, remainingSeconds } = snapshot.context;
    const isIdle = snapshot.matches("idle");
    const isRunning = snapshot.matches("running");
    const isPaused = snapshot.matches("paused");
    const isFinished = snapshot.matches("finished");
    const isActive = isRunning || isPaused;

    useEffect(() => {
        send({ type: "SET_STEEPS", steeps });
    }, [steeps, send]);

    useEffect(() => {
        if (!isRunning) {
            return;
        }

        const intervalId = window.setInterval(() => {
            send({ type: "TICK" });
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [isRunning, send]);

    useEffect(() => {
        if (isFinished) {
            onActiveIndexChange?.(null);
            return;
        }

        if (isIdle) {
            onActiveIndexChange?.(null);
            return;
        }

        onActiveIndexChange?.(currentIndex);
    }, [currentIndex, isFinished, isIdle, onActiveIndexChange]);

    if (steeps.length === 0) {
        return null;
    }

    const totalSteeps = steeps.length;
    const displaySeconds = isIdle || isFinished ? steeps[0] ?? 0 : remainingSeconds;

    return (
        <div className="mt-[20px] rounded-md border-2 border-line p-[16px]">
            <div className="mb-[12px] text-[14px] text-muted">
                {isFinished
                    ? "Все проливы завершены"
                    : isActive
                      ? `Пролив ${currentIndex + 1} из ${totalSteeps}`
                      : "Таймер проливов"}
            </div>

            <div className="mb-3 font-comfortaa text-[40px] font-bold leading-none sm:mb-4 sm:text-[48px]">
                {formatSteepTime(displaySeconds)}
                <span className="ml-[4px] text-[19px] font-normal">сек</span>
            </div>

            <div className="flex flex-nowrap items-center gap-[8px]">
                {isIdle || isFinished ? (
                    <TimerIconButton label="Старт" onClick={() => send({ type: "START" })}>
                        <PlayIcon className="size-4" strokeWidth={2} />
                    </TimerIconButton>
                ) : null}

                {isRunning ? (
                    <TimerIconButton label="Пауза" onClick={() => send({ type: "PAUSE" })}>
                        <PauseIcon className="size-4" strokeWidth={2} />
                    </TimerIconButton>
                ) : null}

                {isPaused ? (
                    <TimerIconButton label="Продолжить" onClick={() => send({ type: "RESUME" })}>
                        <PlayIcon className="size-4" strokeWidth={2} />
                    </TimerIconButton>
                ) : null}

                {isActive ? (
                    <>
                        <TimerIconButton label="Пропустить" onClick={() => send({ type: "SKIP" })}>
                            <SkipForwardIcon className="size-4" strokeWidth={2} />
                        </TimerIconButton>
                        <TimerIconButton label="Сброс" onClick={() => send({ type: "RESET" })}>
                            <RotateCcwIcon className="size-4" strokeWidth={2} />
                        </TimerIconButton>
                    </>
                ) : null}

                {isFinished ? (
                    <TimerIconButton label="Сброс" onClick={() => send({ type: "RESET" })}>
                        <RotateCcwIcon className="size-4" strokeWidth={2} />
                    </TimerIconButton>
                ) : null}
            </div>
        </div>
    );
}
