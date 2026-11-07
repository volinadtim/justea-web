/**
 * Не даёт экрану гаснуть, пока идёт пролив: телефон лежит рядом с чайником,
 * и гаснущий экран приходится будить посреди отсчёта.
 *
 * Возвращает функцию отмены. Браузер снимает блокировку сам, когда вкладка
 * уходит в фон, поэтому при возвращении запрашиваем её заново.
 *
 * Если в ветке justea-design вольётся PR #9, там есть такая же `keepScreenAwake`
 * в `app/components/steep-signal.ts` — оставить нужно одну.
 */
export function keepScreenAwake(): () => void {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
        return () => undefined;
    }

    let released = false;
    let sentinel: WakeLockSentinel | null = null;

    async function request() {
        try {
            sentinel = await navigator.wakeLock.request("screen");

            if (released) {
                await sentinel.release();
                sentinel = null;
            }
        } catch {
            // Браузер может отказать (вкладка в фоне, экономия батареи) —
            // это не повод ломать таймер.
        }
    }

    function handleVisibilityChange() {
        if (!released && document.visibilityState === "visible") {
            request();
        }
    }

    request();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
        released = true;
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        sentinel?.release().catch(() => undefined);
        sentinel = null;
    };
}
