"use client";

import { useEffect } from "react";
import { addRecentTea } from "@/lib/recent-teas";

type Props = {
    slug: string;
};

export default function RecentTeaTracker({ slug }: Props) {
    useEffect(() => {
        addRecentTea(slug);
    }, [slug]);

    return null;
}
