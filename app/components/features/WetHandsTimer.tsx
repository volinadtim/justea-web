"use client";

import { RotateCcwIcon, SkipForwardIcon, XIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { keepScreenAwake } from "./wake-lock";
import { formatSteepTime } from "@/lib/format-steep-time";

export type TimerStatus = "idle" | "running" | "paused" | "finished";

type Props = {
    totalSteeps: number;
    currentIndex: number;
    remainingSeconds: number;
    status: TimerStatus;
    onPrimary: () => void;
    onSkip: () => void;
    onReset: () => void;
    onClose: () => void;
};

const PRIMARY_HINT: Record<TimerStatus, string> = {
    idle: "Нажмите в любом месте, чтобы начать",
    running: "Нажмите в любом месте — пауза",
    paused: "Нажмите в любом месте, чтобы продолжить",
    finished: "Нажмите в любом месте, чтобы начать заново",
};

function ControlButton({
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
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-black/20 transition-colors hover:border-black/40 dark:border-white/20 dark:hover:border-white/40"
            onClick={onClick}
        >
            {children}
        </button>
    );
}

/**
 * Таймер под мокрые руки: весь экран — одна зона тапа, цифры читаются
 * с расстояния вытянутой руки, мелкие кнопки убраны в один ряд внизу.
 * Собран из тех же элементов, что и обычный блок таймера: та же разметка
 * модального окна, что у поиска, те же шрифты, цвета и круглые кнопки.
 */
export default function WetHandsTimer({
    totalSteeps,
    currentIndex,
    remainingSeconds,
    status,
    onPrimary,
    onSkip,
    onReset,
    onClose,
}: Props) {
    // Открыли на остановленном таймере — значит, хотят заварить: это и есть
    // «один тап». Идущий таймер не трогаем, дальше всем управляет человек.
    const handledOpen = useRef(false);

    useEffect(() => {
        if (handledOpen.current) {
            return;
        }

        handledOpen.current = true;

        if (status === "idle") {
            onPrimary();
        }
    }, [status, onPrimary]);

    useEffect(() => {
        document.documentElement.classList.add("scroll-locked");

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.documentElement.classList.remove("scroll-locked");
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    useEffect(() => {
        if (status !== "running") {
            return;
        }

        return keepScreenAwake();
    }, [status]);

    const statusLine =
        status === "finished"
            ? "Все проливы завершены"
            : `Пролив ${currentIndex + 1} из ${totalSteeps}`;

    const panel = (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Таймер проливов во весь экран"
            className="fixed inset-0 z-50 flex h-[100dvh] flex-col bg-[var(--background)]"
        >
            <button
                type="button"
                aria-label={PRIMARY_HINT[status]}
                className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[16px] px-[16px] text-center"
                onClick={onPrimary}
            >
                <span aria-live="polite" className="text-[19px] text-black/60 dark:text-white/60">
                    {statusLine}
                </span>
                <span className="font-comfortaa text-[96px] font-bold leading-none sm:text-[140px] lg:text-[180px]">
                    {formatSteepTime(remainingSeconds)}
                    <span className="ml-[8px] font-sans text-[24px] font-normal sm:text-[32px]">
                        {remainingSeconds >= 60 ? "мин" : "сек"}
                    </span>
                </span>
                <span className="text-[17px] text-black/60 dark:text-white/60">
                    {PRIMARY_HINT[status]}
                </span>
            </button>

            <div className="flex shrink-0 items-center justify-center gap-[16px] px-[16px] pb-[32px]">
                <ControlButton label="Пропустить пролив" onClick={onSkip}>
                    <SkipForwardIcon className="size-5" strokeWidth={2} />
                </ControlButton>
                <ControlButton label="Сбросить таймер" onClick={onReset}>
                    <RotateCcwIcon className="size-5" strokeWidth={2} />
                </ControlButton>
                <ControlButton label="Выйти из полноэкранного режима" onClick={onClose}>
                    <XIcon className="size-5" strokeWidth={2} />
                </ControlButton>
            </div>
        </div>
    );

    return createPortal(panel, document.body);
}
