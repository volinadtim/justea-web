/**
 * Антиспам: лимит заявок на IP в скользящем окне.
 *
 * Счётчик в памяти процесса. Приложение разворачивается как один
 * standalone-контейнер (см. README, деплой на VPS), поэтому этого достаточно.
 * Если появится несколько инстансов — счётчик нужно вынести в Redis.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
/** Предохранитель от роста памяти при распределённом спаме. */
const MAX_TRACKED_KEYS = 10_000;

const hits = new Map<string, number[]>();

export interface RateLimitResult {
    allowed: boolean;
    /** Сколько секунд ждать до следующей попытки. */
    retryAfterSeconds: number;
}

export function checkRateLimit(key: string, now = Date.now()): RateLimitResult {
    const since = now - WINDOW_MS;
    const recent = (hits.get(key) ?? []).filter((time) => time > since);

    if (recent.length >= MAX_PER_WINDOW) {
        const oldest = recent[0];
        hits.set(key, recent);
        return {
            allowed: false,
            retryAfterSeconds: Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000)),
        };
    }

    recent.push(now);
    hits.set(key, recent);

    if (hits.size > MAX_TRACKED_KEYS) {
        for (const [existingKey, times] of hits) {
            if (times.every((time) => time <= since)) {
                hits.delete(existingKey);
            }
        }
    }

    return { allowed: true, retryAfterSeconds: 0 };
}

/** IP клиента за обратным прокси (хостовый nginx → контейнер). */
export function clientIp(headers: Headers): string {
    const forwarded = headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0]!.trim();
    }
    return headers.get("x-real-ip")?.trim() || "unknown";
}
