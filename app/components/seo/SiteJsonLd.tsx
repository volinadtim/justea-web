import JsonLd from "./JsonLd";
import { organizationSchema, webSiteSchema } from "./schema";

/**
 * Разметка уровня сайта: WebSite + SearchAction (поисковая строка в выдаче)
 * и Organization. Выводится один раз в корневом layout; страницы ссылаются
 * на эти узлы по `@id`.
 */
export default function SiteJsonLd() {
    return (
        <JsonLd
            data={{
                "@context": "https://schema.org",
                "@graph": [webSiteSchema(), organizationSchema()],
            }}
        />
    );
}
