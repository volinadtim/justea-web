"use client";

import { useState, useEffect } from "react";
import BlockAdvertisement from "./BlockAdvertisement";

type Props = {
  children: React.ReactNode;
};

export default function RowAdvertisement({ children }: Props) {
  return (
    <div className="flex items-center justify-center">
      <div className="h-[115px] w-full">
        <BlockAdvertisement />
      </div>
    </div>
  );
}
