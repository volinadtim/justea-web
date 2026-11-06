type Props = {
    id?: string;
    title: string;
    children: React.ReactNode;
    className?: string;
};

/** Секция лендинга: заголовок уровня «Заголовок» из типографики + контент. */
export default function CeremonySection({
    id,
    title,
    children,
    className = "",
}: Props) {
    return (
        <section id={id} className={`scroll-mt-[24px] ${className}`}>
            <h2 className="mb-[20px] text-[26px] leading-none sm:text-[32px] lg:text-[37px]">
                {title}
            </h2>
            {children}
        </section>
    );
}
