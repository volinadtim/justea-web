"use client";

import React from "react";

const ArrowHintBottom = () => (
  <svg
    width="29"
    height="21"
    viewBox="0 0 29 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.94531 0.567383C2.94531 0.567383 5.04331 5.33901 8.5359 9.26622C10.3452 11.3007 12.7045 12.9425 14.755 14.1821C21.1594 18.054 27.4869 17.6544 27.4869 17.6544"
      stroke="black"
    />
    <path
      d="M1.39062 8.64487L2.94399 0.567383L11.0215 1.81007"
      stroke="black"
    />
  </svg>
);

const ArrowHintRight = (
  <svg
    width="44"
    height="42"
    viewBox="0 0 44 42"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.4356 32.3564L6.19672 26.9959L11.2876 20.6027" stroke="black" />
    <path
      d="M7.04291 26.9334C10.5428 27.9334 17.5428 26.9335 21.5428 22.9334C26.1526 18.3236 29.0428 12.9335 37.0429 12.9335"
      stroke="black"
    />
  </svg>
);

const ArrowHintTop = (
  <svg
    width="29"
    height="21"
    viewBox="0 0 29 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.94531 0.567383C2.94531 0.567383 5.04331 5.33901 8.5359 9.26622C10.3452 11.3007 12.7045 12.9425 14.755 14.1821C21.1594 18.054 27.4869 17.6544 27.4869 17.6544"
      stroke="black"
    />
    <path
      d="M1.39062 8.64487L2.94399 0.567383L11.0215 1.81007"
      stroke="black"
    />
  </svg>
);

type Props = {
  position: "top" | "right" | "bottom";
  children: React.ReactNode;
  className?: string;
};

export default function ArrowHint({ position, children, className }: Props) {
  switch (position) {
    case "bottom": {
      return (
        <div className={className}>
          <div className="relative">
            <div className="absolute">
              <ArrowHintBottom />
            </div>
            <div className="absolute left-[33px] top-[6px]">{children}</div>
          </div>
        </div>
      );
    }
    case "top": {
      return (
        <div className="relative">
          <div className="absolute">
            <ArrowHintTop />
          </div>
        </div>
      );
    }
  }
  return <div>ArrowHint</div>;
}
