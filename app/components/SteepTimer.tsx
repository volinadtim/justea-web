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

function timerButtonClass() {
    return "rounded-full border-2 border-black/20 px-[14px] py-[6px] text-[14px] transition-colors hover:border-black/40 dark:border-white/20 dark:hover:border-white/40";
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
        <div className="mt-[20px] rounded-md border-2 border-black/10 p-[16px] dark:border-white/10">
            <div className="mb-[12px] text-[14px] text-black/60 dark:text-white/60">
                {isFinished
                    ? "Все проливы завершены"
                    : isActive
                      ? `Пролив ${currentIndex + 1} из ${totalSteeps}`
                      : "Таймер проливов"}
            </div>

            <div className="mb-[16px] font-comfortaa text-[48px] font-bold leading-none">
                {formatSteepTime(displaySeconds)}
                <span className="ml-[4px] text-[19px] font-normal">сек</span>
            </div>

            <div className="flex flex-wrap gap-[8px]">
                {isIdle || isFinished ? (
                    <button
                        type="button"
                        className={timerButtonClass()}
                        onClick={() => send({ type: "START" })}
                    >
                        <span className="inline-flex items-center gap-1">
                            <PlayIcon className="size-4" />
                            Старт
                        </span>
                    </button>
                ) : null}

                {isRunning ? (
                    <button
                        type="button"
                        className={timerButtonClass()}
                        onClick={() => send({ type: "PAUSE" })}
                    >
                        <span className="inline-flex items-center gap-1">
                            <PauseIcon className="size-4" />
                            Пауза
                        </span>
                    </button>
                ) : null}

                {isPaused ? (
                    <button
                        type="button"
                        className={timerButtonClass()}
                        onClick={() => send({ type: "RESUME" })}
                    >
                        <span className="inline-flex items-center gap-1">
                            <PlayIcon className="size-4" />
                            Продолжить
                        </span>
                    </button>
                ) : null}

                {isActive ? (
                    <>
                        <button
                            type="button"
                            className={timerButtonClass()}
                            onClick={() => send({ type: "SKIP" })}
                        >
                            <span className="inline-flex items-center gap-1">
                                <SkipForwardIcon className="size-4" />
                                Пропустить
                            </span>
                        </button>
                        <button
                            type="button"
                            className={timerButtonClass()}
                            onClick={() => send({ type: "RESET" })}
                        >
                            <span className="inline-flex items-center gap-1">
                                <RotateCcwIcon className="size-4" />
                                Сброс
                            </span>
                        </button>
                    </>
                ) : null}

                {isFinished ? (
                    <button
                        type="button"
                        className={timerButtonClass()}
                        onClick={() => send({ type: "RESET" })}
                    >
                        <span className="inline-flex items-center gap-1">
                            <RotateCcwIcon className="size-4" />
                            Сброс
                        </span>
                    </button>
                ) : null}
            </div>
        </div>
    );
}
