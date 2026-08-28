"use client";

import { useEffect } from "react";
import { useOverlayScrollbars } from "overlayscrollbars-react";
import { SCROLLBAR_THEME } from "./Scrollable";

/**
 * Вешает оверлейный скроллбар на скролл всей страницы.
 * Ничего не рендерит — только инициализирует OverlayScrollbars на body.
 */
export default function BodyScrollbars() {
    const [initialize] = useOverlayScrollbars({
        defer: true,
        options: {
            overflow: { x: "hidden" },
            scrollbars: {
                theme: SCROLLBAR_THEME,
                autoHide: "scroll",
                autoHideDelay: 800,
            },
        },
    });

    useEffect(() => {
        initialize({ target: document.body, cancel: { body: false } });
    }, [initialize]);

    return null;
}
