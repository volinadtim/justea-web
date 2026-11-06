import { NextResponse } from "next/server";
import { sendCeremonyMail } from "./mail";
import { checkRateLimit, clientIp } from "./rate-limit";
import { storeCeremonyRequest } from "./store";
import { validateCeremonyRequest } from "./validate";

/** Заявки нельзя кэшировать и нельзя пререндерить. */
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;

export async function POST(request: Request) {
    const ip = clientIp(request.headers);

    const limit = checkRateLimit(ip);
    if (!limit.allowed) {
        return NextResponse.json(
            { ok: false, error: "Слишком много заявок подряд. Попробуйте позже." },
            { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
        );
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BODY_BYTES) {
        return NextResponse.json(
            { ok: false, error: "Слишком большая заявка" },
            { status: 413 },
        );
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { ok: false, error: "Не удалось прочитать заявку" },
            { status: 400 },
        );
    }

    const validation = validateCeremonyRequest(body);
    if (!validation.ok) {
        return NextResponse.json(
            { ok: false, errors: validation.errors },
            { status: 422 },
        );
    }

    // Ловушка сработала — отвечаем как при успехе, но ничего не делаем:
    // бот не должен понять, что его отсеяли.
    if (validation.honeypotTriggered) {
        console.warn(`[ceremony] honeypot: заявка отброшена, ip ${ip}`);
        return NextResponse.json({ ok: true });
    }

    const stored = await storeCeremonyRequest(validation.value, {
        ip,
        userAgent: request.headers.get("user-agent"),
    });

    // Письма не должны ронять заявку: она уже сохранена.
    const mail = await sendCeremonyMail(stored.record);

    console.info(
        `[ceremony] заявка ${stored.record.id} принята: ` +
            `хранение ${stored.storage}, почта ${mail.provider} ` +
            `(гость ${mail.guest}, Регина ${mail.host})`,
    );

    return NextResponse.json({ ok: true, id: stored.record.id });
}

export async function GET() {
    return NextResponse.json(
        { ok: false, error: "Только POST" },
        { status: 405, headers: { Allow: "POST" } },
    );
}
