import type { Metadata } from "next";
import Breadcrumbs from "../../components/Breadcrumbs";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = {
    ...createPageMetadata({
        title: "Обработка персональных данных",
        description:
            "Какие данные мы собираем в заявке на чайную церемонию, зачем и как их удалить.",
        path: "/ceremony/privacy",
    }),
    // Черновик без реквизитов оператора в индексе не нужен.
    // Снять, когда пользователь даст данные (docs/ceremony/open-questions.md).
    robots: { index: false, follow: true },
};

/** Незаполненный реквизит: пользователь ещё не дал данные. */
function Blank({ children }: { children: React.ReactNode }) {
    return (
        <span className="border-b-2 border-dashed border-black/40 text-black/60 dark:border-white/40 dark:text-white/60">
            [{children}]
        </span>
    );
}

function Clause({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-[10px]">
            <h2 className="text-[22px] leading-[1.2]">{title}</h2>
            <div className="flex flex-col gap-[10px] text-[19px] leading-[1.45]">
                {children}
            </div>
        </section>
    );
}

export default function CeremonyPrivacyPage() {
    return (
        <main className="max-w-[68ch]">
            <Breadcrumbs
                items={[
                    { label: "Главная", href: "/" },
                    { label: "Церемония", href: "/ceremony" },
                    { label: "Персональные данные" },
                ]}
            />

            <h1 className="mb-[20px] text-[30px] leading-none sm:text-[38px] lg:text-[44px]">
                Политика обработки персональных данных
            </h1>

            <p className="mb-[28px] border-2 border-dashed border-black/30 p-[14px] text-[16px] leading-[1.4] text-black/60 dark:border-white/30 dark:text-white/60">
                <span className="font-comfortaa text-[14px] tracking-wide uppercase">
                    черновик
                </span>
                <br />
                Реквизиты оператора ещё не заполнены, а текст не проверял юрист. Прежде
                чем открывать запись публично, нужно подставить данные вместо
                квадратных скобок и перечитать документ.
            </p>

            <div className="flex flex-col gap-[28px]">
                <Clause title="1. Оператор">
                    <p>
                        Оператор персональных данных:{" "}
                        <Blank>ФИО или наименование ИП / ООО</Blank>, ИНН{" "}
                        <Blank>ИНН</Blank>, адрес <Blank>адрес</Blank>, почта для
                        обращений <Blank>email</Blank>.
                    </p>
                    <p>
                        Политика описывает обработку данных, которые вы оставляете в
                        форме записи на чайную церемонию на сайте justea.ru, и
                        составлена по Федеральному закону от 27.07.2006 № 152-ФЗ «О
                        персональных данных».
                    </p>
                </Clause>

                <Clause title="2. Какие данные мы собираем">
                    <p>Только то, что вы сами указали в форме записи:</p>
                    <ul className="flex list-disc flex-col gap-[6px] pl-[22px]">
                        <li>имя — обязательно;</li>
                        <li>адрес электронной почты — обязательно;</li>
                        <li>телефон или имя в Telegram — по желанию;</li>
                        <li>число участников и комментарий к заявке;</li>
                        <li>
                            технические данные запроса: IP-адрес, строка браузера и время
                            отправки — нужны, чтобы отсекать спам.
                        </li>
                    </ul>
                    <p>
                        Специальные категории данных и биометрию мы не собираем. Файлы
                        cookie для записи на церемонию не используются.
                    </p>
                </Clause>

                <Clause title="3. Зачем">
                    <ul className="flex list-disc flex-col gap-[6px] pl-[22px]">
                        <li>связаться с вами и сообщить дату и время церемонии;</li>
                        <li>записать вас и нужное число мест за столом;</li>
                        <li>защитить форму от автоматических рассылок.</li>
                    </ul>
                    <p>
                        Рекламные письма по этим данным мы не отправляем и данные не
                        продаём.
                    </p>
                </Clause>

                <Clause title="4. Основание обработки">
                    <p>
                        Ваше согласие — галочка в форме записи (часть 1 статьи 6 и
                        статья 9 № 152-ФЗ). Без согласия заявку отправить нельзя, потому
                        что без почты мы не сможем прислать дату.
                    </p>
                </Clause>

                <Clause title="5. Кому передаются данные">
                    <p>
                        Данные видит чайный мастер, который проводит церемонию, и
                        поставщик почтовой рассылки, через которого уходит письмо с
                        датой: <Blank>почтовый провайдер</Blank>. Сервер сайта
                        расположен: <Blank>страна и провайдер хостинга</Blank>.
                        Передаются ли данные за пределы России:{" "}
                        <Blank>уточнить после выбора почтового провайдера и хостинга</Blank>.
                    </p>
                </Clause>

                <Clause title="6. Сколько храним">
                    <p>
                        Заявку — <Blank>срок, например 1 год</Blank> с момента
                        церемонии, после чего удаляем. Если вы отзываете согласие, мы
                        удаляем заявку в течение 30 дней.
                    </p>
                </Clause>

                <Clause title="7. Ваши права">
                    <p>
                        Вы можете запросить, какие ваши данные у нас есть, исправить их,
                        потребовать удаления и отозвать согласие. Для этого напишите на{" "}
                        <Blank>email</Blank> или ответьте на любое наше письмо о
                        церемонии — отдельная форма не нужна.
                    </p>
                </Clause>

                <Clause title="8. Как мы защищаем данные">
                    <p>
                        Сайт работает по HTTPS. Доступ к заявкам есть только у оператора
                        и чайного мастера. Заявки хранятся на сервере сайта и в почте;
                        в открытых таблицах и мессенджерах их не публикуют.
                    </p>
                </Clause>

                <Clause title="9. Изменения">
                    <p>
                        Новая редакция публикуется на этой странице. Дата последнего
                        изменения: <Blank>дата публикации</Blank>.
                    </p>
                </Clause>
            </div>
        </main>
    );
}
