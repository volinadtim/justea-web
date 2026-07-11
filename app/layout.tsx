import type { Metadata } from "next";
import { Geist, Geist_Mono, Comfortaa } from "next/font/google";
import localFont from "next/font/local";
import { Suspense } from "react";
import "./globals.css";
import AdvertisementContainer from "./components/Advertisement/AdvertisementContainer";
import Search from "./components/Search";

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

// Import local Bainsley font
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
  title: "Justea",
  description: "Справочник по завариванию чая",
};

function SearchFallback() {
  return (
    <div className="flex gap-2 border-b-2 py-3 opacity-60">
      <span className="size-5" />
      <span className="flex-1 text-base">Поиск…</span>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${comfortaaSans.variable} ${bainsley.variable} antialiased h-full selection:bg-main-300`}
      >
        <AdvertisementContainer>
          <div className="py-[48px] flex flex-col gap-[50px]">
            <Suspense fallback={<SearchFallback />}>
              <Search />
            </Suspense>
            <div>{children}</div>
          </div>
        </AdvertisementContainer>
      </body>
    </html>
  );
}
