"use client";

import { useState, useEffect } from "react";
import BlockAdvertisement from "./BlockAdvertisement";

type Props = {
  children?: React.ReactNode;
};

export default function ColumnAdvertisement({ children }: Props) {
  return (
    <div className="flex items-center justify-center p-4 h-full">
      <div className="h-full w-[300px]">
        <BlockAdvertisement />
      </div>
    </div>
  );
}
