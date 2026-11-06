import { readFileSync } from "node:fs";
import { join } from "node:path";

export type ImageSize = { width: number; height: number };

/**
 * Размер картинки из `public/`, прочитанный из самого файла.
 *
 * Зачем не хардкод: `og:image:width` и `og:image:height` — это обещание
 * краулеру, и соцсети верят ему при построении превью. Заявленный размер,
 * разошедшийся с файлом, был находкой 3.5 аудита. Пока числа жили в
 * `siteConfig`, любая перерисовка картинки другим агентом снова ломала их —
 * и требовала согласования, в каком порядке мержить PR. Чтение из файла
 * убирает и рассинхрон, и согласование: размер всегда правдив.
 *
 * Функция намеренно не бросает исключений. Если файла нет или формат не
 * разобрался, вернётся `undefined`, и мы просто не выводим размеры — это
 * честнее, чем выводить неверные, и не ломает сборку.
 *
 * Только для серверного кода: читает файловую систему. Пакета `server-only`
 * в проекте нет, но охранник и не нужен — импорт `node:fs` в клиентский бандл
 * Next.js не пропустит и уронит сборку с явной ошибкой.
 */
export function publicImageSize(publicPath: string): ImageSize | undefined {
    const cached = cache.get(publicPath);

    if (cached !== undefined) {
        return cached ?? undefined;
    }

    const size = read(publicPath);
    // `null` в кеше = «пробовали, не получилось»: повторно файл не читаем.
    cache.set(publicPath, size ?? null);

    return size;
}

const cache = new Map<string, ImageSize | null>();

function read(publicPath: string): ImageSize | undefined {
    try {
        const file = join(process.cwd(), "public", publicPath.replace(/^\/+/, ""));
        const data = readFileSync(file);

        return pngSize(data) ?? jpegSize(data);
    } catch {
        return undefined;
    }
}

/** PNG: ширина и высота лежат в чанке IHDR на фиксированном смещении. */
function pngSize(data: Buffer): ImageSize | undefined {
    const isPng =
        data.length > 24 && data.readUInt32BE(0) === 0x89504e47;

    if (!isPng) {
        return undefined;
    }

    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

/**
 * JPEG: идём по маркерам до SOF (Start Of Frame) — только он знает размер.
 * SOF — это 0xFFC0…0xFFCF, кроме 0xC4 (таблицы Хаффмана), 0xC8 и 0xCC,
 * которые маркерами кадра не являются.
 */
function jpegSize(data: Buffer): ImageSize | undefined {
    if (data.length < 4 || data.readUInt16BE(0) !== 0xffd8) {
        return undefined;
    }

    let offset = 2;

    while (offset + 9 < data.length) {
        if (data[offset] !== 0xff) {
            offset += 1;
            continue;
        }

        const marker = data[offset + 1];
        const isFrame =
            marker >= 0xc0 &&
            marker <= 0xcf &&
            marker !== 0xc4 &&
            marker !== 0xc8 &&
            marker !== 0xcc;

        if (isFrame) {
            return {
                height: data.readUInt16BE(offset + 5),
                width: data.readUInt16BE(offset + 7),
            };
        }

        offset += 2 + data.readUInt16BE(offset + 2);
    }

    return undefined;
}
