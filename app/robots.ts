import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            // Поиск: бесконечное пространство обхода по `?q=` и чистый thin
            // content. На самих страницах стоит ещё и `noindex, follow`.
            //
            // `/_next/` сознательно НЕ закрываем: Googlebot рендерит страницу
            // и ему нужны CSS и JS оттуда, иначе в GSC появятся
            // заблокированные ресурсы и проблемы с mobile-friendly.
            //
            // TODO(seo): если на сайт пойдут ссылки с UTM-метками, Яндексу
            // понадобится Clean-param. `robots.ts` в Next.js его не выводит —
            // придётся заменить этот файл на route handler `app/robots.txt/route.ts`.
            disallow: ["/search"],
        },
        sitemap: absoluteUrl("/sitemap.xml"),
    };
}
