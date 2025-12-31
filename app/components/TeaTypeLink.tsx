"use client";

import { TeaType } from "@/types/tea";
import { Leaf } from "lucide-react";
import Link from "next/link";

interface Props {
  type?: TeaType;
}

export default function TeaTypeLink({ type }: Props) {
  return (
    <div className="flex gap-1 items-center" href="/puers">
      <Leaf /> <span className="text-[22px]">Пуэр</span>
    </div>
  );
}
