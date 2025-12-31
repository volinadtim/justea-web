"use client";

import { useState, useEffect } from "react";

type Props = {
  children: React.ReactNode;
};

export default function ColumnAdvertisement({ children }: Props) {
  return (
    <div className="flex items-center justify-center p-4 h-full">
      <div className="bg-main-500 h-full w-[300px]"></div>
    </div>
  );
}
