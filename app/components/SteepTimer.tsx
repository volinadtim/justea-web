"use client";

import { useMachine } from "@xstate/react";
import {
    BellIcon,
    BellOffIcon,
    PauseIcon,
    PlayIcon,
    RotateCcwIcon,
    SkipForwardIcon,
} from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import {
    getSteepSoundServerSnapshot,
    isSteepSoundEnabled,
    keepScreenAwake,
    playSteepSignal,
    primeSteepSignal,
    setSteepSoundEnabled,
    subscribeToSteepSound,
} from "./steep-signal";
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
    pressed,
}: {
    label: string;
    onClick: () => void;
    children: React.ReactNode;
    pressed?: boolean;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={pressed}
            title={label}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-black/20 transition-colors hover:border-black/40 dark:border-white/20 dark:hover:border-white/40"
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

    // Настройка живёт в localStorage; useSyncExternalStore читает её без
    // setState в эффекте и держит все таймеры на странице в согласии.
    const soundOn = useSyncExternalStore(
        subscribeToSteepSound,
        isSteepSoundEnabled,
        getSteepSoundServerSnapshot
    );
    const previousRef = useRef({ index: 0, finished: false });
    // Пропуск и сброс проходят через то же состояние машины, что и
    // естественное окончание пролива. Сигналить по ним не нужно — это
    // действие пользователя, а не событие.
    const skipSignalRef = useRef(false);

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

    // Экран не должен гаснуть посреди пролива.
    useEffect(() => {
        if (!isRunning) {
            return;
        }

        return keepScreenAwake();
    }, [isRunning]);

    // Сигнал окончания пролива.
    useEffect(() => {
        const previous = previousRef.current;
        const steepEnded = currentIndex > previous.index;
        const justFinished = isFinished && !previous.finished;

        previousRef.current = { index: currentIndex, finished: isFinished };

        if (!steepEnded && !justFinished) {
            return;
        }

        if (skipSignalRef.current) {
            skipSignalRef.current = false;
            return;
        }

        playSteepSignal(justFinished ? "finished" : "steep");
    }, [currentIndex, isFinished]);

    useEffect(() => {
        if (isFinished || isIdle) {
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
    // formatSteepTime отдаёт «мм:сс» от минуты и выше — подпись «сек» там
    // была неверной: на странице ассама висело «4:00 сек».
    const unitLabel = displaySeconds >= 60 ? "мин" : "сек";

    function start() {
        // AudioContext можно создать только по жесту пользователя.
        primeSteepSignal();
        send({ type: "START" });
    }

    function skip() {
        skipSignalRef.current = true;
        send({ type: "SKIP" });
    }

    function reset() {
        skipSignalRef.current = true;
        send({ type: "RESET" });
    }

    return (
        <div className="mt-[20px] rounded-md border-2 border-black/10 p-[16px] dark:border-white/10">
            <div
                aria-live="polite"
                className="mb-[12px] text-[14px] text-black/60 dark:text-white/60"
            >
                {isFinished
                    ? "Все проливы завершены"
                    : isActive
                      ? `Пролив ${currentIndex + 1} из ${totalSteeps}`
                      : "Таймер проливов"}
            </div>

            <div className="mb-3 font-comfortaa text-[40px] font-bold leading-none sm:mb-4 sm:text-[48px]">
                {formatSteepTime(displaySeconds)}
                <span className="ml-[4px] text-[19px] font-normal">{unitLabel}</span>
            </div>

            <div className="flex flex-nowrap items-center gap-[8px]">
                {isIdle || isFinished ? (
                    <TimerIconButton label="Старт" onClick={start}>
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
                        <TimerIconButton label="Пропустить" onClick={skip}>
                            <SkipForwardIcon className="size-4" strokeWidth={2} />
                        </TimerIconButton>
                        <TimerIconButton label="Сброс" onClick={reset}>
                            <RotateCcwIcon className="size-4" strokeWidth={2} />
                        </TimerIconButton>
                    </>
                ) : null}

                {isFinished ? (
                    <TimerIconButton label="Сброс" onClick={reset}>
                        <RotateCcwIcon className="size-4" strokeWidth={2} />
                    </TimerIconButton>
                ) : null}

                {/* Переключатель звука стоит в том же ряду и тем же элементом,
                    что остальные кнопки таймера, — отдельной строки и новых
                    стилей для него не заводим. */}
                <TimerIconButton
                    label={soundOn ? "Выключить звук сигнала" : "Включить звук сигнала"}
                    pressed={soundOn}
                    onClick={() => {
                        const next = !soundOn;
                        setSteepSoundEnabled(next);

                        if (next) {
                            primeSteepSignal();
                        }
                    }}
                >
                    {soundOn ? (
                        <BellIcon className="size-4" strokeWidth={2} />
                    ) : (
                        <BellOffIcon className="size-4" strokeWidth={2} />
                    )}
                </TimerIconButton>
            </div>
        </div>
    );
}
