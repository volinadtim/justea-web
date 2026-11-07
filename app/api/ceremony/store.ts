/**
 * Хранение заявок. Работает без каких-либо ключей и внешних сервисов:
 * заявка дописывается строкой JSON в файл, а если файл недоступен
 * (read-only ФС, нет прав) — уходит в лог процесса, то есть в docker logs.
 */

import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { CeremonyRequest } from "./validate";

const DATA_DIR = process.env.CEREMONY_DATA_DIR ?? ".data";
const FILE_NAME = "ceremony-requests.jsonl";

export interface StoredCeremonyRequest extends CeremonyRequest {
    id: string;
    /** ISO-время сервера. */
    createdAt: string;
    ip: string;
    userAgent: string | null;
}

export interface StoreResult {
    record: StoredCeremonyRequest;
    /** Куда реально легла заявка — для диагностики в ответе и логах. */
    storage: "file" | "log";
    file?: string;
}

export async function storeCeremonyRequest(
    request: CeremonyRequest,
    meta: { ip: string; userAgent: string | null },
): Promise<StoreResult> {
    const record: StoredCeremonyRequest = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        ...request,
        ip: meta.ip,
        userAgent: meta.userAgent,
    };

    const dir = path.isAbsolute(DATA_DIR) ? DATA_DIR : path.join(process.cwd(), DATA_DIR);
    const file = path.join(dir, FILE_NAME);

    try {
        await mkdir(dir, { recursive: true });
        await appendFile(file, `${JSON.stringify(record)}\n`, "utf8");
        return { record, storage: "file", file };
    } catch (error) {
        console.error("[ceremony] не удалось записать заявку в файл", error);
        console.info(`[ceremony] заявка ${record.id}: ${JSON.stringify(record)}`);
        return { record, storage: "log" };
    }
}
