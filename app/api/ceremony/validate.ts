/** Валидация заявки на церемонию. Без зависимостей — ручные проверки. */

// TODO(user): размер группы пользователь ещё не назвал (вопрос 5 в
// docs/ceremony/open-questions.md) — 12 здесь только верхняя отсечка формы.
export const MAX_PEOPLE = 12;

/** Поле-ловушка для ботов: в вёрстке скрыто, человек его не заполнит. */
export const HONEYPOT_FIELD = "website";

export interface CeremonyRequestInput {
    name: string;
    email: string;
    /** Телефон или Telegram — по желанию. */
    contact?: string;
    people: number;
    comment?: string;
    consent: boolean;
    /** Ловушка для ботов. */
    [HONEYPOT_FIELD]?: string;
}

export interface CeremonyRequest {
    name: string;
    email: string;
    contact: string | null;
    people: number;
    comment: string | null;
}

export type FieldErrors = Partial<
    Record<"name" | "email" | "contact" | "people" | "comment" | "consent", string>
>;

export type ValidationResult =
    | { ok: true; value: CeremonyRequest; honeypotTriggered: boolean }
    | { ok: false; errors: FieldErrors };

/**
 * Простая проверка адреса: один @, точка в домене, без пробелов.
 * Намеренно нестрогая — отсекаем опечатки, а не спорим со стандартом.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

function asString(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

export function validateCeremonyRequest(body: unknown): ValidationResult {
    const errors: FieldErrors = {};
    const raw = (body ?? {}) as Record<string, unknown>;

    const name = asString(raw.name);
    if (name.length < 2) {
        errors.name = "Напишите, как вас зовут";
    } else if (name.length > 100) {
        errors.name = "Слишком длинное имя";
    }

    const email = asString(raw.email).toLowerCase();
    if (!email) {
        errors.email = "Без почты мы не сможем прислать дату";
    } else if (email.length > 254 || !EMAIL_RE.test(email)) {
        errors.email = "Проверьте адрес почты";
    }

    const contact = asString(raw.contact);
    if (contact.length > 200) {
        errors.contact = "Слишком длинный контакт";
    }

    const peopleRaw = raw.people;
    const people =
        typeof peopleRaw === "number"
            ? peopleRaw
            : Number.parseInt(asString(peopleRaw) || "1", 10);
    if (!Number.isInteger(people) || people < 1 || people > MAX_PEOPLE) {
        errors.people = `Укажите число от 1 до ${MAX_PEOPLE}`;
    }

    const comment = asString(raw.comment);
    if (comment.length > 2000) {
        errors.comment = "Слишком длинный комментарий";
    }

    if (raw.consent !== true && raw.consent !== "true" && raw.consent !== "on") {
        errors.consent = "Без согласия на обработку данных мы не можем принять заявку";
    }

    if (Object.keys(errors).length > 0) {
        return { ok: false, errors };
    }

    return {
        ok: true,
        honeypotTriggered: asString(raw[HONEYPOT_FIELD]).length > 0,
        value: {
            name,
            email,
            contact: contact || null,
            people,
            comment: comment || null,
        },
    };
}
