import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import localFont from "next/font/local";
import { Suspense } from "react";
import "./globals.css";
import AdvertisementContainer from "./components/Advertisement/AdvertisementContainer";
import BodyScrollbars from "./components/BodyScrollbars";
import Search from "./components/Search";
import SiteJsonLd from "./components/seo/SiteJsonLd";
import ThemeProvider from "./components/ThemeProvider";
import ThemeToggle from "./components/ThemeToggle";
import { absoluteUrl, siteConfig } from "@/lib/site";

const comfortaaSans = Comfortaa({
    variable: "--font-comfortaa-sans",
    subsets: ["latin", "cyrillic"],
});

/**
 * Bainsley: только Roman и Bold.
 *
 * Italic и Bold Italic (333 КБ) убраны из набора: класса `italic` и тега `em`
 * нет ни в одном компоненте, а предзагружались они на каждой странице —
 * находка 3.1 аудита. `next/font/local` не умеет `preload: false` для
 * отдельного начертания, только для всего набора, поэтому компромисса
 * «оставить доступными, но не качать» здесь нет: либо грузим всегда, либо не
 * подключаем.
 *
 * Файлы остались в `app/fonts/Bainsley/`. Если justea-voice понадобится
 * курсив в текстах `/guides` или `/health` — скажите, верну отдельным
 * загрузчиком: без реального начертания браузер нарисует синтетический наклон.
 * Решение согласовано с justea-design 06.11.2026.
 */
const bainsley = localFont({
    src: [
        {
            path: "./fonts/Bainsley/Bainsley_Roman.woff2",
            weight: "400",
            style: "normal",
        },
        {
            path: "./fonts/Bainsley/Bainsley_Bold.woff2",
            weight: "700",
            style: "normal",
        },
    ],
    variable: "--font-bainsley",
});

export const metadata: Metadata = {
    metadataBase: new URL(siteConfig.url),
    title: {
        default: siteConfig.name,
        template: `%s — ${siteConfig.name}`,
    },
    description: siteConfig.description,
    applicationName: siteConfig.name,
    // Подтверждение прав в панелях вебмастеров. Значения приходят из env,
    // пустые не выводятся — см. `siteConfig.verification`.
    verification: {
        ...(siteConfig.verification.google
            ? { google: siteConfig.verification.google }
            : {}),
        ...(siteConfig.verification.yandex
            ? { yandex: siteConfig.verification.yandex }
            : {}),
    },
    openGraph: {
        type: "website",
        locale: siteConfig.locale,
        url: absoluteUrl("/"),
        siteName: siteConfig.name,
        title: siteConfig.name,
        description: siteConfig.description,
        images: [
            {
                url: siteConfig.ogImage,
                width: siteConfig.ogImageWidth,
                height: siteConfig.ogImageHeight,
                alt: siteConfig.name,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: siteConfig.name,
        description: siteConfig.description,
        images: [siteConfig.ogImage],
    },
};

/**
 * Заглушка строки поиска на время Suspense.
 *
 * Высота обязана совпадать с реальным `Search`, иначе при подстановке контент
 * уезжает вниз: это давало CLS 0.188 при пороге Google 0.1 (находка 3.2
 * аудита). Поэтому здесь не подобранная в пикселях высота, а та же структура —
 * `flex` + `py-3` + `border-b-2` и распорка `h-6` вместо инпута. Тогда высота
 * сходится сама при любом кегле. Размеры сверены с justea-design.
 */
function SearchFallback() {
    return (
        <div className="flex min-w-0 flex-1 items-center gap-2 border-b-2 py-3 opacity-60">
            <span className="size-5 shrink-0 sm:size-6" />
            <span className="flex h-6 min-w-0 flex-1 items-center text-[16px] sm:text-[18px]">
                Поиск…
            </span>
        </div>
    );
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang={siteConfig.defaultLocale.code} suppressHydrationWarning>
            <head>
                <SiteJsonLd />
            </head>
            <body
                className={`${comfortaaSans.variable} ${bainsley.variable} antialiased selection:bg-main-300`}
            >
                <BodyScrollbars />
                <ThemeProvider>
                    <AdvertisementContainer>
                        <div className="flex flex-col gap-8 px-4 py-6 sm:gap-10 sm:px-6 sm:py-8 lg:gap-[50px] lg:px-0 lg:py-[48px]">
                            <div className="flex min-w-0 items-start gap-3">
                                <Suspense fallback={<SearchFallback />}>
                                    <Search />
                                </Suspense>
                                <ThemeToggle />
                            </div>
                            <div>{children}</div>
                        </div>
                    </AdvertisementContainer>
                </ThemeProvider>
            </body>
        </html>
    );
}
