import type { Metadata } from "next";
import Breadcrumbs from "../components/Breadcrumbs";
import CeremonyBookingForm from "../components/CeremonyBookingForm";
import CeremonyCta from "../components/CeremonyCta";
import CeremonyFaq from "../components/CeremonyFaq";
import CeremonyPlaceholder from "../components/CeremonyPlaceholder";
import CeremonySection from "../components/CeremonySection";
import { createPageMetadata } from "@/lib/metadata";
import {
    CEREMONY_CITY,
    CEREMONY_CITY_IN,
    CEREMONY_FORMAT,
    CEREMONY_FREQUENCY,
    CEREMONY_HOST_NAME,
    CEREMONY_HOST_NAME_GEN,
    CEREMONY_PLAN,
    CEREMONY_PRICE,
    CEREMONY_STAGES,
    CEREMONY_VENUE,
} from "./content";

export const metadata: Metadata = createPageMetadata({
    title: "Чайная церемония",
    description:
        "Чайная церемония в Санкт-Петербурге с мастером Региной: разовая встреча в небольшой группе раз в месяц, проливы одного чая и никаких требований к опыту. 1 500 ₽ с человека, чай включён.",
    path: "/ceremony",
});

/**
 * Лендинг по SB7: герой → проблема → проводник → план → призыв →
 * неудача → успех. Структуру повторяем за проектом kostyumnaden (PRD.md),
 * тексты и дизайн — свои.
 */
export default function CeremonyPage() {
    return (
        <main className="flex flex-col gap-[56px] sm:gap-[72px]">
            <section>
                <Breadcrumbs
                    items={[{ label: "Главная", href: "/" }, { label: "Церемония" }]}
                />

                <h1 className="mb-[16px] text-[36px] leading-none sm:text-[44px] lg:text-[50px]">
                    Чайная церемония {CEREMONY_CITY_IN}
                </h1>

                <p className="mb-[20px] max-w-[48ch] text-[19px] leading-[1.4] sm:text-[22px] lg:text-[24px]">
                    Вечер за столом у чайного мастера {CEREMONY_HOST_NAME_GEN}: один чай,
                    много проливов, небольшая группа и люди, с которыми к последнему
                    проливу уже разговариваешь. Разбираться в чае заранее не нужно — за
                    этим и приходят.
                </p>

                <p className="mb-[8px] text-[24px] leading-[1.2] sm:text-[28px]">
                    {CEREMONY_PRICE}
                </p>

                <p className="mb-[28px] text-[16px] text-black/70 dark:text-white/70">
                    {CEREMONY_FORMAT}. {CEREMONY_FREQUENCY}. {CEREMONY_CITY},{" "}
                    {CEREMONY_VENUE}.
                </p>

                <div className="flex flex-wrap items-center gap-[12px]">
                    <CeremonyCta href="#booking" />
                    <CeremonyCta variant="secondary" href="/">
                        Узнать о чаях
                    </CeremonyCta>
                </div>
            </section>

            <CeremonySection title="Почему чай дома не такой">
                <div className="flex flex-col gap-[16px] text-[19px] leading-[1.45]">
                    <p>
                        Вода не та, посуда не та, время на глаз. Справочник подскажет
                        температуру и пропорцию, но вкус из таблицы не достать — его
                        нужно один раз попробовать рядом с человеком, который его знает.
                    </p>
                    <p>
                        А ещё неловко. Кажется, что в чайной сразу станет видно, что вы
                        «ничего не понимаете»: не знаете названий, не чувствуете нот,
                        держите пиалу не так.
                    </p>
                    <p className="text-black/70 dark:text-white/70">
                        Вкус — это навык, и ему учатся у человека, а не у инструкции. Как
                        и привычке сесть на час за стол и никуда не спешить.
                    </p>
                </div>
            </CeremonySection>

            <CeremonySection title={`${CEREMONY_HOST_NAME} проводит церемонию`}>
                <div className="grid gap-[20px] sm:grid-cols-[2fr_1fr]">
                    <div className="flex flex-col gap-[16px] text-[19px] leading-[1.45]">
                        <p>
                            {CEREMONY_HOST_NAME} начинала так же: с чая из пакетика и
                            вопроса «а почему у них вкуснее». Поэтому на её столе никто
                            не сдаёт экзамен — спрашивать можно что угодно, включая «а
                            почему этот чай такой дорогой».
                        </p>
                        <CeremonyPlaceholder item="hostBio" />
                    </div>
                    <CeremonyPlaceholder item="hostPhoto" />
                </div>
            </CeremonySection>

            <CeremonySection title="Как записаться">
                <ol className="grid gap-[20px] sm:grid-cols-3">
                    {CEREMONY_PLAN.map((item) => (
                        <li
                            key={item.step}
                            className="border-2 border-black/10 p-[16px] dark:border-white/10"
                        >
                            <span className="mb-[8px] block font-comfortaa text-[28px] leading-none">
                                {item.step}
                            </span>
                            <h3 className="mb-[6px] text-[22px] leading-[1.2]">
                                {item.title}
                            </h3>
                            <p className="text-[16px] leading-[1.4] text-black/70 dark:text-white/70">
                                {item.text}
                            </p>
                        </li>
                    ))}
                </ol>

                <CeremonyCta href="#booking" className="mt-[24px]" />
            </CeremonySection>

            <CeremonySection title="Как проходит церемония">
                <ol className="mb-[20px] flex flex-col">
                    {CEREMONY_STAGES.map((stage, index) => (
                        <li
                            key={stage.title}
                            className="flex gap-[16px] border-b-2 border-black/10 py-[14px] dark:border-white/10"
                        >
                            <span className="font-comfortaa text-[19px] text-black/50 dark:text-white/50">
                                {index + 1}
                            </span>
                            <div>
                                <h3 className="text-[19px] leading-[1.3]">
                                    {stage.title}
                                </h3>
                                <p className="text-[16px] leading-[1.4] text-black/70 dark:text-white/70">
                                    {stage.text}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>

                <div className="grid gap-[12px] sm:grid-cols-2">
                    <CeremonyPlaceholder item="duration" />
                    <CeremonyPlaceholder item="teaList" />
                </div>

                <div className="mt-[20px] border-2 border-black/10 p-[16px] dark:border-white/10">
                    <h3 className="mb-[8px] text-[22px] leading-[1.2]">Где это</h3>
                    <p className="mb-[12px] text-[19px] leading-[1.45]">
                        {CEREMONY_CITY}, {CEREMONY_VENUE}.
                    </p>
                    <CeremonyPlaceholder item="place" />
                </div>
            </CeremonySection>

            <CeremonySection title="Если не прийти">
                <div className="grid gap-[20px] sm:grid-cols-2">
                    <ul className="flex flex-col gap-[12px] text-[19px] leading-[1.4]">
                        <li>
                            Ещё год чай будет «нормальным» — и вы так и не узнаете, каким
                            он бывает.
                        </li>
                        <li>
                            Хороший чай, купленный «на пробу», будет лежать в шкафу и
                            выдыхаться, потому что жалко испортить.
                        </li>
                        <li>
                            «Как-нибудь дойду» останется в списке дел ещё на одну зиму.
                        </li>
                    </ul>

                    <div className="border-2 border-black/10 p-[20px] dark:border-white/10">
                        <h3 className="mb-[10px] text-[22px] leading-[1.2]">
                            А если прийти
                        </h3>
                        <p className="text-[19px] leading-[1.45]">
                            Вы один раз чувствуете, каким вкус должен быть — и дальше
                            свой чай дома заваривается уже иначе. Плюс появляется место
                            в Петербурге, куда можно прийти вечером, и несколько
                            человек, с которыми вы познакомились за столом.
                        </p>
                    </div>
                </div>

                <CeremonyCta href="#booking" className="mt-[24px]" />
            </CeremonySection>

            <CeremonySection title="Сколько стоит">
                <p className="mb-[16px] text-[24px] leading-[1.2]">{CEREMONY_PRICE}</p>
                <p className="max-w-[52ch] text-[19px] leading-[1.45]">
                    Это всё: чай входит в стоимость, доплачивать на месте ничего не
                    нужно. Чай на стол выбирает {CEREMONY_HOST_NAME} — в том числе
                    такой, который вы вряд ли купили бы себе на пробу.
                </p>
            </CeremonySection>

            <CeremonySection id="booking" title="Записаться на церемонию">
                <div className="max-w-[46ch]">
                    <CeremonyBookingForm />
                </div>
            </CeremonySection>

            <CeremonySection title="Вопросы">
                <CeremonyFaq />
                <CeremonyPlaceholder item="schedule" className="mt-[20px]" />
            </CeremonySection>
        </main>
    );
}
