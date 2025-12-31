"use client";

import React, { useState, useRef, useEffect, ChangeEvent } from "react";

interface VolumeInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  minWidth?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function VolumeInput({
  value,
  onChange,
  placeholder = "",
  minWidth = 10,
  onFocus,
  onBlur,
}: VolumeInputProps) {
  console.log(value);
  const [displayValue, setDisplayValue] = useState(value.toString());
  const spanRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync displayValue with external value prop
  useEffect(() => {
    // Only update if the external value is different from current display value
    // This prevents infinite loops and maintains user input during editing
    if (parseFloat(displayValue) !== value) {
      setDisplayValue(value.toString());
    }
  }, [value, displayValue]);

  // Measure text width and adjust input
  useEffect(() => {
    if (spanRef.current && inputRef.current) {
      // Get computed styles from input
      const inputStyles = window.getComputedStyle(inputRef.current);

      // Apply the same styles to the span for accurate measurement
      spanRef.current.style.fontSize = inputStyles.fontSize;
      spanRef.current.style.fontFamily = inputStyles.fontFamily;
      spanRef.current.style.fontWeight = inputStyles.fontWeight;
      spanRef.current.style.letterSpacing = inputStyles.letterSpacing;
      spanRef.current.style.paddingLeft = inputStyles.paddingLeft;
      spanRef.current.style.paddingRight = inputStyles.paddingRight;

      // Measure width and set input width
      const width = spanRef.current.offsetWidth;
      inputRef.current.style.width = `${Math.max(width, minWidth) + 4}px`;
    }
  }, [displayValue, placeholder, minWidth]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // Allow only digits
    const digitsOnly = rawValue.replace(/[^\d]/g, "");

    // Update display value
    setDisplayValue(digitsOnly);

    // Convert to number and call onChange if valid
    const numValue = parseInt(digitsOnly, 10);
    if (!isNaN(numValue)) {
      onChange(numValue);
    } else if (digitsOnly === "") {
      onChange(0);
    }
  };

  const handleBlur = () => {
    // If empty, set to 0
    if (onBlur) {
      onBlur();
    }
    if (displayValue === "") {
      setDisplayValue("0");
      onChange(0);
    }
  };

  const displayText = displayValue || placeholder;

  return (
    <div className="relative inline-block">
      {/* Hidden span for measurement */}
      <span
        ref={spanRef}
        className="invisible absolute whitespace-pre pointer-events-none min-w-0 font-comfortaa font-bold text-center border-b text-[19px]"
        aria-hidden="true"
      >
        {displayText}
      </span>

      {/* Actual input */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="\d*"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        maxLength={5}
        placeholder={placeholder}
        className="min-w-0 font-comfortaa font-bold text-center border-b text-[19px] transition-all duration-400"
        style={{ minWidth: `${minWidth}px` }}
        onFocus={() => onFocus && onFocus()}
      />
    </div>
  );
}
