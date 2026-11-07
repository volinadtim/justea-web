import JsonLd from "./JsonLd";
import { breadcrumbListSchema, type Crumb } from "./schema";
import { absoluteUrl } from "@/lib/site";

/**
 * BreadcrumbList для страниц, где нет своего графа. Список крошек тот же, что
 * у визуального `Breadcrumbs`, — передавать оба из одного массива.
 */
export default function BreadcrumbsJsonLd({
    items,
    path,
}: {
    items: Crumb[];
    path: string;
}) {
    return <JsonLd data={{
        "@context": "https://schema.org",
        ...breadcrumbListSchema(items, absoluteUrl(path)),
    }} />;
}
