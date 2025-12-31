import Image from "next/image";
import ThemeToggle from "./components/ThemeToggle";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-main font-sans dark:bg-main">
      <ThemeToggle />
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start"></main>
    </div>
  );
}
