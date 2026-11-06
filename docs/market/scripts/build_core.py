# -*- coding: utf-8 -*-
"""Сборка семантического ядра из агрегированных подсказок.

Вход:  docs/market/wordstat-raw/suggest-aggregated.json
Выход: docs/market/semantic-core.csv

Правила кластеризации и оценки описаны в docs/market/report.md.
"""
import json, csv, re, sys, collections, pathlib, unicodedata

ROOT = pathlib.Path("/home/volin/projects/justea-corp/justea-web-market/docs/market")
AGG = json.loads((ROOT / "wordstat-raw" / "suggest-aggregated.json").read_text(encoding="utf-8"))
TEAS = json.loads(pathlib.Path("/home/volin/projects/justea-corp/justea-web/data/teas.json").read_text(encoding="utf-8"))
CAND = json.loads(pathlib.Path("/home/volin/projects/justea-corp/justea-web/docs/tea-catalog-candidates.json").read_text(encoding="utf-8"))

IN_CATALOG = {t["slug"]: t["name"] for t in TEAS}
# русские названия всех сортов — и каталога, и кандидатов — для человекочитаемых меток
ALL_NAMES = dict(IN_CATALOG)
for t in CAND["teas"]:
    ALL_NAMES.setdefault(t["slug"], t["name"])
ALL_NAMES.setdefault("matcha", "Матча")
ALL_NAMES.setdefault("gaba", "Габа")

def norm(s):
    s = s.lower().replace("ё", "е").strip()
    return re.sub(r"\s+", " ", s)

# ---------------------------------------------------------------- словари

TYPE_MAP = [
    ("matcha",  r"\bматч[аеуи]\b|\bматка\b"),
    ("puerh",   r"\bпуэр\w*|\bшу пуэр|\bшэн пуэр|\bшен пуэр|\bхэй ча\b"),
    ("oolong",  r"\bулун\w*|\bоолонг\w*"),
    ("white",   r"\bбел[ыоа]\w* ча[йяе]\w*"),
    ("yellow",  r"\bжелт[ыоа]\w* ча[йяе]\w*"),
    ("green",   r"\bзелен[ыоа]\w* ча[йяе]\w*"),
    ("black",   r"\bчерн[ыоа]\w* ча[йяе]\w*|\bкрасн[ыоа]\w* ча[йяе]\w*"),
]

# сорта: из каталога + кандидатов, плюс народные написания
def variety_patterns():
    def pat_for(name):
        n = re.escape(norm(name))
        # короткое название без границ слова ловит мусор («Ува» -> «одуванчиков», «Ява» -> бренд)
        return rf"\b{n}\b" if len(norm(name)) <= 6 else n
    pats, seen = [], set()
    for t in TEAS:
        pats.append((t["slug"], pat_for(t["name"]), True)); seen.add(t["slug"])
    for t in CAND["teas"]:
        if t["slug"] in seen:
            continue
        pats.append((t["slug"], pat_for(t["name"]), False))
    return pats

VARIETIES = variety_patterns()
# народные варианты написания для сортов, которые реально ищут
ALIASES = {
    "gyokuro":        [r"г[еёь]?окуро", r"гекуро"],
    "sencha":         [r"сенч[ауи]", r"сэнча"],
    "hojicha":        [r"ходзич[аеу]", r"хоудзича"],
    "genmaicha":      [r"генмайч[аеу]", r"генмайта"],
    "tie-guan-yin":   [r"те гуань инь", r"тигуанинь", r"ти гуань инь"],
    "da-hong-pao":    [r"да хун пао", r"дахунпао"],
    "longjing":       [r"лунцзин\w*", r"лун цзин"],
    "bi-lo-chun":     [r"би ло чун\w*", r"билочунь"],
    "bai-hao-yin-zhen": [r"бай хао инь чжень", r"серебряные иглы"],
    "milk-oolong":    [r"молочный улун", r"най сян"],
    "gaba":           [r"\bгаб[аб]\b", r"габа чай", r"габа улун"],
}

TEAWARE = [
    ("gaiwan",      r"\bгайван[ьи]\b"),
    ("yixing",      r"исинск\w*|исинь|\bглинян\w* чайник"),
    ("chahai",      r"\bчахай\b|\bчаха[еи]\b"),
    ("chaban",      r"\bчабан[ьи]\b|чайная доска"),
    ("teapot",      r"чайник для заваривания|стеклянн\w* чайник|\bтипот\b|заварочн\w* чайник"),
    ("cups",        r"\bпиал[аыуе]\b|чайная пара|\bчаван\b"),
    ("matcha-tools", r"венчик для матчи|\bчасен\b|\bчашаку\b|бамбуков\w* венчик"),
    ("accessories", r"чайное сито|весы для чая|\bситечк\w*|термос для чая"),
]

# Церемония классифицируется по набору признаков, а не каскадом регекспов:
# один запрос часто несёт сразу гео + формат (напр. «чайная церемония в спб для двоих в подарок»).
CER_TRIGGER = r"чайн\w* церемони\w*|\bчаепити\w*|\bгунфу ча\b|\bгун фу ча\b|\bпин ча\b|\bдоу ча\b|чайн\w* клуб\w*|чайный дом\b|\bчайная\b(?!\s*(?:доска|пара|ложка|ситечко|церемони|комната|плантаци))"
CER_SPB     = r"\bспб\b|санкт-петербург|\bпетербург\w*|\bпитер\w*|ленинградск\w*"
CER_MSK     = r"\bмоскв\w*|\bмск\b|подмосков\w*"
CER_PAIR    = r"\bдвоих\b|\bвдвоем\b|\bвдвоём\b|\bпарн\w*|романтич\w*|\bсвидани\w*|для пары\b"
CER_GIFT    = r"\bподарок\b|\bподарочн\w*|\bсертификат\w*|\bв подарок\b|\bдарить\b"
CER_MK      = r"мастер[- ]класс\w*|\bобучени\w*|\bкурс\w*|\bшкол[аыу]\b|\bнаучить\w*"
CER_PRICE   = r"\bцен[аыу]\b|\bстоимост\w*|сколько стоит|\bпрайс\w*|\bнедорого\b|\bбесплатн\w*"
CER_WHATIS  = r"что так\w*|\bчто это\b|как проход\w*|как провод\w*|как провести|\bзачем\b|в чем смысл|\bсмысл\b|\bправил\w*|\bэтикет\w*|\bистори\w*|\bкратко\b|сколько (?:по времени|длится)|для чего|\bописани\w*|\bтрадици\w*"
CER_CHINA   = r"китайск\w*|\bкитай\w*|\bгунфу\b|\bпин ча\b|\bча дао\b|\bлу юй\b"
CER_JAPAN   = r"японск\w*|\bяпони\w*|\bтяною\b|\bчаною\b|\bтядо\b|\bчасицу\b|\bматча\b"
CER_GROUP   = r"\bгрупп\w*|для компании\b|\bкомпанией\b|\bкорпоратив\w*|\bколлектив\w*|\bна человек\w*|малой групп"
CER_VISIT   = r"\bзаписат\w*|\bзапис[ьи]\b|\bсходить\b|\bпосетит\w*|\bпопаст\w*|\bгде\b|\bадрес\w*|\bрядом\b|\bзабронир\w*|\bбронирован\w*"
CER_OUTCALL = r"\bвыездн\w*|\bна дом\b|\bна выезд\b|\bв офис\b"


def ceremony_sub(nq):
    """Подкластер церемонии. Порядок проверок = приоритет для лендинга Регины."""
    spb, msk = bool(re.search(CER_SPB, nq)), bool(re.search(CER_MSK, nq))
    # выездная/корпоратив не продаётся ни в каком гео — проверяем до гео-веток
    if re.search(CER_OUTCALL, nq):
        return "ceremony-spb-outcall-nontarget" if spb else "ceremony-outcall-nontarget"
    # 1. целевые для лендинга: СПб + формат
    if spb and re.search(CER_PAIR, nq):   return "ceremony-spb-pair"
    if spb and re.search(CER_GIFT, nq):   return "ceremony-spb-gift"
    if spb and re.search(CER_MK, nq):     return "ceremony-spb-masterclass"
    if spb and re.search(CER_VISIT, nq):  return "ceremony-spb-visit"
    if spb and re.search(CER_PRICE, nq):  return "ceremony-spb-price"
    if spb:                                return "ceremony-spb-core"
    # 2. формат без гео — тоже целевое, гео добавит лендинг
    if re.search(CER_GROUP, nq):          return "ceremony-group"
    if re.search(CER_PAIR, nq):           return "ceremony-pair"
    if re.search(CER_GIFT, nq):           return "ceremony-gift"
    if re.search(CER_MK, nq):             return "ceremony-masterclass"
    if re.search(CER_PRICE, nq):          return "ceremony-price"
    # 3. другое гео
    if msk:                                return "ceremony-msk-nontarget"
    # 4. информационные
    if re.search(CER_WHATIS, nq):         return "ceremony-what-is"
    if re.search(CER_JAPAN, nq):          return "ceremony-japan"
    if re.search(CER_CHINA, nq):          return "ceremony-china"
    if re.search(r"чайн\w* клуб\w*|чайный дом\b|\bчайная\b", nq): return "ceremony-club"
    return "ceremony-other"


# фразы, которые внешне похожи на церемонию, но это посуда
TEAWARE_GUARD = r"чайная доска|чайная пара|чайная ложка|чайное сито|чайная плантаци"

BREWING_SUB = [
    ("brewing-temperature", r"температур\w*|\bгорячей\b|какой водой|кипятк\w*"),
    ("brewing-proportions", r"пропорц\w*|сколько грамм|сколько чая на|\bдозировк\w*"),
    ("brewing-time",        r"сколько (?:минут|времени|заваривать)|как долго|\bвремя заваривания\b"),
    ("brewing-infusions",   r"пролив\w*|сколько раз|повторн\w* заваривани|\bгунфу\b"),
    ("brewing-water",       r"\bвод[аыу]\b|жесткост|фильтр|минерал"),
    ("brewing-gaiwan",      r"гайван|типот|исинск"),
    ("brewing-cold",        r"холодн\w* заваривани|колд брю|cold brew|\bв холодной воде\b"),
    ("brewing-thermos",     r"термос\w*"),
    ("brewing-howto",       r"как (?:правильно )?заваривать|как заварить|способ заваривания|заваривание"),
]

HEALTH_SUB = [
    ("health-benefit-harm", r"польз\w* и вред|польз\w*|\bвред\w*|\bсвойств\w*|чем полезен|\bпротивопоказани"),
    ("health-effect",       r"\bэффект\w*|\bбодр\w*|\bтонизир\w*|опьянен\w*|\bнаркот\w*|\bторч\w*|\bвтыка\w*|\bчайное опьянение\b"),
    ("health-pressure",     r"давлени\w*|гипертон|\bпульс\b|\bсердц\w*"),
    ("health-caffeine",     r"кофеин\w*|\bтеин\w*|\bл-теанин\b|\bтеанин\b"),
    ("health-sleep",        r"перед сном|\bна ночь\b|\bсон\b|бессонниц"),
    ("health-stomach",      r"желудк\w*|натощак|\bкишечник\w*|\bгастрит\w*|\bпечен\w*"),
    ("health-slimming",     r"похудени\w*|\bдиет\w*|\bметаболизм\b|сжигани\w* жир"),
]

COMMERCIAL_PAT = r"\bкупить\b|\bцена\b|\bстоимость\b|\bзаказать\b|\bмагазин\w*|\bдоставк\w*|\bопт\w*|\bскидк\w*|\bпродаж\w*|\bинтернет-магазин\b"
LOCAL_PAT = r"\b(спб|санкт-петербург|петербург|питер\w*|москв\w*|мск|рядом|недалеко|адрес\w*|на карте|поблизости)\b"
NAV_PAT = r"\bмойчай\b|\bмой чай\b|\bspecial tea\b|\bteatips\b|\bwaystea\b|\bозон\b|\bвайлдберриз\b|\bозоне\b|\bяндекс маркет\b|\bкантата\b|\bahmad\b|\bgreenfield\b|\bлисма\b|\bпринцесса\b|\bтесс\b|\bникитин\b|\bшумерл\w*"

OFF_TARGET = (r"терафлю|шиповник|чиа\b|кофе в турке|\bчаг[аиу]\b|чаванпраш|крестецк|чайная ложка|"
              r"двор улун|\bфильм\w*|смотреть|сериал|онлайн бесплатно|кантата|моя кофейня|dreamlight|"
              r"\bскачать\b|\bмем\b|\bаниме\b|\bпесн\w*|текст песни|читать онлайн|\bкнига\b|"
              r"геморро|молочниц|беременн\w*|\bдля кожи\b|\bмаск[аи] для лица\b|\bшампун\w*|\bкрем\b|"
              r"\bгречишн\w*|\bиван[- ]чай\b|\bройбуш\w*|\bкаркаде\b|\bмат[еэ]\b(?! )|\bромашк\w*|"
              r"\bоблепих\w*|\bчай с шариками\b|\bбабл ти\b|\bтест какой ты\b|\bкурил\w*|\bконоп\w*|"
              r"\bодуванчик\w*|\bшувалов\w*|\bява\b|\bлисма\b|\bпринцесса \w+|"
              # парфюм, косметика, эвфемизмы — важные минус-слова для рекламы
              r"\bдух[иов]\w*|\bпарфюм\w*|\bфрагрантика\b|гель для душа|aqua voyage|\bаромат\w* свеч|"
              r"массажн\w*|\bмассаж\w*|\bгормон\w*|\bаптек\w*")


def classify(q):
    """-> (cluster, subcluster, intent, target)"""
    nq = norm(q)
    if re.search(OFF_TARGET, nq):
        return "off-target", "", "—", "нет"
    # «габа» без чайного контекста — это парфюм или аминокислота, не наш чай
    if re.search(r"\bгаб[аы]\b", nq) and not re.search(r"ча[йяёюе]|улун|оолонг|\bгаба ча", nq):
        return "off-target", "", "—", "нет"

    # интент
    if re.search(NAV_PAT, nq):
        intent = "навигационный"
    elif re.search(COMMERCIAL_PAT, nq):
        intent = "коммерческий"
    else:
        intent = "информационный"
    if re.search(LOCAL_PAT, nq):
        intent = "локальный" if intent != "навигационный" else intent

    # «чайная доска/пара/ложка» — посуда, а не церемония
    if re.search(TEAWARE_GUARD, nq):
        for sub, pat in TEAWARE:
            if re.search(pat, nq):
                return "teaware", f"teaware-{sub}", intent, "да"
        return "teaware", "teaware-accessories", intent, "да"

    # церемония — главный приоритет, это лендинг
    if re.search(CER_TRIGGER, nq):
        sub = ceremony_sub(nq)
        tgt = "нет" if sub.endswith("-nontarget") else "да"
        return "ceremony", sub, intent, tgt

    # посуда
    for sub, pat in TEAWARE:
        if re.search(pat, nq):
            # «как заваривать в гайвани» — это всё-таки заваривание
            if re.search(r"как (?:правильно )?заварива|как заварить|как пользоваться", nq):
                return "brewing", "brewing-gaiwan", intent, "да"
            return "teaware", f"teaware-{sub}", intent, "да"

    # заваривание
    if re.search(r"заварива|заварить|\bпролив|\bгунфу\b|температур\w*.*ча[йяе]|пропорц\w*.*ча[йяе]", nq):
        for sub, pat in BREWING_SUB:
            if re.search(pat, nq):
                return "brewing", sub, intent, "да"
        return "brewing", "brewing-howto", intent, "да"

    # здоровье и эффект
    for sub, pat in HEALTH_SUB:
        if re.search(pat, nq):
            tgt = "нет" if sub == "health-slimming" else "да"
            return "health", sub, intent, tgt

    # сорт
    for slug, pat, in_cat in VARIETIES:
        pats = [pat] + [p for p in ALIASES.get(slug, [])]
        for p in pats:
            if re.search(p, nq):
                return "variety", f"variety-{slug}", intent, "да"
    for slug, alts in ALIASES.items():
        for p in alts:
            if re.search(p, nq):
                return "variety", f"variety-{slug}", intent, "да"

    # тип
    for sub, pat in TYPE_MAP:
        if re.search(pat, nq):
            return "type", f"type-{sub}", intent, "да"

    # общая инфа про чай
    if re.search(r"\bча[йяёюе]\w*|\bчайн\w*", nq):
        if intent == "коммерческий":
            return "commercial", "commercial-general", intent, "частично"
        return "info", "info-general", intent, "да"
    return "off-target", "", "—", "нет"


# ------------------------------------------------- привязка к каталогу и метка
# Структуру URL сводит justea-seo, поэтому здесь только факты: к какому сорту и
# типу относится запрос, и человекочитаемая метка кластера.

TYPE_RU = {"green": "зелёный чай", "black": "чёрный чай", "white": "белый чай",
           "yellow": "жёлтый чай", "oolong": "улун", "puerh": "пуэр и хэй ча",
           "matcha": "матча"}

CLUSTER_LABEL = {
    "ceremony-spb-core":        "чайная церемония СПб",
    "ceremony-spb-pair":        "чайная церемония СПб, на двоих",
    "ceremony-spb-gift":        "чайная церемония СПб, в подарок",
    "ceremony-spb-visit":       "чайная церемония СПб, как попасть",
    "ceremony-spb-price":       "чайная церемония СПб, цена",
    "ceremony-spb-masterclass": "чайная церемония СПб, мастер-класс",
    "ceremony-pair":            "чайная церемония на двоих",
    "ceremony-gift":            "чайная церемония в подарок",
    "ceremony-price":           "чайная церемония, цена",
    "ceremony-masterclass":     "обучение чайной церемонии",
    "ceremony-group":           "чайная церемония для группы",
    "ceremony-what-is":         "что такое чайная церемония",
    "ceremony-china":           "китайская чайная церемония",
    "ceremony-japan":           "японская чайная церемония",
    "ceremony-club":            "чайные клубы и чайные",
    "ceremony-other":           "чайная церемония, прочее",
    "ceremony-msk-nontarget":   "чайная церемония Москва (чужое гео)",
    "ceremony-outcall-nontarget": "выездная церемония и корпоратив (не продаём)",
    "ceremony-spb-outcall-nontarget": "выездная церемония СПб (не продаём)",
    "brewing-howto":            "как заваривать",
    "brewing-temperature":      "температура заваривания",
    "brewing-proportions":      "пропорции чая и воды",
    "brewing-time":             "время заваривания",
    "brewing-infusions":        "проливы и гунфу-ча",
    "brewing-water":            "вода для чая",
    "brewing-gaiwan":           "заваривание в гайвани и типоте",
    "brewing-cold":             "холодное заваривание",
    "brewing-thermos":          "заваривание в термосе",
    "health-benefit-harm":      "польза и вред",
    "health-effect":            "эффект и бодрость",
    "health-pressure":          "чай и давление",
    "health-caffeine":          "кофеин и теанин",
    "health-sleep":             "чай и сон",
    "health-stomach":           "чай и желудок",
    "health-slimming":          "чай для похудения (не наша цель)",
    "commercial-general":       "покупка чая",
    "info-general":             "справка о чае",
}


def match_variety(nq):
    for slug, pat, in_cat in VARIETIES:
        for p in [pat] + ALIASES.get(slug, []):
            if re.search(p, nq):
                return slug
    for slug, alts in ALIASES.items():
        for p in alts:
            if re.search(p, nq):
                return slug
    return ""


def match_type(nq):
    for sub, pat in TYPE_MAP:
        if re.search(pat, nq):
            return sub
    return ""


def label(cluster, sub, nq):
    v, t = match_variety(nq), match_type(nq)
    if cluster == "variety":
        return f"сорт: {ALL_NAMES.get(v, v)}" if v else "сорт чая"
    if cluster == "type":
        return f"тип: {TYPE_RU.get(t, t)}" if t else "тип чая"
    if cluster == "teaware":
        return "посуда для чая"
    base = CLUSTER_LABEL.get(sub, cluster)
    if cluster in ("brewing", "health"):
        if v:
            return f"{base}: {ALL_NAMES.get(v, v)}"
        if t:
            return f"{base}: {TYPE_RU.get(t, t)}"
    return base


# ---------------------------------------------------------------- оценка спроса

def band(hits, avg_pos, seed_count):
    """Оценочная полоса спроса. hits = в сколько выдач подсказок попал запрос,
    avg_pos = средняя позиция (0 = первая). Обе величины ИЗМЕРЕНЫ, полоса — ОЦЕНКА."""
    score = hits * (1.6 if avg_pos < 1.5 else 1.3 if avg_pos < 3 else 1.0)
    if score >= 14: return "очень высокая"
    if score >= 8:  return "высокая"
    if score >= 4:  return "средняя"
    if score >= 2:  return "низкая"
    return "очень низкая"


def competition(cluster, sub, intent, q):
    """Оценка конкуренции в выдаче. ГИПОТЕЗА по типу запроса, не измерение."""
    if intent == "коммерческий":
        return "высокая"      # маркетплейсы и магазины
    if intent == "навигационный":
        return "н/п"
    if cluster == "ceremony":
        if sub.startswith("ceremony-spb"):
            return "средняя"        # локальные клубы, афиши и агрегаторы подарков
        if sub == "ceremony-msk-nontarget":
            return "высокая"
        if sub in ("ceremony-what-is", "ceremony-china", "ceremony-japan"):
            return "высокая"        # забито медиа и энциклопедиями
        return "средняя"
    if cluster == "health":
        return "высокая"       # медиа-порталы и «здоровье» сайты
    if cluster == "brewing":
        return "низкая"        # наша сильная зона: точные параметры
    if cluster == "variety":
        return "средняя"
    if cluster == "type":
        return "высокая"
    if cluster == "teaware":
        return "высокая"
    return "средняя"


def confidence(r):
    """Насколько наблюдение похоже на живой запрос, а не на комбинаторную
    достройку подсказки под мой сид. Два движка + много попаданий = надёжнее."""
    both = len(r["engines"]) == 2
    if r["hits"] >= 3 and both:  return "высокая"
    if r["hits"] >= 3 or both:   return "средняя"
    if r["hits"] == 2:           return "средняя"
    return "низкая"


CATALOG_SLUGS = set(IN_CATALOG)

def priority(cluster, sub, intent, target, dem, conf, in_catalog):
    """P1 — делать сейчас, P2 — следующая волна, P3 — хвост/на будущее."""
    if target == "нет":
        return "P0 (не наша цель)"
    low = conf == "низкая"
    strong = dem in ("очень высокая", "высокая", "средняя")
    if cluster == "ceremony" and sub.startswith("ceremony-spb"):
        return "P1" if not low else "P2"
    if cluster == "ceremony" and sub in ("ceremony-gift", "ceremony-pair", "ceremony-price", "ceremony-masterclass"):
        return "P2" if strong and not low else "P3"
    if cluster in ("brewing", "variety") and in_catalog:
        return "P1" if strong and not low else "P2"
    if cluster in ("brewing", "variety") and strong and not low:
        return "P2"
    if cluster in ("type", "health", "teaware", "info") and strong and not low:
        return "P2" if cluster in ("type", "health") else "P3"
    return "P3"


rows = []
for r in AGG:
    q = r["query"]
    cluster, sub, intent, target = classify(q)
    nq = norm(q)
    dem = band(r["hits"], r["avg_pos"], r["seed_count"])
    conf = confidence(r)
    slug = match_variety(nq)
    tp = match_type(nq)
    in_cat = slug in CATALOG_SLUGS
    rows.append({
        "кластер": cluster,
        "подкластер": sub,
        "запрос": q,
        "интент": intent,
        "спрос_оценка": dem,
        "подсказки_попаданий": r["hits"],
        "подсказки_ср_позиция": r["avg_pos"],
        "подсказки_движки": "+".join(r["engines"]),
        "надежность_наблюдения": conf,
        "конкуренция_гипотеза": competition(cluster, sub, intent, q),
        "кластер_метка": label(cluster, sub, nq),
        "связанный_сорт": slug,
        "сорт_в_каталоге": "да" if in_cat else ("нет" if slug else ""),
        "связанный_тип": tp,
        "цель_justea": target,
        "приоритет": priority(cluster, sub, intent, target, dem, conf, in_cat),
        # частотность: заполняется после получения доступа к Вордстату (см. report.md §9)
        "frequency": "", "frequency_source": "", "frequency_date": "",
        "wordstat_спб": "", "wordstat_мск": "", "wordstat_рф": "",
    })

order = {"ceremony": 0, "brewing": 1, "variety": 2, "type": 3, "health": 4,
         "teaware": 5, "info": 6, "commercial": 7, "off-target": 9}
band_order = {"очень высокая": 0, "высокая": 1, "средняя": 2, "низкая": 3, "очень низкая": 4}
pri_order = {"P1": 0, "P2": 1, "P3": 2, "P0 (не наша цель)": 3}
rows.sort(key=lambda r: (pri_order[r["приоритет"]], order[r["кластер"]], r["подкластер"],
                         band_order[r["спрос_оценка"]], -r["подсказки_попаданий"]))

dst = ROOT / "semantic-core.csv"
with dst.open("w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys()), delimiter=";", lineterminator="\n")
    w.writeheader(); w.writerows(rows)
print("->", dst, len(rows), "строк,", dst.stat().st_size, "байт")

print("\n=== по приоритетам ===")
for k, v in sorted(collections.Counter(r["приоритет"] for r in rows).items()):
    print(f"  {k:20} {v:6}")
print("\n=== по надёжности наблюдения ===")
print(" ", collections.Counter(r["надежность_наблюдения"] for r in rows))
print("\n=== по кластерам ===")
c = collections.Counter(r["кластер"] for r in rows)
for k, v in sorted(c.items(), key=lambda x: order[x[0]]):
    print(f"  {k:12} {v:6}")
print("\n=== по интенту (без off-target) ===")
print(collections.Counter(r["интент"] for r in rows if r["кластер"] != "off-target"))
print("\n=== подкластеры церемонии ===")
for k, v in collections.Counter(r["подкластер"] for r in rows if r["кластер"] == "ceremony").most_common():
    print(f"  {k:24} {v}")
print("\n=== подкластеры заваривания ===")
for k, v in collections.Counter(r["подкластер"] for r in rows if r["кластер"] == "brewing").most_common():
    print(f"  {k:24} {v}")
