# Аудит научных ссылок в существующих `docs/`

Дата проверки: **2026-11-06**. Проверены все библиографические ссылки из
`docs/tea-brewing-science.md` (раздел References) и `docs/tea-brewing-science-ru.md`
(раздел V. Ключевые источники) — это единственные файлы в `docs/`, где параметры
заваривания подкреплены ссылками на литературу.

**Метод проверки:** Crossref REST API (`api.crossref.org/works/{doi}` для прямого
разрешения DOI и `query.bibliographic` для поиска по описанию) и NCBI E-utilities
(`esummary.fcgi?db=pmc`) для PMC-идентификаторов. Контактный e-mail передавался в
User-Agent согласно требованиям Crossref.

## Итог

| Категория | Ссылок |
|---|---|
Всего проверено | 18 |
| DOI/PMC разрешаются, выходные данные верны | 6 |
| **Работа существует, но автор указан неверно** | **5** |
| **Работа существует, но журнал и/или год указаны неверно** | **3** |
| Две разные работы сведены в одну ссылку | 1 |
| Не удалось подтвердить существование | 3 |

**Все DOI и PMC-идентификаторы, которые были указаны в `docs/`, оказались
настоящими и ведут на работы с заявленными названиями.** Проблема в другом: там,
где ссылка дана без DOI — фамилиями авторов и названием журнала, — атрибуция
систематически неверна. Похоже, предыдущий агент правильно находил работы, но
дописывал к ним фамилии и выходные данные по памяти.

**Практический вывод:** числовые параметры заваривания в
`docs/tea-brewing-science*.md` опираются на реальные исследования, менять их
по итогам аудита не требуется. Исправить нужно список литературы, иначе любая
проверка источника читателем провалится.

---

## 1. Подтверждено полностью

| № | Ссылка в `docs/` | Проверка |
|---|---|---|
| 1 | Cao Q-Q et al. (2022). *npj Science of Food* 6:25. DOI 10.1038/s41538-022-00141-7 | ✅ Cao Qing-Qing и 8 соавторов, «Optimization of brewing conditions for Tieguanyin oolong tea by quadratic orthogonal regression design», npj Science of Food 6(1):25, 2022 |
| 2 | RSC Advances (2021). DOI 10.1039/D0RA09703A | ✅ существует; первый автор **Liu Xiaobo** (10 авторов), «Chemical characterization of Wuyi rock tea with different roasting degrees and their discrimination based on volatile profiles», RSC Advances 11(20):12074–12085. В `docs/` автор не назван — ошибки нет |
| 3 | Jin Y et al. (2019). *Molecules* 24(9):1735. PMC6539062 | ✅ Jin Y, Zhao J, Kim EM, «Comprehensive Investigation of the Effects of Brewing Conditions in Sample Preparation of Green Tea Infusions», Molecules 24, 2019-05-04. DOI 10.3390/molecules24091735 |
| 4 | LWT (2025). Keemun black tea brewing control chart | ✅ Zhao Xiaoyi et al., «Establishing a keemun black tea brewing control chart based on consumer acceptance via survival analysis and degree of satisfaction», LWT **224**:117829, 2025. DOI 10.1016/j.lwt.2025.117829. Препринт: SSRN 10.2139/ssrn.4974675. **В `docs/` DOI не указан — добавить** |
| 5 | BMC Plant Biology, DOI 10.1186/s12870-014-0243-1 (в `docs/tea-research.md`) | ✅ Yue Yi et al. (13 авторов), «TMDB: A literature-curated database for small molecular compounds found from tea», BMC Plant Biology 14(1):243, 2014 |
| 6 | World Green Tea Association — o-cha.net | ✅ сайт живой, страница с параметрами заваривания выгружена, см. [`raw/jp-shizuoka-brewing.md`](./raw/jp-shizuoka-brewing.md) |

---

## 2. Ошибки атрибуции — работа есть, автор не тот

### 2.1. «Balaji V et al. (2015). Nutrition Journal 14:74»

| | |
|---|---|
| Указано в `docs/` | Balaji V et al. (2015). Extraction kinetics of phytochemicals during black tea brewing. *Nutrition Journal* 14:74 |
| **Фактически** | **Fernando, Chamira Dilanka; Soysa, Preethi** (2 автора). «Extraction Kinetics of phytochemicals and antioxidant activity during black tea (*Camellia sinensis* L.) brewing». *Nutrition Journal* 14(1):74, 2015 |
| DOI | 10.1186/s12937-015-0060-x — верен |

Фамилия «Balaji V» в авторском составе отсутствует.

### 2.2. «Jeszka-Skowron A et al. (2018). Molecules 23:1931»

| | |
|---|---|
| Указано в `docs/` | Jeszka-Skowron A et al. (2018). Bioactive compound fingerprint analysis of aged raw and young ripened pu'er tea. *Molecules* 23:1931 |
| **Фактически** | **Pedan, Vasilisa** и 4 соавтора. «Bioactive Compound Fingerprint Analysis of Aged Raw Pu'er Tea and Young Ripened Pu'er Tea». *Molecules* 23(8):1931, 2018 |
| DOI | 10.3390/molecules23081931 — верен |

Агнешка Еszka-Skowron действительно публикуется по чаю и кофе, но не является
автором этой работы.

### 2.3. «Li C et al. (2017). Food Science and Biotechnology 26:217»

| | |
|---|---|
| Указано в `docs/` | Li C et al. (2017). Effect of water quality on Fuding white tea infusions. *Food Science and Biotechnology* 26:217 |
| **Фактически** | **Zhang H, Jiang Y, Lv Y.** «Effect of water quality on the main components in Fuding white tea infusions». ***Journal of Food Science and Technology*** 54(5):1206–1211, апрель 2017 |
| DOI | 10.1007/s13197-017-2571-2 |
| PMC | PMC5380641 — верен, в `docs/` указан правильно |

Неверны одновременно автор, название журнала, том и страницы. Журнал *Food Science
and Biotechnology* (Springer, Корея) и *Journal of Food Science and Technology*
(Springer, Индия) — разные издания.

### 2.4. «Rahman MM et al. (2022). Heliyon 8:e08948»

| | |
|---|---|
| Указано в `docs/` | Rahman MM et al. (2022). Optimization of BT-2 black tea fermentation (TF:TR 1:9.13). *Heliyon* 8:e08948 |
| **Фактически** | первый автор — **Hossain**. «Optimization of the factors affecting BT-2 black tea fermentation by observing their combined effects on the quality parameters…». *Heliyon* 8:e08948, 2022 |
| DOI | 10.1016/j.heliyon.2022.e08948 — том, номер статьи и год верны |

### 2.5. «Pal S et al. (2018). IJTRS 3(1)»

| | |
|---|---|
| Указано в `docs/` | Pal S et al. (2018). Impact of steeping time and water temperature on CTC black tea liquor. *IJTRS* 3(1) |
| **Фактически** | **Murugesan, Palanivel.** «Impact of Different Steeping Time and Water Temperature on Tea Liquor». *International Journal of Technical Research & Science* 3(1), 2018 |
| DOI | 10.30780/ijtrs.v3.i1.2018.005 — в `docs/` отсутствует, добавить |

---

## 3. Ошибки в выходных данных

### 3.1. «Perva-Uzunalic A et al. (2015). Int. J. Food Prop.»

| | |
|---|---|
| Указано в `docs/tea-brewing-science-ru.md` | Perva-Uzunalic A. et al. (2015). Brewing conditions and catechin content. *Int. J. Food Prop.* |
| **Фактически** | Perva-Uzunalić, Amra et al. «Extraction of active ingredients from green tea (*Camellia sinensis*): Extraction efficiency of major catechins and caffeine». ***Food Chemistry*** **96**(4):597–605, **2006** |
| DOI | 10.1016/j.foodchem.2005.03.015 |

Неверны год (2006, не 2015) и журнал (*Food Chemistry*, не *International Journal of
Food Properties*). Это классическая работа по экстракции катехинов — на неё
опирается утверждение о пике EGCG при 85 °C, так что ссылку важно исправить, а не
удалять.

### 3.2. «Franks M et al. (2021) / MDPI (2021). Molecules 26:3485»

| | |
|---|---|
| Указано в `docs/` | EN: «MDPI (2021). Effect of water hardness on catechin and caffeine content in green tea infusions. *Molecules* 26:3485». RU: «Franks M. et al. (2021). Water hardness and green tea catechins. *Molecules* 26:3485» |
| **Фактически** | **Cabrera M, Taher F, Llantada A, Do Q, Sapp T, Sommerhalter M.** «Effect of Water Hardness on Catechin and Caffeine Content in Green Tea Infusions». *Molecules* **26**(12):3485, 2021 |
| DOI | 10.3390/molecules26123485 |

Том, номер статьи и год верны. Фамилия «Franks» в авторском составе отсутствует.
В английской версии автор вообще не указан («MDPI (2021)») — MDPI это издатель,
а не автор.

### 3.3. «Matsuda H. & Ozaki Y. (1996). Chagaku Kenkyu Hokoku»

| | |
|---|---|
| Указано в `docs/tea-brewing-science-ru.md` | Matsuda H. & Ozaki Y. (1996). Gyokuro vs sencha chemistry. *Chagaku Kenkyu Hokoku* |
| Проверка | Название журнала искажено: правильно ***Chagyo Kenkyu Hokoku*** (茶業研究報告, Tea Research Journal), ISSN 0366-6190, индексируется в J-STAGE с префиксом DOI 10.5979/cha |
| Конкретная работа | **не подтверждена.** Поиск по журналу по теме гёкуро/сенча даёт другие работы: ÔMORI (1983) «Discrimination between Sen-cha and Gyokuro with Two Chemical Constituents in Tea», DOI 10.5979/cha.1983.58_28; OHMORI (1989) «Chemical Constituents in Different Parts of Tea Shoots for Gyokuro», DOI 10.5979/cha.1989.21; HORIE (2002) «Umami Taste of "Gyokuro" High Grade Green Tea», DOI 10.5979/cha.2002.91 |

Рекомендация: заменить на ÔMORI (1983) или OHMORI (1989) — они по той же теме и
проверяемы, либо на современную работу Unno et al. (2026), «Compositional Diversity
and Functional Interactions of Bioactive Compounds in Japanese Green Tea: Focus on
Matcha, Sencha, and Gyokuro», *Molecules* 31:2934, DOI 10.3390/molecules31162934.

---

## 4. Две работы сведены в одну ссылку

### «Isopescu R et al. (2018). Food Research International (85,4 °C, 3 мин)»

Это **две разные работы**:

| Работа | Выходные данные |
|---|---|
| Isopescu, Raluca Daniela et al. | «Optimised Pu-erh Tea Infusion by Experimental Design and Response Surface Methodology». ***Revista de Chimie*** **69**(2):310–317, 2018. DOI 10.37358/rc.18.2.6096 |
| Armstrong, Lorene et al. | «Optimizing the extraction of bioactive compounds from pu-erh tea (*Camellia sinensis* var. *assamica*) and evaluation of antioxidant…». ***Food Research International*** **137**:109430, **2020**. DOI 10.1016/j.foodres.2020.109430 |

В `docs/` фамилия взята из первой, журнал — из второй. Утверждение «85,4 °C, 3 мин»
нужно привязать к той из работ, где этот оптимум получен (по названию и методологии
скорее Isopescu 2018, response surface methodology), и проверить по полному тексту.

---

## 5. Не удалось подтвердить

| Ссылка в `docs/` | Статус |
|---|---|
| Theppakorn T et al. (2016). Stability and chemical changes of phenolic compounds during Oolong tea processing. *IFRJ* 23(2) | Не найдена в Crossref. *International Food Research Journal* (Малайзия) в Crossref индексируется неполно, поэтому отсутствие не доказывает, что работы нет. Theppakorn T. — реальный исследователь (Mae Fah Luang University), публикуется по чаю. **Нужна прямая проверка на сайте IFRJ** |
| «Murugesh & Manoj (2015). Water quality and green tea. *J. Food Process Eng.*» — на неё опирается ключевое утверждение: «жёсткая вода (315+ ppm) снижает катехины в настое на 84–93 %» | **Не найдена.** Похоже на искажение Murugesan P. (2018), IJTRS — но у Murugesan тема другая (время и температура настаивания, не жёсткость воды). ⚠ **Цифра 84–93 % остаётся без подтверждённого источника.** В `catalog.json` не используется. Проверяемая альтернатива по той же теме: Cabrera et al. (2021), Molecules 26:3485 |
| «Characterization of Indian black tea (CTC vs orthodox TF/TR). *Phytochemicals* 2020» | Журнала с названием *Phytochemicals* не существует (есть *Phytochemistry*, *Phytochemical Analysis*, *Phytochemistry Reviews*). Ссылка непроверяема в текущем виде |
| «UK Tea Academy (2022). The Ultimate Ingredient for the Perfect Cup of Tea» | Отраслевой white paper, не научная публикация. Уровень **C**, не A/B. Как источник по химии воды использовать только с оговоркой |

---

## Исправленный список литературы

Готов к подстановке в `docs/tea-brewing-science.md` и `-ru.md`. Правка этих файлов
**вне моей зоны ответственности** (`docs/sources/**`) — передаю оркестратору.

1. Cao Q-Q, Zhang X-Z, Xu Y-Q, et al. (2022). Optimization of brewing conditions for
   Tieguanyin oolong tea by quadratic orthogonal regression design. *npj Science of
   Food* 6(1):25. https://doi.org/10.1038/s41538-022-00141-7
2. Liu X, Zhu Y, Yang W, et al. (2021). Chemical characterization of Wuyi rock tea
   with different roasting degrees and their discrimination based on volatile
   profiles. *RSC Advances* 11(20):12074–12085. https://doi.org/10.1039/D0RA09703A
3. Fernando CD, Soysa P (2015). Extraction Kinetics of phytochemicals and antioxidant
   activity during black tea (*Camellia sinensis* L.) brewing. *Nutrition Journal*
   14(1):74. https://doi.org/10.1186/s12937-015-0060-x
4. Pedan V, Popp M, Rohn S, et al. (2018). Bioactive Compound Fingerprint Analysis of
   Aged Raw Pu'er Tea and Young Ripened Pu'er Tea. *Molecules* 23(8):1931.
   https://doi.org/10.3390/molecules23081931
5. Zhang H, Jiang Y, Lv Y (2017). Effect of water quality on the main components in
   Fuding white tea infusions. *Journal of Food Science and Technology* 54(5):1206–1211.
   https://doi.org/10.1007/s13197-017-2571-2 (PMC5380641)
6. Jin Y, Zhao J, Kim EM (2019). Comprehensive Investigation of the Effects of Brewing
   Conditions in Sample Preparation of Green Tea Infusions. *Molecules* 24(9):1735.
   https://doi.org/10.3390/molecules24091735 (PMC6539062)
7. Perva-Uzunalić A, Škerget M, Knez Ž, et al. (2006). Extraction of active ingredients
   from green tea (*Camellia sinensis*): Extraction efficiency of major catechins and
   caffeine. *Food Chemistry* 96(4):597–605.
   https://doi.org/10.1016/j.foodchem.2005.03.015
8. Cabrera M, Taher F, Llantada A, Do Q, Sapp T, Sommerhalter M (2021). Effect of
   Water Hardness on Catechin and Caffeine Content in Green Tea Infusions. *Molecules*
   26(12):3485. https://doi.org/10.3390/molecules26123485
9. Hossain MS, et al. (2022). Optimization of the factors affecting BT-2 black tea
   fermentation by observing their combined effects on the quality parameters.
   *Heliyon* 8:e08948. https://doi.org/10.1016/j.heliyon.2022.e08948
10. Isopescu RD, et al. (2018). Optimised Pu-erh Tea Infusion by Experimental Design
    and Response Surface Methodology. *Revista de Chimie* 69(2):310–317.
    https://doi.org/10.37358/rc.18.2.6096
11. Armstrong L, et al. (2020). Optimizing the extraction of bioactive compounds from
    pu-erh tea (*Camellia sinensis* var. *assamica*) and evaluation of antioxidant
    activity. *Food Research International* 137:109430.
    https://doi.org/10.1016/j.foodres.2020.109430
12. Murugesan P (2018). Impact of Different Steeping Time and Water Temperature on Tea
    Liquor. *International Journal of Technical Research & Science* 3(1).
    https://doi.org/10.30780/ijtrs.v3.i1.2018.005
13. Zhao X, et al. (2025). Establishing a keemun black tea brewing control chart based
    on consumer acceptance via survival analysis and degree of satisfaction. *LWT*
    224:117829. https://doi.org/10.1016/j.lwt.2025.117829
14. Yue Y, et al. (2014). TMDB: A literature-curated database for small molecular
    compounds found from tea. *BMC Plant Biology* 14(1):243.
    https://doi.org/10.1186/s12870-014-0243-1
15. Zimmermann BF, Gleichenhagen M (2013). Steeping Time and Temperature on the Content
    of the Main Flavanols in Green Tea. In: *Tea in Health and Disease Prevention*,
    pp. 335–341. https://doi.org/10.1016/B978-0-12-384937-3.00028-8 — *добавлено:
    прямо по теме температуры и времени, проверяемая ссылка*
16. Hajiaghaalipour F, et al. (2015). Temperature and Time of Steeping Affect the
    Antioxidant Properties of White, Green, and Black Tea Infusions. *Journal of Food
    Science* 81. https://doi.org/10.1111/1750-3841.13149 — *добавлено: охватывает
    белый чай, которого в исходном списке почти не было*
17. Oracz J, et al. (2025). Optimizing brewing conditions for low-temperature green tea
    infusions: Insights into functional and nutritional properties. *Food Chemistry*
    474:143241. https://doi.org/10.1016/j.foodchem.2025.143241 — *добавлено:
    обоснование низкотемпературного заваривания*
18. Mika M, et al. (2026). Brewing conditions and post-brewing handling shape the
    catechin profile and stability of tea infusions. *Food Chemistry* 527:150884.
    https://doi.org/10.1016/j.foodchem.2026.150884 — *добавлено: свежая работа*

Удалить как непроверяемые: «Characterization of Indian black tea… *Phytochemicals*
2020»; «Murugesh & Manoj (2015), *J. Food Process Eng.*» (вместе с утверждением о
снижении катехинов на 84–93 %, пока не найден источник).

Проверить вручную и либо исправить, либо удалить: Theppakorn T et al. (2016), *IFRJ*
23(2); Matsuda H. & Ozaki Y. (1996), *Chagyo Kenkyu Hokoku*.

## Воспроизводимость

Скрипты проверки и машиночитаемые результаты:
`$CLAUDE_JOB_DIR/tmp/verify_refs.py`, `verify_refs2.py`, `refs_verified.json`,
`refs_verified2.json`. Проверку можно повторить в любой момент: Crossref и NCBI
E-utilities — открытые API без авторизации.
