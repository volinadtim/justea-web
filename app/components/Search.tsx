"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ClockIcon, SearchIcon } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { addRecentSearch, getRecentSearches } from "@/lib/recent-searches";
import { searchTeas } from "@/lib/search";
import { TEA_TYPE_LABELS } from "@/lib/teas";

const SUGGESTION_LIMIT = 6;

export default function Search() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const containerRef = useRef<HTMLDivElement>(null);

    const urlQuery = pathname === "/search" ? (searchParams.get("q") ?? "") : "";
    const [query, setQuery] = useState(urlQuery);
    const [isOpen, setIsOpen] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        setQuery(urlQuery);
    }, [urlQuery]);

    useEffect(() => {
        setRecentSearches(getRecentSearches());
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const trimmedQuery = query.trim();
    const suggestions = trimmedQuery
        ? searchTeas(trimmedQuery).slice(0, SUGGESTION_LIMIT)
        : [];
    const showRecent = isOpen && !trimmedQuery && recentSearches.length > 0;
    const showSuggestions = isOpen && trimmedQuery.length > 0;
    const showDropdown = showRecent || showSuggestions;

    function navigateToSearch(value: string) {
        const normalized = value.trim();

        if (!normalized) {
            return;
        }

        addRecentSearch(normalized);
        setRecentSearches(getRecentSearches());
        setIsOpen(false);
        router.push(`/search?q=${encodeURIComponent(normalized)}`);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        navigateToSearch(query);
    }

    return (
        <div ref={containerRef} className="relative">
            <form
                onSubmit={handleSubmit}
                className="flex gap-2 border-b-2 py-3"
                role="search"
            >
                <SearchIcon className="shrink-0" />
                <input
                    className="flex-1 bg-transparent text-base outline-none"
                    type="search"
                    name="q"
                    value={query}
                    placeholder="Поиск по названию, типу, аромату, вкусу…"
                    autoComplete="off"
                    aria-label="Поиск чая"
                    aria-expanded={showDropdown}
                    aria-controls="search-suggestions"
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
            </form>

            {showDropdown && (
                <div
                    id="search-suggestions"
                    className="absolute top-full z-10 mt-[8px] w-full border-2 border-black/10 bg-[var(--background)] shadow-sm dark:border-white/10"
                >
                    {showRecent && (
                        <ul>
                            {recentSearches.map((item) => (
                                <li key={item}>
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 px-[12px] py-[10px] text-left text-[16px] hover:bg-black/5 dark:hover:bg-white/5"
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
                    )}

                    {showSuggestions && (
                        <ul>
                            {suggestions.map((tea) => (
                                <li key={tea.id}>
                                    <Link
                                        href={`/${tea.slug}`}
                                        className="block px-[12px] py-[10px] hover:bg-black/5 dark:hover:bg-white/5"
                                        onClick={() => {
                                            addRecentSearch(trimmedQuery);
                                            setRecentSearches(getRecentSearches());
                                            setIsOpen(false);
                                        }}
                                    >
                                        <span className="block text-[16px]">{tea.name}</span>
                                        <span className="text-[14px] text-black/60 dark:text-white/60">
                                            {TEA_TYPE_LABELS[tea.type]}
                                        </span>
                                    </Link>
                                </li>
                            ))}

                            <li className="border-t border-black/10 dark:border-white/10">
                                <button
                                    type="button"
                                    className="w-full px-[12px] py-[10px] text-left text-[16px] hover:bg-black/5 dark:hover:bg-white/5"
                                    onClick={() => navigateToSearch(trimmedQuery)}
                                >
                                    Искать «{trimmedQuery}»
                                </button>
                            </li>
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
