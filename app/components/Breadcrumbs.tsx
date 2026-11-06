import Link from "next/link";

export type BreadcrumbItem = {
    label: string;
    href?: string;
};

type Props = {
    items: BreadcrumbItem[];
};

export default function Breadcrumbs({ items }: Props) {
    return (
        <nav aria-label="Хлебные крошки" className="mb-[20px] text-[14px]">
            <ol className="flex flex-wrap items-center gap-x-[8px] gap-y-[4px]">
                {items.map((item, index) => (
                    <li key={item.label} className="flex items-center gap-[8px]">
                        {index > 0 && (
                            <span aria-hidden className="text-muted">
                                /
                            </span>
                        )}
                        {item.href ? (
                            <Link
                                href={item.href}
                                className="underline-offset-2 hover:underline"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span aria-current="page">{item.label}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
