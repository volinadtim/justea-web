"use client";

import { HashIcon, TimerIcon } from "lucide-react";
import Scrollable from "./Scrollable";

type Props = {
    steeps: number[];
    activeIndex?: number | null;
};

/**
 * Китайские цифры для нумерации проливов.
 *
 * Раньше это был массив ровно из шести значений, и седьмой пролив молча
 * оставался без номера. Для гунфу-ча пуэра это не теория: там обычно
 * 8–10 проливов.
 *
 * Выше десяти китайская запись становится составной (十一, 十二), поэтому
 * с одиннадцатого переходим на арабские цифры — читаемый номер лучше
 * составного иероглифа в узкой колонке.
 */
const CHINESE_NUMERALS = [
    "一",
    "二",
    "三",
    "四",
    "五",
    "六",
    "七",
    "八",
    "九",
    "十",
];

function steepNumber(index: number): string {
    return CHINESE_NUMERALS[index] ?? String(index + 1);
}

function SteepTimeDisplay({
    value,
    isActive,
}: {
    value: number;
    isActive: boolean;
}) {
    return (
        // Горизонтального поля здесь нет намеренно: ячейка и так растянута
        // на ширину колонки, текст в ней центрирован, а два пикселя поля
        // прибавлялись к расчётной ширине колонки и перебивали её минимум
        // на 0,16 px — ровно настолько уезжала вся строка.
        <div className="relative flex flex-col gap-1 py-[2px]">
            {isActive ? (
                <span
                    aria-hidden
                    className="absolute -inset-x-[8px] -inset-y-[6px] rounded-md bg-neutral-700/25 dark:bg-neutral-500/40"
                />
            ) : null}
            <div className="relative text-center font-comfortaa text-[19px] font-bold leading-none">
                {value}
            </div>
            <span className="relative text-center text-[14px] leading-none">сек</span>
        </div>
    );
}

/**
 * Таблица проливов: номер и время.
 *
 * Обе строки лежат в одной сетке, и это важно по двум причинам.
 *
 * Колонка шириной `minmax(--steep-cell, max-content)` не обрезает и не
 * выпускает содержимое наружу: пока значение узкое, колонка держит прежние
 * 26 px (29 px от `sm`), а трёхзначное время раздвигает её. До этого ширина
 * была жёсткой, и «300 сек» (35 px) вылезало за свои 26 px, съедая промежуток
 * между колонками. На каталоге из восьми чаёв это не проявлялось, на двадцати
 * четырёх — в тринадцати способах сразу, а у холодной заварки время
 * пятизначное.
 *
 * Прокрутка у строк теперь общая. Раньше у каждой строки был свой контейнер
 * прокрутки, и на телефоне при десяти проливах строки разъезжались: номера
 * оставались на месте, время уезжало, и номер переставал соответствовать
 * своему времени.
 */
export default function SteepsTable({ steeps, activeIndex = null }: Props) {
    return (
        <Scrollable
            className="-mx-1 min-w-0 flex-1 px-1 sm:mx-0 sm:px-0"
            options={{ overflow: { y: "hidden" } }}
        >
            <div
                className="grid w-max items-center gap-x-3 gap-y-3 [--steep-cell:26px] sm:gap-x-4 sm:gap-y-[15px] sm:[--steep-cell:29px]"
                style={{
                    gridTemplateColumns: `max-content repeat(${steeps.length}, minmax(var(--steep-cell), max-content))`,
                }}
            >
                {/* Иконка отбита от значений так же, как раньше: столбец сетки
                    даёт 12 px (16 px от `sm`), остальное добирает поле. */}
                <HashIcon className="mr-[4px] shrink-0 sm:mr-[17px]" />
                {steeps.map((_, index) => (
                    // `max-w` держит номер вне расчёта ширины колонки: иероглиф
                    // на доли пикселя шире ячейки, и без ограничения колонка
                    // подросла бы на 0,16 px, сдвинув всё следующее за ней.
                    // Раздвигать колонку должно только время.
                    <div
                        key={index}
                        className="max-w-[var(--steep-cell)] text-center font-comfortaa text-[14px] font-bold leading-none"
                    >
                        {steepNumber(index)}
                    </div>
                ))}

                <TimerIcon className="mr-[4px] shrink-0 sm:mr-[17px]" />
                {steeps.map((value, index) => (
                    <SteepTimeDisplay
                        key={index}
                        value={value}
                        isActive={activeIndex === index}
                    />
                ))}
            </div>
        </Scrollable>
    );
}
