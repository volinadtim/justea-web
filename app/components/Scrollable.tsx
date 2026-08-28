"use client";

import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import type { OverlayScrollbarsComponentProps } from "overlayscrollbars-react";
import type { PartialOptions } from "overlayscrollbars";

/** Тема скроллбаров, описана в globals.css */
export const SCROLLBAR_THEME = "os-theme-justea";

type Props = Omit<OverlayScrollbarsComponentProps, "options"> & {
    options?: PartialOptions;
};

/**
 * Контейнер со скроллом: нативный скроллбар скрыт, кастомный рисуется
 * поверх контента и не занимает ширину/высоту.
 */
export default function Scrollable({ options, ...props }: Props) {
    return (
        <OverlayScrollbarsComponent
            defer
            options={{
                ...options,
                scrollbars: {
                    theme: SCROLLBAR_THEME,
                    autoHide: "leave",
                    autoHideDelay: 500,
                    ...options?.scrollbars,
                },
            }}
            {...props}
        />
    );
}
