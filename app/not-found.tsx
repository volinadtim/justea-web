import Link from "next/link";

export default function NotFound() {
    return (
        <main className="py-[60px] text-center">
            <h1 className="mb-[12px] text-[50px] leading-none">404</h1>
            <p className="mb-[32px] text-[24px]">Такого чая нет в справочнике</p>
            <Link
                href="/"
                className="text-[19px] underline-offset-2 hover:underline"
            >
                Вернуться на главную
            </Link>
        </main>
    );
}
