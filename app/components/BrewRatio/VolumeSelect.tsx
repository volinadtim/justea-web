"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value: number) => {
    onVolumeChange(value);
    setIsOpen(false);
  };

  const handleCustomVolumeChange = (value: number) => {
    const validatedValue = value; // Math.min(10000, value);
    // setVolume(validatedValue);
    onVolumeChange(validatedValue);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div className="flex items-center gap-1 text-[19px]">
        <VolumeInput
          value={volume}
          onChange={handleCustomVolumeChange}
          minWidth={20}
          onFocus={() => setIsOpen(true)}
        />
        {/* // onBlur={() => setTimeout(() => setIsOpen(false))} */}
        {/* Dropdown toggle */}
        {/* <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Toggle volume options"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button> */}
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-[50%] translate-x-[-50%] mt-1 max-h-60 overflow-y-auto bg-main-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full text-center px-4 py-1 hover:bg-main-400 cursor-pointer transition-colors ${
                  volume === option ? "bg-main-600" : ""
                }`}
              >
                <span className="font-comfortaa font-bold">{option}</span> 
                {/* мл */}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
