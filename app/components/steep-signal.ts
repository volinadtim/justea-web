"use client";

/**
 * Сигнал окончания пролива.
 *
 * До этого таймер молча останавливался: ни звука, ни вибрации, ни смены
 * состояния. За ним приходилось следить глазами, хотя весь смысл — поставить
 * и отвернуться к чайнику.
 *
 * Звук синтезируется Web Audio, файла не требуется. AudioContext создаётся
 * только по жесту пользователя (нажатие «Старт»), иначе браузер его
 * заблокирует.
 */

const STORAGE_KEY = "justea-steep-sound";

let audioContext: AudioContext | null = null;

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
    if (typeof window === "undefined") {
        return null;
    }

    const w = window as unknown as {
        AudioContext?: AudioContextCtor;
        webkitAudioContext?: AudioContextCtor;
    };

    return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/** Вызывать по жесту пользователя — иначе звук не прозвучит. */
export function primeSteepSignal(): void {
    const Ctor = getAudioContextCtor();

    if (!Ctor) {
        return;
    }

    try {
        audioContext ??= new Ctor();

        if (audioContext.state === "suspended") {
            void audioContext.resume();
        }
    } catch {
        audioContext = null;
    }
}

const CHANGE_EVENT = "justea-steep-sound-change";

export function isSteepSoundEnabled(): boolean {
    if (typeof window === "undefined") {
        return true;
    }

    try {
        return window.localStorage.getItem(STORAGE_KEY) !== "off";
    } catch {
        return true;
    }
}

/** Снимок для useSyncExternalStore на сервере: звук считаем включённым. */
export function getSteepSoundServerSnapshot(): boolean {
    return true;
}

export function subscribeToSteepSound(onChange: () => void): () => void {
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);

    return () => {
        window.removeEventListener(CHANGE_EVENT, onChange);
        window.removeEventListener("storage", onChange);
    };
}

export function setSteepSoundEnabled(enabled: boolean): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
    } catch {
        // приватный режим или заблокированное хранилище — не повод падать
    }

    window.dispatchEvent(new Event(CHANGE_EVENT));
}

function beep(context: AudioContext, startAt: number, frequency: number) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    // Мягкая атака и затухание: щелчок на резком старте/стопе раздражает.
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.25, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.28);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.3);
}

/**
 * @param kind `steep` — пролив закончился, впереди следующий;
 *             `finished` — закончился последний.
 */
export function playSteepSignal(kind: "steep" | "finished"): void {
    if (typeof window === "undefined") {
        return;
    }

    if (navigator.vibrate) {
        try {
            navigator.vibrate(kind === "finished" ? [120, 80, 120, 80, 220] : [180]);
        } catch {
            // вибрация необязательна
        }
    }

    if (!isSteepSoundEnabled()) {
        return;
    }

    primeSteepSignal();

    if (!audioContext || audioContext.state !== "running") {
        return;
    }

    const now = audioContext.currentTime;

    if (kind === "finished") {
        beep(audioContext, now, 660);
        beep(audioContext, now + 0.34, 880);
        beep(audioContext, now + 0.68, 1100);
        return;
    }

    beep(audioContext, now, 880);
}

/**
 * Не даёт экрану погаснуть, пока идёт пролив. Возвращает функцию отпускания.
 * Браузер сам снимает блокировку при уходе со вкладки, поэтому повторно
 * запрашиваем её при возврате.
 */
export function keepScreenAwake(): () => void {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
        return () => {};
    }

    let sentinel: WakeLockSentinel | null = null;
    let released = false;

    async function request() {
        try {
            sentinel = await navigator.wakeLock.request("screen");
        } catch {
            // отказ — не ошибка: батарея, фон вкладки, неподдерживаемый режим
        }
    }

    function handleVisibility() {
        if (!released && document.visibilityState === "visible") {
            void request();
        }
    }

    void request();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
        released = true;
        document.removeEventListener("visibilitychange", handleVisibility);
        void sentinel?.release().catch(() => {});
        sentinel = null;
    };
}
