import BlockAdvertisement from "./BlockAdvertisement";

export default function RowAdvertisement() {
    return (
        <div className="mt-[40px] hidden md:flex md:items-center md:justify-center">
            <div className="h-[115px] w-full">
                <BlockAdvertisement />
            </div>
        </div>
    );
}
