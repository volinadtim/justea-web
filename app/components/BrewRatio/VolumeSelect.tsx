"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import VolumeInput from "./VolumeInput";

interface VolumeSelectProps {
    volume: number;
    onVolumeChange: (value: number) => void;
    options?: number[];
}

const defaultOptions = [50, 100, 200, 300, 500, 1000];

export default function VolumeSelect({
    volume,
    onVolumeChange,
    options = defaultOptions,
}: VolumeSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const listboxId = useId();

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function handlePointerDown(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [isOpen]);

    function handleSelect(value: number) {
        onVolumeChange(value);
        setIsOpen(false);
        setActiveIndex(-1);
    }

    function handleKeyDown(event: React.KeyboardEvent) {
        if (event.key === "Escape") {
            setIsOpen(false);
            setActiveIndex(-1);
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();

            if (!isOpen) {
                setIsOpen(true);
                setActiveIndex(0);
                return;
            }

            setActiveIndex((index) => Math.min(index + 1, options.length - 1));
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
            return;
        }

        if (event.key === "Enter" && isOpen && activeIndex >= 0) {
            event.preventDefault();
            handleSelect(options[activeIndex]);
        }
    }

    return (
        // `inline-flex` с базовой линией по тексту: раньше здесь был
        // `inline-block`, и при открытии списка строка «5 гр на 100 мл»
        // разъезжалась — «гр на» и «мл» уходили на другую строку.
        <span
            className="relative inline-flex align-baseline"
            ref={dropdownRef}
            onKeyDown={handleKeyDown}
        >
            <VolumeInput
                value={volume}
                onChange={onVolumeChange}
                minWidth={28}
                onFocus={() => setIsOpen(true)}
                ariaExpanded={isOpen}
                ariaControls={isOpen ? listboxId : undefined}
            />

            {isOpen && (
                <ul
                    id={listboxId}
                    role="listbox"
                    aria-label="Объём воды, мл"
                    // Открывается вверх: внизу страницы список упирался
                    // в край экрана и обрезался.
                    className="absolute bottom-full left-1/2 z-50 mb-[6px] max-h-60 w-[94px] -translate-x-1/2 overflow-auto rounded-md border-2 border-line bg-surface py-[4px] shadow-lg"
                >
                    {options.map((option, index) => {
                        const isSelected = volume === option;
                        const isActive = activeIndex === index;

                        return (
                            <li key={option} role="none">
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    className={[
                                        "w-full px-[12px] py-[6px] text-center transition-colors",
                                        isActive ? "bg-black/10 dark:bg-white/10" : "",
                                        isSelected ? "font-bold underline underline-offset-4" : "",
                                    ].join(" ")}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onClick={() => handleSelect(option)}
                                >
                                    <span className="font-comfortaa font-bold">{option}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </span>
    );
}
