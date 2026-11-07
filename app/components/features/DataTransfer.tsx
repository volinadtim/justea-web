"use client";

import { DownloadIcon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import QuickBrewButton from "./QuickBrewButton";
import {
    applyTransferFile,
    buildTransferFile,
    ImportMode,
    parseTransferFile,
    transferFileName,
    TransferError,
    TransferFile,
    TransferSummary,
} from "@/lib/journal/transfer";

type Pending = {
    file: TransferFile;
    summary: TransferSummary;
};

function countLine(summary: TransferSummary): string {
    const parts = [
        `записей дневника: ${summary.sessions}`,
        `чаёв с историей заваривания: ${summary.brews}`,
        `избранного: ${summary.favorites}`,
        `просмотренных: ${summary.recentTeas}`,
        `запросов поиска: ${summary.searchHistory}`,
    ];

    return parts.join(", ");
}

/**
 * Перенос данных: выгрузка в JSON и загрузка обратно. Аккаунта нет, поэтому
 * файл — единственный способ перевезти накопленное на другой телефон или
 * вернуть после очистки браузера.
 */
export default function DataTransfer() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [pending, setPending] = useState<Pending | null>(null);
    const [confirmReplace, setConfirmReplace] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState<string | null>(null);

    function handleExport() {
        const data = buildTransferFile();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = transferFileName();
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        setError(null);
        setDone("Файл выгружен.");
    }

    async function handleFile(file: File) {
        setError(null);
        setDone(null);
        setConfirmReplace(false);

        try {
            const text = await file.text();
            setPending(parseTransferFile(text));
        } catch (cause) {
            setPending(null);
            setError(
                cause instanceof TransferError
                    ? cause.message
                    : "Файл не удалось прочитать."
            );
        }
    }

    function apply(mode: ImportMode) {
        if (!pending) {
            return;
        }

        applyTransferFile(pending.file, mode);
        setDone(
            mode === "replace"
                ? "Данные заменены данными из файла."
                : "Данные из файла добавлены к вашим."
        );
        setPending(null);
        setConfirmReplace(false);
    }

    return (
        <section className="mt-[40px] border-t-2 border-black/10 pt-[24px] dark:border-white/10">
            <h2 className="mb-[12px] text-[24px] leading-none sm:text-[28px]">Данные</h2>
            <p className="mb-[12px] text-[17px] leading-[1.4]">
                Дневник, избранное и история просмотров лежат только в этом браузере.
                Выгрузите их в файл, чтобы перенести на другое устройство или сохранить
                на случай, если браузер очистят.
            </p>
            <p className="mb-[16px] text-[17px] leading-[1.4]">
                В файл попадают: дневник сессий и история запусков таймера, избранные
                чаи, недавно просмотренные и история поиска. Состав подписан внутри
                файла по-русски; если выгрузку кому-то пересылают, раздел с историей
                поиска можно удалить, остальное от этого не сломается.
            </p>

            <div className="flex flex-wrap gap-[8px]">
                <QuickBrewButton
                    label="Выгрузить JSON"
                    icon={<DownloadIcon className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />}
                    onClick={handleExport}
                />
                <QuickBrewButton
                    label="Загрузить из файла"
                    variant="secondary"
                    icon={<UploadIcon className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />}
                    onClick={() => inputRef.current?.click()}
                />
                <input
                    ref={inputRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (file) {
                            handleFile(file);
                        }

                        // Чтобы тот же файл можно было выбрать повторно.
                        event.target.value = "";
                    }}
                />
            </div>

            {error && (
                <p className="mt-[16px] text-[17px] leading-[1.4]">{error}</p>
            )}

            {done && !pending && (
                <p className="mt-[16px] text-[17px] leading-[1.4]">{done}</p>
            )}

            {pending && (
                <div className="mt-[16px] rounded-md border-2 border-black/10 p-[16px] dark:border-white/10">
                    <p className="mb-[8px] text-[17px] leading-[1.4]">
                        В файле: {countLine(pending.summary)}.
                    </p>

                    {pending.summary.fromNewerVersion && (
                        <p className="mb-[8px] text-[17px] leading-[1.4]">
                            Файл сделан более новой версией сайта. Незнакомые поля при
                            загрузке потеряются.
                        </p>
                    )}

                    {confirmReplace ? (
                        <>
                            <p className="mb-[12px] text-[17px] leading-[1.4]">
                                Замена удалит то, что сейчас в этом браузере. Если эти
                                записи нужны, сначала выгрузите их в файл.
                            </p>
                            <div className="flex flex-wrap gap-[8px]">
                                <button
                                    type="button"
                                    className="min-h-11 shrink-0 rounded-full border-2 border-black bg-black px-[14px] text-[16px] text-white dark:border-white dark:bg-white dark:text-black"
                                    onClick={() => apply("replace")}
                                >
                                    Заменить
                                </button>
                                <button
                                    type="button"
                                    className="min-h-11 shrink-0 rounded-full border-2 border-black/20 px-[14px] text-[16px] transition-colors hover:border-black/40 dark:border-white/20 dark:hover:border-white/40"
                                    onClick={() => setConfirmReplace(false)}
                                >
                                    Отмена
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-wrap gap-[8px]">
                            <button
                                type="button"
                                className="min-h-11 shrink-0 rounded-full border-2 border-black bg-black px-[14px] text-[16px] text-white transition-colors hover:border-black/80 hover:bg-black/80 dark:border-white dark:bg-white dark:text-black dark:hover:border-white/80 dark:hover:bg-white/80"
                                onClick={() => apply("merge")}
                            >
                                Добавить к моим
                            </button>
                            <button
                                type="button"
                                className="min-h-11 shrink-0 rounded-full border-2 border-black/20 px-[14px] text-[16px] transition-colors hover:border-black/40 dark:border-white/20 dark:hover:border-white/40"
                                onClick={() => setConfirmReplace(true)}
                            >
                                Заменить всё
                            </button>
                            <button
                                type="button"
                                className="min-h-11 shrink-0 rounded-full border-2 border-black/20 px-[14px] text-[16px] transition-colors hover:border-black/40 dark:border-white/20 dark:hover:border-white/40"
                                onClick={() => setPending(null)}
                            >
                                Отмена
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
