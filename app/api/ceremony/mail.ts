/**
 * Письма по заявке: подтверждение гостю и уведомление Регине.
 *
 * Провайдер и адреса ещё не выбраны (вопрос пользователю, см.
 * docs/ceremony/open-questions.md), поэтому отправка намеренно необязательна:
 * без ключей провайдер `log` печатает письма в лог процесса, и заявка
 * всё равно считается принятой.
 *
 * По умолчанию провайдер — `log`: решение пользователя 2026-11-06 «почта на
 * домене justea будет позже, адрес через env, без реальной отправки». Чтобы
 * письма действительно уходили, нужно явно выставить CEREMONY_MAIL_PROVIDER.
 *
 * Переменные окружения:
 *   CEREMONY_MAIL_PROVIDER — resend | log (по умолчанию log)
 *   CEREMONY_MAIL_FROM     — адрес отправителя, например "Justea <ceremony@justea.ru>"
 *   CEREMONY_MAIL_TO       — куда приходят заявки Регине
 *   RESEND_API_KEY         — ключ Resend
 */

import { CEREMONY_DATE_PROMISE, CEREMONY_PRICE } from "@/app/ceremony/content";
import type { StoredCeremonyRequest } from "./store";

type Provider = "resend" | "log";

interface Letter {
    to: string;
    subject: string;
    text: string;
}

export interface MailResult {
    provider: Provider;
    guest: "sent" | "failed" | "logged";
    host: "sent" | "failed" | "logged" | "skipped";
}

function resolveProvider(): Provider {
    const configured = process.env.CEREMONY_MAIL_PROVIDER?.toLowerCase();
    if (configured === "resend") {
        return process.env.RESEND_API_KEY ? "resend" : "log";
    }
    // Явно не включили — ничего не отправляем, только пишем в лог.
    return "log";
}

function fromAddress(): string {
    return process.env.CEREMONY_MAIL_FROM ?? "Justea <ceremony@justea.ru>";
}

async function sendViaResend(letter: Letter): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new Error("RESEND_API_KEY не задан");
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: fromAddress(),
            to: [letter.to],
            subject: letter.subject,
            text: letter.text,
        }),
    });

    if (!response.ok) {
        throw new Error(`Resend ответил ${response.status}: ${await response.text()}`);
    }
}

async function deliver(
    provider: Provider,
    letter: Letter,
): Promise<"sent" | "failed" | "logged"> {
    if (provider === "log") {
        console.info(
            `[ceremony] письмо не отправлено (провайдер не настроен)\n` +
                `  кому: ${letter.to}\n  тема: ${letter.subject}\n${letter.text}`,
        );
        return "logged";
    }

    try {
        await sendViaResend(letter);
        return "sent";
    } catch (error) {
        console.error("[ceremony] не удалось отправить письмо", error);
        return "failed";
    }
}

function guestLetter(record: StoredCeremonyRequest): Letter {
    const lines = [
        `${record.name}, здравствуйте.`,
        "",
        "Мы получили вашу заявку на чайную церемонию.",
        `${CEREMONY_DATE_PROMISE} — этим письмом или следующим, как только соберётся стол.`,
        "",
        `Участников: ${record.people}`,
        `Стоимость: ${CEREMONY_PRICE}`,
        "",
        "Если планы изменятся — просто ответьте на это письмо.",
        "",
        "Justea",
    ];

    return {
        to: record.email,
        subject: "Заявка на чайную церемонию принята",
        text: lines.join("\n"),
    };
}

function hostLetter(record: StoredCeremonyRequest, to: string): Letter {
    const lines = [
        "Новая заявка на церемонию.",
        "",
        `Имя: ${record.name}`,
        `Почта: ${record.email}`,
        `Телефон или Telegram: ${record.contact ?? "не указан"}`,
        `Участников: ${record.people}`,
        `Комментарий: ${record.comment ?? "нет"}`,
        "",
        `Заявка: ${record.id}`,
        `Время: ${record.createdAt}`,
    ];

    return {
        to,
        subject: `Заявка на церемонию: ${record.name} (${record.people})`,
        text: lines.join("\n"),
    };
}

export async function sendCeremonyMail(
    record: StoredCeremonyRequest,
): Promise<MailResult> {
    const provider = resolveProvider();
    const hostTo = process.env.CEREMONY_MAIL_TO;

    const guest = await deliver(provider, guestLetter(record));
    const host = hostTo
        ? await deliver(provider, hostLetter(record, hostTo))
        : ("skipped" as const);

    if (host === "skipped") {
        console.info(
            "[ceremony] CEREMONY_MAIL_TO не задан — уведомление Регине не отправлено",
        );
    }

    return { provider, guest, host };
}
