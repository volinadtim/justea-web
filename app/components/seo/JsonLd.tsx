/**
 * Базовый рендерер JSON-LD. Выводит `<script type="application/ld+json">`
 * в потоке страницы — серверный компонент, в клиентский бандл не попадает.
 *
 * `</` экранируется: иначе строка вида `</script>` внутри данных закрыла бы
 * тег раньше времени.
 */
export default function JsonLd({ data }: { data: unknown }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(data).replace(/</g, "\\u003c"),
            }}
        />
    );
}
