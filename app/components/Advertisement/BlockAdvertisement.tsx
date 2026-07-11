type Props = {
    children?: React.ReactNode;
};

export default function BlockAdvertisement({ children }: Props) {
    return (
        <div className="h-full w-full rounded-md bg-main-500/80">
            {children}
        </div>
    );
}
