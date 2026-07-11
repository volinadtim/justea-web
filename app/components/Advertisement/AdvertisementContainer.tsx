import ColumnAdvertisement from "./ColumnAdvertisement";

type Props = {
    children: React.ReactNode;
};

export default function AdvertisementContainer({ children }: Props) {
    return (
        <div className="grid h-full lg:grid-cols-[1fr_minmax(0,670px)_1fr]">
            <aside className="hidden lg:block">
                <ColumnAdvertisement />
            </aside>
            <div className="min-w-0">{children}</div>
            <aside className="hidden lg:block">
                <ColumnAdvertisement />
            </aside>
        </div>
    );
}
