/**
 * Дата и время записи хранятся в ISO, а правятся обычными полями
 * `<input type="date">` и `<input type="time">`, которые работают в местном
 * времени. Здесь перевод туда и обратно, без сторонних библиотек.
 */

function pad(value: number): string {
    return value.toString().padStart(2, "0");
}

export function toDateInputValue(iso: string): string {
    const date = new Date(iso);

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toTimeInputValue(iso: string): string {
    const date = new Date(iso);

    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Собирает ISO из полей формы. Пустое время считаем полуднем. */
export function fromInputValues(dateValue: string, timeValue: string): string | null {
    if (!dateValue) {
        return null;
    }

    const [year, month, day] = dateValue.split("-").map(Number);
    const [hours, minutes] = (timeValue || "12:00").split(":").map(Number);

    if (!year || !month || !day) {
        return null;
    }

    const date = new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);

    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function shiftDays(dateValue: string, days: number): string {
    const [year, month, day] = dateValue.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayInputValue(): string {
    return toDateInputValue(new Date().toISOString());
}

const dayFormatter = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
});

export function formatDay(iso: string): string {
    return dayFormatter.format(new Date(iso));
}

export function formatTime(iso: string): string {
    return timeFormatter.format(new Date(iso));
}

/** Ключ для группировки записей по дню, в местном времени. */
export function dayKey(iso: string): string {
    return toDateInputValue(iso);
}
