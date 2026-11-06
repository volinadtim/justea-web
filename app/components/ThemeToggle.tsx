"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button
                type="button"
                className="size-10 shrink-0 rounded-full border-2 border-line"
                aria-label="Загрузка темы"
                disabled
            />
        );
    }

    const isDark = resolvedTheme === "dark";

    return (
        <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-line transition-colors hover:border-line-strong"
            aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
        >
            {isDark ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
        </button>
    );
}
