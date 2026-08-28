import type { Metadata } from "next";
import { Geist, Geist_Mono, Comfortaa } from "next/font/google";
import localFont from "next/font/local";
import { Suspense } from "react";
import "./globals.css";
import AdvertisementContainer from "./components/Advertisement/AdvertisementContainer";
import BodyScrollbars from "./components/BodyScrollbars";
import Search from "./components/Search";
import ThemeProvider from "./components/ThemeProvider";
import ThemeToggle from "./components/ThemeToggle";
import { siteConfig } from "@/lib/site";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const comfortaaSans = Comfortaa({
    variable: "--font-comfortaa-sans",
    subsets: ["latin", "cyrillic"],
});

const bainsley = localFont({
    src: [
        {
            path: "./fonts/Bainsley/Bainsley_Roman.woff2",
            weight: "400",
            style: "normal",
        },
        {
            path: "./fonts/Bainsley/Bainsley_Italic.woff2",
            weight: "400",
            style: "italic",
        },
        {
            path: "./fonts/Bainsley/Bainsley_Bold.woff2",
            weight: "700",
            style: "normal",
        },
        {
            path: "./fonts/Bainsley/Bainsley_Bold_Italic.woff2",
            weight: "700",
            style: "italic",
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
    openGraph: {
        type: "website",
        locale: siteConfig.locale,
        url: siteConfig.url,
        siteName: siteConfig.name,
        title: siteConfig.name,
        description: siteConfig.description,
        images: [
            {
                url: siteConfig.ogImage,
                width: 1200,
                height: 630,
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

function SearchFallback() {
    return (
        <div className="flex min-w-0 flex-1 gap-2 border-b-2 py-3 opacity-60">
            <span className="size-5 shrink-0" />
            <span className="min-w-0 flex-1 text-base">Поиск…</span>
        </div>
    );
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ru" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${comfortaaSans.variable} ${bainsley.variable} antialiased selection:bg-main-300`}
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
