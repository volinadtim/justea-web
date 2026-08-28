"use client";

import { ClockIcon, SearchIcon, XIcon } from "lucide-react";
import {
    FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Scrollable from "./Scrollable";
import SearchTeaCard from "./SearchTeaCard";
import { addRecentSearch, getRecentSearches } from "@/lib/recent-searches";
import { searchTeas } from "@/lib/search";
import {
    getAllTeas,
    getAvailableTeaTypes,
    TEA_TYPE_LABELS,
} from "@/lib/teas";
import { TeaType } from "@/types/tea";

const ANIMATION_MS = 500;
const REVEAL_ORIGIN_OFFSET_Y = -72;
const REVEAL_ORIGIN_OFFSET_X = 48;

function filterPillClass(isActive: boolean) {
    return [
        "shrink-0 rounded-full border-2 px-[12px] py-[5px] text-[14px] transition-colors sm:px-[14px] sm:py-[6px] sm:text-[15px]",
        isActive
            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
            : "border-black/20 hover:border-black/40 dark:border-white/20 dark:hover:border-white/40",
    ].join(" ");
}

function getRevealRadius(originX: number, originY: number, width: number, height: number) {
    const corners: [number, number][] = [
        [0, 0],
        [width, 0],
        [0, height],
        [width, height],
    ];

    return Math.max(
        ...corners.map(([x, y]) => Math.hypot(x - originX, y - originY))
    );
}

export default function Search() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const inputRef = useRef<HTMLInputElement>(null);
    const panelInputRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const urlQuery = pathname === "/search" ? (searchParams.get("q") ?? "") : "";
    const [query, setQuery] = useState(urlQuery);
    const [isOpen, setIsOpen] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [activeType, setActiveType] = useState<TeaType | undefined>();
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [origin, setOrigin] = useState({ x: 0, y: 0 });
    const [revealRadius, setRevealRadius] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        setQuery(urlQuery);
    }, [urlQuery]);

    useEffect(() => {
        setRecentSearches(getRecentSearches());
    }, []);

    const trimmedQuery = query.trim();
    const availableTypes = getAvailableTeaTypes();

    const results = useMemo(() => {
        const base = trimmedQuery ? searchTeas(trimmedQuery) : getAllTeas();

        if (!activeType) {
            return base;
        }

        return base.filter((tea) => tea.type === activeType);
    }, [trimmedQuery, activeType]);

    const updateRevealGeometry = useCallback(() => {
        const input = inputRef.current;
        const panel = panelRef.current;

        if (!input) {
            return;
        }

        const rect = input.getBoundingClientRect();
        const panelHeight =
            panel?.offsetHeight ??
            (window.innerWidth >= 768 ? window.innerHeight * 0.75 : window.innerHeight);
        const panelWidth = panel?.offsetWidth ?? window.innerWidth;

        const nextOrigin = {
            x: rect.left + rect.width * 0.65 + REVEAL_ORIGIN_OFFSET_X,
            y: REVEAL_ORIGIN_OFFSET_Y,
        };

        setOrigin(nextOrigin);
        setRevealRadius(getRevealRadius(nextOrigin.x, nextOrigin.y, panelWidth, panelHeight));
    }, []);

    const openSearch = useCallback(() => {
        updateRevealGeometry();
        setIsClosing(false);
        setIsOpen(true);
    }, [updateRevealGeometry]);

    const closeSearch = useCallback(() => {
        if (!isOpen || isClosing) {
            return;
        }

        setIsRevealed(false);
        setIsClosing(true);

        window.setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, ANIMATION_MS);
    }, [isOpen, isClosing]);

    useEffect(() => {
        if (!isOpen) {
            setIsRevealed(false);
            return;
        }

        updateRevealGeometry();

        const frame = window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => setIsRevealed(true));
        });

        const focusFrame = window.requestAnimationFrame(() => {
            panelInputRef.current?.focus();
        });

        return () => {
            window.cancelAnimationFrame(frame);
            window.cancelAnimationFrame(focusFrame);
        };
    }, [isOpen, updateRevealGeometry]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function handleResize() {
            updateRevealGeometry();
        }

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [isOpen, updateRevealGeometry]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        document.documentElement.classList.add("scroll-locked");

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                closeSearch();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.documentElement.classList.remove("scroll-locked");
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, closeSearch]);

    function navigateToSearch(value: string) {
        const normalized = value.trim();

        if (!normalized) {
            return;
        }

        addRecentSearch(normalized);
        setRecentSearches(getRecentSearches());
        closeSearch();
        router.push(`/search?q=${encodeURIComponent(normalized)}`);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        navigateToSearch(query);
    }

    function handleTeaSelect() {
        if (trimmedQuery) {
            addRecentSearch(trimmedQuery);
            setRecentSearches(getRecentSearches());
        }
        closeSearch();
    }

    const panel = isOpen ? (
        <>
            <div
                className="fixed inset-0 z-40 hidden bg-black/20 md:block"
                onClick={closeSearch}
                aria-hidden
            />

            <div
                ref={panelRef}
                className="fixed inset-x-0 top-0 z-50 h-[100dvh] overflow-hidden md:h-[75dvh]"
                role="dialog"
                aria-modal="true"
                aria-label="Поиск чая"
                style={{
                    clipPath: isRevealed
                        ? `circle(${revealRadius}px at ${origin.x}px ${origin.y}px)`
                        : `circle(0px at ${origin.x}px ${origin.y}px)`,
                    transition: `clip-path ${ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                }}
            >
                <div className="flex h-full flex-col bg-[var(--background)] px-[16px] pb-[16px] pt-[12px] sm:px-[24px] sm:pb-[20px] sm:pt-[16px]">
                    <form
                        onSubmit={handleSubmit}
                        className="mb-[12px] flex shrink-0 items-center gap-[10px] border-b-2 border-black/15 pb-[12px] dark:border-white/15 sm:mb-[16px]"
                        role="search"
                    >
                        <SearchIcon className="size-5 shrink-0 sm:size-6" />
                        <input
                            ref={panelInputRef}
                            className="min-w-0 flex-1 bg-transparent text-[16px] outline-none sm:text-[18px]"
                            type="search"
                            name="q"
                            value={query}
                            placeholder="Поиск по названию, типу, аромату, вкусу…"
                            autoComplete="off"
                            aria-label="Поиск чая"
                            onChange={(event) => setQuery(event.target.value)}
                        />
                        <button
                            type="button"
                            className="shrink-0 rounded-full border-2 border-black/15 p-[6px] transition-colors hover:border-black/40 dark:border-white/15 dark:hover:border-white/40"
                            onClick={closeSearch}
                            aria-label="Закрыть поиск"
                        >
                            <XIcon className="size-5" />
                        </button>
                    </form>

                    <Scrollable
                        className="mb-[12px] shrink-0 sm:mb-[16px]"
                        options={{ overflow: { y: "hidden" } }}
                    >
                        <nav
                            aria-label="Фильтр по типу чая"
                            className="flex gap-[8px]"
                        >
                            <button
                                type="button"
                                className={filterPillClass(!activeType)}
                                onClick={() => setActiveType(undefined)}
                            >
                                Все
                            </button>
                            {availableTypes.map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    className={filterPillClass(activeType === type)}
                                    onClick={() =>
                                        setActiveType(activeType === type ? undefined : type)
                                    }
                                >
                                    {TEA_TYPE_LABELS[type]}
                                </button>
                            ))}
                        </nav>
                    </Scrollable>

                    <Scrollable
                        className="min-h-0 flex-1"
                        options={{ overflow: { x: "hidden" } }}
                    >
                        {!trimmedQuery && recentSearches.length > 0 && (
                            <section className="mb-[16px]">
                                <h2 className="mb-[8px] text-[13px] uppercase tracking-wide text-black/50 dark:text-white/50">
                                    Недавние запросы
                                </h2>
                                <ul className="flex flex-col gap-[4px]">
                                    {recentSearches.map((item) => (
                                        <li key={item}>
                                            <button
                                                type="button"
                                                className="flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[8px] text-left text-[15px] hover:bg-black/5 dark:hover:bg-white/5"
                                                onClick={() => {
                                                    setQuery(item);
                                                    navigateToSearch(item);
                                                }}
                                            >
                                                <ClockIcon className="size-4 shrink-0 opacity-60" />
                                                {item}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        <section>
                            {trimmedQuery ? (
                                <h2 className="mb-[10px] text-[13px] uppercase tracking-wide text-black/50 dark:text-white/50">
                                    {results.length > 0
                                        ? `Найдено: ${results.length}`
                                        : "Ничего не найдено"}
                                </h2>
                            ) : (
                                <h2 className="mb-[10px] text-[13px] uppercase tracking-wide text-black/50 dark:text-white/50">
                                    {activeType
                                        ? TEA_TYPE_LABELS[activeType]
                                        : "Все чаи"}
                                </h2>
                            )}

                            {results.length > 0 ? (
                                <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 lg:grid-cols-3">
                                    {results.map((tea) => (
                                        <SearchTeaCard
                                            key={tea.id}
                                            tea={tea}
                                            onSelect={handleTeaSelect}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[16px] text-black/70 dark:text-white/70">
                                    {trimmedQuery
                                        ? `По запросу «${trimmedQuery}» ничего не найдено.`
                                        : "Чаи этого типа пока нет в справочнике."}
                                </p>
                            )}

                            {trimmedQuery && results.length > 0 && (
                                <button
                                    type="button"
                                    className="mt-[12px] text-[15px] underline underline-offset-4 hover:opacity-70"
                                    onClick={() => navigateToSearch(trimmedQuery)}
                                >
                                    Открыть все результаты по запросу «{trimmedQuery}»
                                </button>
                            )}
                        </section>
                    </Scrollable>
                </div>
            </div>
        </>
    ) : null;

    return (
        <>
            <div className="relative min-w-0 flex-1">
                <form
                    onSubmit={handleSubmit}
                    className="flex min-w-0 gap-2 border-b-2 py-3"
                    role="search"
                >
                    <SearchIcon className="size-5 shrink-0 sm:size-6" />
                    <input
                        ref={inputRef}
                        className="min-w-0 flex-1 bg-transparent text-[16px] outline-none sm:text-[18px]"
                        type="search"
                        name="q"
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            openSearch();
                        }}
                        onFocus={openSearch}
                        placeholder="Поиск чая…"
                        autoComplete="off"
                        aria-label="Поиск чая"
                        aria-expanded={isOpen}
                    />
                </form>
            </div>

            {mounted && panel ? createPortal(panel, document.body) : null}
        </>
    );
}
