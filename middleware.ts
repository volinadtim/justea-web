import { NextResponse, type NextRequest } from "next/server";
import { isTeaType } from "@/lib/teas";
import { teaTypePath } from "@/lib/tea-type-pages";

/**
 * Редиректы старых URL фильтра по типу чая.
 *
 * Раньше фильтр жил в query-параметре (`/?type=green`), теперь у каждого типа
 * своя страница (`/tea/green`) под семантический кластер. Старые адреса отдают
 * 301, чтобы не терять ссылки и уже проиндексированные URL.
 *
 * Почему middleware, а не `redirects()` в `next.config.ts`: Next.js дописывает
 * исходный query к destination, и получалось `/tea/green?type=green` — второй
 * URL с тем же содержимым. Здесь мы строим адрес сами и параметр выбрасываем.
 *
 * Сверяемся с `isTeaType`, а не со статическим списком: страницы есть у всех
 * известных типов, в том числе тех, для которых в каталоге пока нет чаёв
 * (см. `app/tea/[type]/page.tsx`). Неизвестное значение ведёт на `/`, чтобы
 * 301 не указывал на 404.
 */
export function middleware(request: NextRequest) {
    const type = request.nextUrl.searchParams.get("type");

    if (type === null) {
        return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.searchParams.delete("type");

    // Неизвестный тип раньше показывал полный каталог — значит, его место
    // на главной без параметра.
    url.pathname = isTeaType(type) ? teaTypePath(type) : "/";

    return NextResponse.redirect(url, 301);
}

export const config = {
    // Только корень: `?type=` имел смысл лишь на главной.
    matcher: "/",
};
