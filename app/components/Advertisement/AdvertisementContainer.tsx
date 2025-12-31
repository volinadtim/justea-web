"use client";

import { useState, useEffect } from "react";
import ColumnAdvertisement from "./ColumnAdvertisement";

type Props = {
  children: React.ReactNode;
};

export default function AdvertisementContainer({ children }: Props) {
  return (
    <div className="grid lg:grid-cols-3 h-full">
      <div>
        <ColumnAdvertisement />
      </div>
      <div className="lg:width-[670px]">{children}</div>
      <div>
        <ColumnAdvertisement />
      </div>
    </div>
  );
}
