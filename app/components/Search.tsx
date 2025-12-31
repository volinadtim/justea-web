"use client";

import { SearchIcon } from "lucide-react";

export default function Search() {
  return (
    <div className="flex border-b-2 gap-2 py-3">
      <SearchIcon />
      <input className="flex-1 text-base" type="text" />
    </div>
  );
}
