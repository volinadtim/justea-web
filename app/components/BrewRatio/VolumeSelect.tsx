"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import Scrollable from "../Scrollable";
import VolumeInput from "./VolumeInput";

interface VolumeSelectProps {
  volume: number;
  onVolumeChange: (value: number) => void;
  options?: number[];
}

const defaultOptions = [50, 100, 200, 300, 500, 1000];
// const defaultOptions = [50, 100, 150, 200, 250, 300, 350, 500, 1000];

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
    // Слушатель вешается только на время, пока список открыт: раньше он висел
    // на документе всегда и проверял попадание на каждый клик по странице.
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (value: number) => {
    onVolumeChange(value);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleCustomVolumeChange = (value: number) => {
    const validatedValue = value; // Math.min(10000, value);
    // setVolume(validatedValue);
    onVolumeChange(validatedValue);
  };

  // Список открывается с клавиатуры и закрывается Escape: до этого он
  // открывался только по фокусу и не закрывался вообще ничем, кроме клика мимо.
  const handleKeyDown = (event: React.KeyboardEvent) => {
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
  };

  return (
    // `inline-flex` с базовой линией по тексту: при `inline-block` строка
    // «3.5 гр на 100 мл» на фокусе разъезжалась — «гр на» и «мл» уходили
    // на другую строку, пока список открыт.
    <div
      className="relative inline-flex align-baseline"
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center gap-1 text-[19px]">
        <VolumeInput
          value={volume}
          onChange={handleCustomVolumeChange}
          minWidth={20}
          onFocus={() => setIsOpen(true)}
          ariaExpanded={isOpen}
          ariaControls={isOpen ? listboxId : undefined}
        />
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <Scrollable
          className="absolute top-full left-[50%] translate-x-[-50%] mt-1 max-h-60 bg-main-200 rounded-md shadow-lg z-50"
          options={{ overflow: { x: "hidden" } }}
        >
          <div className="py-1" id={listboxId} role="listbox" aria-label="Объём воды, мл">
            {options.map((option, index) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={volume === option}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`w-full text-center px-4 py-1 hover:bg-main-400 cursor-pointer transition-colors ${
                  activeIndex === index ? "bg-main-400" : ""
                } ${volume === option ? "bg-main-600" : ""}`}
              >
                <span className="font-comfortaa font-bold">{option}</span>
              </button>
            ))}
          </div>
        </Scrollable>
      )}
    </div>
  );
}
