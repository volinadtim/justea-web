"use client";

import Link from "next/link";
import { useState } from "react";
import { CEREMONY_DATE_PROMISE, CEREMONY_PRICE } from "@/app/ceremony/content";
import { HONEYPOT_FIELD, MAX_PEOPLE, type FieldErrors } from "@/app/api/ceremony/validate";

type Status = "idle" | "sending" | "sent" | "error";

const FIELD_CLASS =
    "w-full border-b-2 border-black/20 bg-transparent py-[8px] text-[19px] placeholder:text-black/40 focus:border-black dark:border-white/20 dark:placeholder:text-white/40 dark:focus:border-white";

const LABEL_CLASS = "mb-[4px] block text-[14px] text-black/60 dark:text-white/60";

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p role="alert" className="mt-[4px] text-[14px] text-red-800 dark:text-red-300">
            {message}
        </p>
    );
}

export default function CeremonyBookingForm() {
    const [status, setStatus] = useState<Status>("idle");
    const [errors, setErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setStatus("sending");
        setErrors({});
        setFormError(null);

        const data = new FormData(event.currentTarget);
        const payload = {
            name: String(data.get("name") ?? ""),
            email: String(data.get("email") ?? ""),
            contact: String(data.get("contact") ?? ""),
            people: Number(data.get("people") ?? 1),
            comment: String(data.get("comment") ?? ""),
            consent: data.get("consent") === "on",
            [HONEYPOT_FIELD]: String(data.get(HONEYPOT_FIELD) ?? ""),
        };

        try {
            const response = await fetch("/api/ceremony", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = (await response.json().catch(() => ({}))) as {
                ok?: boolean;
                errors?: FieldErrors;
                error?: string;
            };

            if (response.ok && result.ok) {
                setStatus("sent");
                return;
            }

            setStatus("error");
            setErrors(result.errors ?? {});
            setFormError(
                result.error ??
                    (result.errors
                        ? "Проверьте поля формы"
                        : "Не получилось отправить заявку. Попробуйте ещё раз."),
            );
        } catch {
            setStatus("error");
            setFormError(
                "Не получилось отправить заявку — похоже, пропала связь. Попробуйте ещё раз.",
            );
        }
    }

    if (status === "sent") {
        return (
            <div
                role="status"
                className="border-2 border-black/20 p-[20px] dark:border-white/20"
            >
                <p className="mb-[8px] text-[24px] leading-[1.2]">Заявка принята</p>
                <p className="text-[19px] leading-[1.4]">
                    {CEREMONY_DATE_PROMISE}. Если письма нет — проверьте папку «Спам».
                </p>
            </div>
        );
    }

    const sending = status === "sending";

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[20px]">
            <p className="text-[19px] leading-[1.4]">
                {CEREMONY_DATE_PROMISE}.
                <br />
                <span className="text-black/70 dark:text-white/70">{CEREMONY_PRICE}.</span>
            </p>

            <div>
                <label className={LABEL_CLASS} htmlFor="ceremony-name">
                    Как вас зовут
                </label>
                <input
                    id="ceremony-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={100}
                    placeholder="Имя"
                    aria-invalid={Boolean(errors.name)}
                    className={FIELD_CLASS}
                />
                <FieldError message={errors.name} />
            </div>

            <div>
                <label className={LABEL_CLASS} htmlFor="ceremony-email">
                    Почта — на неё придёт дата
                </label>
                <input
                    id="ceremony-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    placeholder="you@example.com"
                    aria-invalid={Boolean(errors.email)}
                    className={FIELD_CLASS}
                />
                <FieldError message={errors.email} />
            </div>

            <div>
                <label className={LABEL_CLASS} htmlFor="ceremony-contact">
                    Телефон или Telegram — по желанию
                </label>
                <input
                    id="ceremony-contact"
                    name="contact"
                    type="text"
                    autoComplete="tel"
                    maxLength={200}
                    placeholder="+7 … или @username"
                    aria-invalid={Boolean(errors.contact)}
                    className={FIELD_CLASS}
                />
                <FieldError message={errors.contact} />
            </div>

            <div>
                <label className={LABEL_CLASS} htmlFor="ceremony-people">
                    Сколько вас будет
                </label>
                <input
                    id="ceremony-people"
                    name="people"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_PEOPLE}
                    defaultValue={1}
                    aria-invalid={Boolean(errors.people)}
                    className={`${FIELD_CLASS} font-comfortaa`}
                />
                <FieldError message={errors.people} />
            </div>

            <div>
                <label className={LABEL_CLASS} htmlFor="ceremony-comment">
                    Комментарий — по желанию
                </label>
                <textarea
                    id="ceremony-comment"
                    name="comment"
                    rows={3}
                    maxLength={2000}
                    placeholder="Первый раз на церемонии, хочу прийти с подругой…"
                    aria-invalid={Boolean(errors.comment)}
                    className={`${FIELD_CLASS} resize-y`}
                />
                <FieldError message={errors.comment} />
            </div>

            {/* Ловушка для ботов: человек это поле не видит и не заполнит. */}
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="ceremony-website">Сайт</label>
                <input
                    id="ceremony-website"
                    name={HONEYPOT_FIELD}
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                />
            </div>

            <div>
                <label className="flex cursor-pointer items-start gap-[10px] text-[16px] leading-[1.35]">
                    <input
                        name="consent"
                        type="checkbox"
                        required
                        aria-invalid={Boolean(errors.consent)}
                        className="mt-[4px] size-[18px] shrink-0 accent-black dark:accent-white"
                    />
                    <span>
                        Согласен(-на) на обработку персональных данных в соответствии с{" "}
                        <Link
                            href="/ceremony/privacy"
                            className="underline underline-offset-2 hover:no-underline"
                        >
                            политикой обработки персональных данных
                        </Link>
                        .
                    </span>
                </label>
                <FieldError message={errors.consent} />
            </div>

            {formError && (
                <p role="alert" className="text-[16px] text-red-800 dark:text-red-300">
                    {formError}
                </p>
            )}

            <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center justify-center self-start rounded-full border-2 border-black bg-black px-[24px] py-[12px] text-[19px] text-white transition-colors hover:bg-black/80 disabled:opacity-60 dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
                {sending ? "Отправляем…" : "Записаться"}
            </button>
        </form>
    );
}
