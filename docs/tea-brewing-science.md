# Tea Brewing Science — Optimal Parameters Reference

> Scientific and sensory-optimal brewing parameters for popular teas in the Justea catalog.  
> Compiled: 2026-07-11  
> **Русская версия (каталог + приоритет 2):** [tea-brewing-science-ru.md](./tea-brewing-science-ru.md)  
> For use by content agents populating `data/teas.json` and brew-method fields.

---

## How to Read This Document

| Field | Meaning |
|-------|---------|
| **Ratio** | Grams of dry leaf per 100 mL water (matches `BrewMethod.ratio` in `types/tea.ts`) |
| **Fermentation / oxidation** | Enzymatic browning of leaf polyphenols during manufacture (not microbial fermentation unless noted) |
| **TF / TR** | Theaflavins / thearubigins — oxidative dimers and polymers from catechin oxidation |
| **TPC** | Total phenolic content |

General extraction kinetics (all Camellia sinensis):

1. **Fast extractors** (seconds–2 min): caffeine, gallic acid, free amino acids (theanine), low-molecular volatiles.
2. **Medium extractors** (1–5 min): monomeric catechins (EGCG, ECG, EGC, EC).
3. **Slow extractors** (5+ min or high heat): theaflavins, thearubigins, theabrownins, polymeric pigments, melanoidins from roasting.

Multi-infusion gongfu shifts the cup profile from aromatics → body → sweetness/aftertaste as leaf surface area opens.

---

## OOLONGS

### 1. Tie Guan Yin (Anxi Light Oolong)

#### Fermentation & Dominant Compounds

| Parameter | Value |
|-----------|-------|
| Oxidation level | **15–30%** (modern *qingxiang* / floral style); **30–50%** (traditional Anxi) |
| Dominant polyphenols | **Monomeric catechins** (EGCG, ECG, EGC) — PPO halted early by pan-firing |
| Secondary compounds | Trace theaflavins, bisflavanols, theasinensins; minimal thearubigins |
| Amino acids | Theanine elevated relative to black tea; contributes to *gan* (sweetness) |
| Caffeine | Moderate; extracts quickly at high temperature |

Modern light TGY retains ~70–85% of fresh-leaf catechin profile. Partial indoor withering (10–20% fermentation in processing studies) converts ~15–25% of catechins to dimers before kill-green.

#### Optimal Brewing

| Method | Ratio (g/100 mL) | Temp (°C) | Time | Infusions |
|--------|------------------|-----------|------|-----------|
| **Gongfu** (recommended) | **5.0** (R = 20 mL/g) | **95–100** | 1st: 15–25 s; +5–10 s each | 6–10 |
| **Western** | **2.0–2.5** | **85–90** | 2–3 min | 1–2 |
| **Scientific optimum** (Cao et al. 2022) | **5.0** (R = 20 mL/g) | **100** | **100 s** (daily drinkers) | 1 long steep |
| Balanced flavor + health | **3.8** (R = 26 mL/g) | **100** | **127 s** | 1 |

**Rationale:** Quadratic orthogonal regression on Tieguanyin showed water/tea ratio (R) as the strongest driver of TPC, catechin yield, and antioxidant activity. Lower R (higher leaf loading) concentrates infusion; higher T (100 °C) maximizes catechin and TPC extraction without the degradation seen in over-oxidized blacks. Short gongfu steeps prevent over-extraction of ECG/EGCG gallates that cause harsh astringency.

#### Water Chemistry

| Parameter | Target |
|-----------|--------|
| TDS | **50–100 mg/L** (soft) |
| pH | **6.5–7.0** |
| Ca²⁺ | **< 30 mg/L** — high calcium binds catechins, dulls floral aroma |
| Mg²⁺ | **5–10 mg/L** — enhances catechin solubility |
| Bicarbonate | **< 30 mg/L** — alkaline water shifts color and bitterness |

Pure or lightly remineralized RO water performed best in TGY extraction studies. Avoid hard tap water.

#### Gongfu vs Western

| | Gongfu | Western |
|---|--------|---------|
| Best for | Floral orchid notes, evolving infusions, *qingxiang* modern TGY | Casual drinking, office brewing |
| Ratio | 5 g / 100 mL | 2–2.5 g / 100 mL |
| Temp | 95–100 °C | 85–90 °C |
| Profile | Layered: aroma → body → sweet aftertaste | Single balanced cup; less nuance |
| Leaf type | Ball-rolled — needs rinse to open | Same; longer steep compensates for low ratio |

#### Compound Extraction Timeline

| Infusion | What Dominates | Sensory Result |
|----------|----------------|----------------|
| **Rinse** (5 s, discard) | Dust, surface volatiles, light caffeine | Opens ball-rolled leaf; removes processing dust |
| **1st** (15–25 s) | **Linalool-family volatiles**, light theanine, early EGCG | Bright orchid/floral, light body, fresh *gan* |
| **2nd** (20–30 s) | Peak **catechin** extraction begins; caffeine rises | Fuller mouthfeel, classic TGY profile |
| **3rd** (30–40 s) | **EGCG + ECG** plateau; antioxidant activity often peaks here | Balanced floral + creaminess; best "sweet spot" for many drinkers |
| **4th+** | Remaining catechins, trace TF; amino acid sweetness | Softer, sweeter, less aromatic |

#### Common Mistakes

- **Water too cool (< 85 °C):** Ball-rolled leaf does not open; thin, flat cup.
- **Western steep too long at high temp:** Bitter ECG/EGCG overload.
- **Hard tap water:** Masks orchid aromatics; increases astringency.
- **Skipping rinse:** First drinkable infusion is murky and uneven.
- **Treating traditional (30–50%) TGY like green tea:** Needs near-boiling water despite "light" marketing.

---

### 2. Da Hong Pao (Wuyi Rock Tea / *Yancha*)

#### Fermentation & Dominant Compounds

| Parameter | Value |
|-----------|-------|
| Oxidation level | **60–80%** (medium-heavy) |
| Roasting | **Charcoal roasting** (multiple sessions, weeks–months) — defining step |
| Dominant polyphenols | **Theaflavins** (elevated vs. other oolongs; DHP among highest TF in comparative HPLC studies), **thearubigins**, residual catechins |
| Roast products | Pyrazines, furans, naphthalene derivatives; melanoidins |
| Amino acids | Reduced 13–17% vs. medium-roast samples; **TP/AA ratio rises** with roast degree |
| Character marker | *Yan yun* (rock/mineral rhyme) — terroir minerals + roast chemistry |

Heavy roasting decreases catechins and free amino acids while increasing polymeric phenols and volatile roast markers. Sufficient roasting reduces catechin content ~13–17% vs. moderate roast.

#### Optimal Brewing

| Method | Ratio (g/100 mL) | Temp (°C) | Time | Infusions |
|--------|------------------|-----------|------|-----------|
| **Gongfu** (recommended) | **5.0–7.0** | **95–100** | Rinse 3–5 s; 1st: 5–15 s; +3–5 s | 7–12 |
| **Western** | **1.5–2.0** | **95** | 3–4 min | 1–2 |
| Heavy traditional | **7.0–8.0** | **100** | 1st: 5–10 s | 8–12 |

**Rationale:** High oxidation + roast creates dense, hydrophobic leaf. Near-boiling water is required to extract theaflavins, roast volatiles, and mineral character. Short first steeps prevent bitter TR/HPS overload. Wuyi rock teas are **not** delicate — 80 °C water produces thin, sour, under-extracted cups.

#### Water Chemistry

| Parameter | Target |
|-----------|--------|
| TDS | **75–150 mg/L** |
| pH | **6.8–7.2** |
| Ca²⁺ | **10–40 mg/L** — slight body helps; > 80 mg/L causes scum |
| Mg²⁺ | **5–15 mg/L** |
| Bicarbonate | **< 50 mg/L** |

Rock teas tolerate slightly higher mineral content than green/high-mountain oolong. Very soft water can make roast profile feel hollow.

#### Gongfu vs Western

| | Gongfu | Western |
|---|--------|---------|
| Best for | Full *yan yun*, roast evolution, multiple layers | Acceptable but flattens complexity |
| Ratio | 5–7 g / 100 mL | 1.5–2 g / 100 mL |
| Temp | 95–100 °C (non-negotiable) | 95 °C |
| Vessel | Yixing (seasoned for roast) or porcelain gaiwan | Large pot or mug |
| Note | Porcelain better for evaluating unfamiliar tea; clay adds body | Misses 6+ infusions of evolving roast/mineral |

#### Compound Extraction Timeline

| Infusion | What Dominates | Sensory Result |
|----------|----------------|----------------|
| **Rinse** | Roast dust, surface TF | Awakens compressed roast leaf |
| **1st** (5–15 s) | **Roast volatiles** (pyrazines), light TF, caffeine | Charcoal, cocoa, mineral hint; intentionally light |
| **2nd** (15–25 s) | **Theaflavins**, early TR, roast mid-notes | Body builds; *yan yun* emerges |
| **3rd** (25–35 s) | **TF + TR balance**, melanoidins, mineral ions from leaf | Peak complexity: roast + rock + sweetness |
| **4th+** | TR polymers, sustained roast sweetness | Softer, woody, date-like; astringency fades |

#### Common Mistakes

- **Under-temperature water (< 95 °C):** #1 error — thin, raw, sour cup.
- **Over-steeping first infusion (30+ s):** Bitter, harsh TR extraction.
- **Using green-tea mindset:** DHP is heavily oxidized and roasted; needs heat and short steeps.
- **Unseasoned clay pot with mixed teas:** Absorbs and muddies roast character.
- **Old/low-quality leaf at high ratio:** Roast masks stale base; bitterness without *hui gan*.

---

### 3. Dong Ding (Taiwan)

#### Fermentation & Dominant Compounds

| Parameter | Value |
|-----------|-------|
| Oxidation level | **30–40%** (traditional); **20–30%** (modern lighter trend) |
| Roasting | **Medium charcoal roast** — signature of traditional Dong Ding |
| Dominant polyphenols | **Mixed catechins + moderate TF/TR** from mid-oxidation |
| Secondary | Melanoidins from roasting; theasinensins |
| Amino acids | Moderate theanine; roast reduces free amino acids |
| Cultivar | Typically **Qing Xin** (same as high-mountain, but different processing) |

Dong Ding bridges Taiwanese floral oolong and Wuyi roast style: more oxidation than Alishan, less than *yancha*.

#### Optimal Brewing

| Method | Ratio (g/100 mL) | Temp (°C) | Time | Infusions |
|--------|------------------|-----------|------|-----------|
| **Gongfu** (recommended) | **5.0–6.0** | **90–95** | Rinse 5 s; 1st: 20–30 s; +5–10 s | 6–8 |
| **Western** | **1.2–1.5** | **95** | 2–3 min | 2–3 |

**Rationale:** Ball-rolled medium-oxidation leaf needs rinse + moderate heat. Roast component requires 90 °C+ for melanoidin extraction; pure boiling can scorch lighter modern Dong Ding. 30–40% oxidation means catechins and TF coexist — short steeps balance floral and roast.

#### Water Chemistry

| Parameter | Target |
|-----------|--------|
| TDS | **75–120 mg/L** |
| pH | **6.5–7.0** |
| Ca²⁺ | **< 40 mg/L** |
| Mg²⁺ | **5–12 mg/L** |

Taiwanese spring water profiles (moderate softness) are ideal. Hard water dulls roast-honey sweetness.

#### Gongfu vs Western

| | Gongfu | Western |
|---|--------|---------|
| Best for | Roast-floral balance, *hui gan*, multiple infusions | Everyday drinking |
| Ratio | 5–6 g / 100 mL | 1.2–1.5 g / 100 mL |
| Temp | 90–95 °C | 95 °C |
| Profile | Fruity → roasted → sweet | Single-note; roast dominates if over-steeped |

#### Compound Extraction Timeline

| Infusion | What Dominates | Sensory Result |
|----------|----------------|----------------|
| **Rinse** | Surface compounds, opens ball | Prepares tight roll |
| **1st** (20–30 s) | **Floral volatiles**, light catechins, theanine | Orchid, light fruit |
| **2nd** (30–40 s) | **Catechins + early TF**, roast aromatics | Body increases; honey notes |
| **3rd** (40–50 s) | **TF/TR + melanoidins**, mineral finish | Classic Dong Ding: fruit, roast, lingering sweetness |
| **4th+** | Residual sweetness, softer tannins | Mellow, woody |

#### Common Mistakes

- **No rinse:** Tight ball-rolled leaf under-extracts on 1st steep.
- **Boiling water on light-roast modern Dong Ding:** Flattened florals, harsh edges.
- **Confusing with high-mountain oolong:** Dong Ding needs more heat and longer 1st steep.
- **Over-steeping Western style:** Roast + TR = bitter, muddy cup.

---

### 4. High Mountain Taiwan Oolong (Alishan / Lishan Profile)

#### Fermentation & Dominant Compounds

| Parameter | Value |
|-----------|-------|
| Oxidation level | **10–20%** (lightly oxidized) |
| Roasting | **None to very light** (modern *gaoshan* style) |
| Dominant polyphenols | **Catechins** (EGCG, EGC dominant) — minimal TF/TR |
| Amino acids | **High theanine** — slow high-altitude growth concentrates amino acids |
| Volatiles | Floral esters, *linalool*, *geraniol*; freeze-dried freshness |
| Altitude | 1,000–2,600 m — cool nights → tender leaves, concentrated aromatics |

High-mountain (*gaoshan*) processing preserves green character: PPO inactivated at low oxidation to protect floral aromatics.

#### Optimal Brewing

| Method | Ratio (g/100 mL) | Temp (°C) | Time | Infusions |
|--------|------------------|-----------|------|-----------|
| **Gongfu** (recommended) | **4.0** (6 g / 150 mL) | **85–90** | Rinse 5 s; 1st: 30–40 s; +5–10 s | 5–7 |
| **Western** | **2.0** | **85** | 2–3 min | 2 |
| Lishan premium | **4.0** | **88–90** | 1st: 25–35 s | 7+ |

**Rationale:** Low oxidation + unroasted leaf = catechin and amino acid driven cup. Cooler water (85–90 °C) preserves volatile florals and prevents EGCG bitterness. High altitude leaf is dense with compounds — needs adequate ratio and time but not boiling water.

#### Water Chemistry

| Parameter | Target |
|-----------|--------|
| TDS | **50–100 mg/L** (very soft) |
| pH | **6.5–7.0** |
| Ca²⁺ | **< 25 mg/L** |
| Mg²⁺ | **5–10 mg/L** |
| Bicarbonate | **< 25 mg/L** |

Soft water is critical. High-mountain oolong is the most water-sensitive category — hard water destroys creamy/floral character.

#### Gongfu vs Western

| | Gongfu | Western |
|---|--------|---------|
| Best for | Creamy texture, orchid/lilac evolution, *hui gan* | Light everyday cup |
| Ratio | 4 g / 100 mL | 2 g / 100 mL |
| Temp | 85–90 °C | 85 °C |
| Profile | Thick, buttery, multi-layered | Thin if under-dosed; acceptable at 2.5 g |

#### Compound Extraction Timeline

| Infusion | What Dominates | Sensory Result |
|----------|----------------|----------------|
| **Rinse** | Light volatiles | Opens rolled leaf |
| **1st** (30–40 s) | **Theanine + floral volatiles**, light EGCG | Creamy, orchid, butter, fresh |
| **2nd** (35–45 s) | **Peak catechin + amino acid** balance | Fuller body, gardenia notes |
| **3rd** (45–55 s) | Sustained catechins, emerging sweetness | Classic *gaoshan*: thick, sweet, cooling |
| **4th+** | Residual amino acids, fading aromatics | Sweet water, less perfume |

#### Common Mistakes

- **Boiling water (100 °C):** Scalds delicate buds; bitter, flat cup.
- **Insufficient leaf:** High-mountain tea looks expensive per gram but needs 4+ g/100 mL gongfu.
- **Hard tap water:** Completely masks terroir.
- **Short 1st steep (< 20 s):** Dense ball-rolled leaf needs time to open.
- **Storing brewed leaf too long between infusions:** Oxidizes open leaf; next steep tastes stale.

---

## BLACK TEAS

### 1. Assam (CTC and Orthodox)

#### Fermentation & Dominant Compounds

| Parameter | CTC | Orthodox |
|-----------|-----|----------|
| Oxidation level | **~100%** (full) | **~100%** (full) |
| Processing | Crush-tear-curl: extreme cell rupture, 55–110 min fermentation | Whole-leaf rolling, 2–4 h fermentation |
| Dominant polyphenols | **Thearubigins** (high), **theaflavins** (high) | **TF + TR**; TF:TR ratio often > 1:12 |
| TF content in infusion | Higher TF than orthodox (same region) | Lower TF but more nuanced aromatics |
| Residual catechins | Very low | Trace ECG/EGCG in tippy grades |
| Optimal TF:TR ratio | ~**1:9 to 1:12** (quality benchmark) | ~**1:11 to 1:12** |
| Character | Malty, brisk, bold; thearubigins drive color/body | Golden tips, honey, fruit; more volatile aromatics |

CTC's extreme maceration maximizes PPO contact → higher TF/TR extraction yield. Orthodox preserves larger leaf structure → slower, more controlled extraction.

#### Optimal Brewing

| Style | Ratio (g/100 mL) | Temp (°C) | Time | Infusions |
|-------|------------------|-----------|------|-----------|
| **CTC Western** | **2.5** | **100** | 3–4 min | 1 |
| **CTC with milk** | **3.0** | **100** | 4–5 min | 1 |
| **Orthodox Western** | **2.5** | **90–95** | 3–5 min | 1 |
| **Orthodox tippy 2nd flush** | **2.5** | **90** | 3–4 min | 1 |
| **Assam gongfu** | **5.0** | **95** | 15 s; +10 s | 4–6 |
| **Scientific (CTC)** | **2.0** (2% w/v) | **85–95** | 8–10 min optimal for TF/TR | 1 |

**Rationale:** CTC particles have massive surface area — full boil rapidly extracts TR (body/color). Studies show 85–95 °C for 10 min maximizes TF/TR in CTC without excessive degradation. Orthodox tips scorch above 95 °C, losing honey/floral volatiles. CTC needs 100 °C to dissolve heavy thearubigins (essential for milk tea).

#### Water Chemistry

| Parameter | CTC | Orthodox |
|-----------|-----|----------|
| TDS | **100–200 mg/L** | **75–150 mg/L** |
| pH | **6.8–7.5** | **6.5–7.2** |
| Ca²⁺ | Tolerates moderate; milk binds polyphenols anyway | **< 50 mg/L** for straight drinking |
| Bicarbonate | **< 60 mg/L** | **< 50 mg/L** |

Assam tolerates harder water better than Darjeeling or green tea. Milk service masks water flaws.

#### Gongfu vs Western

| | Gongfu | Western |
|---|--------|---------|
| Best for | Orthodox Assam — reveals honey, malt layers | CTC breakfast, milk tea, chai |
| CTC gongfu | Unusual; particles over-extract bitter in 1 steep | Standard: 2.5 g/100 mL, 100 °C, 3–4 min |
| Orthodox gongfu | 5 g/100 mL, 95 °C, short steeps tame astringency | 2.5 g/100 mL, 90–95 °C, 3–5 min |

#### Compound Extraction Timeline

| Steep | CTC | Orthodox |
|-------|-----|----------|
| **0–30 s** | Rapid **caffeine + gallic acid** | Minimal — whole leaf slower |
| **1–3 min** | **TF + TR** near maximum; brisk, malty | Aromatics + early TF |
| **3–5 min** | TR dominates; full body | Peak TF:TR balance; golden tips sweet |
| **5+ min** | HPS rises; bitter, cloudy | Tannin overload; tips scorched if water too hot |
| **Gongfu 3rd** | N/A (CTC spent) | Residual malt, reduced astringency |

*Single-infusion Western is standard for Assam. Gongfu 3rd steep (orthodox):* remaining TF, softened tannins, honey sweetness.

#### Common Mistakes

- **Boiling water on tippy orthodox 1st flush:** Strips golden-tip florals.
- **Under-steeping CTC (< 3 min):** Weak, thin body — TR needs time/heat.
- **Using CTC parameters for orthodox:** Over-extracted bitterness.
- **Re-steeping CTC:** Particles fully extract in one steep.
- **Cold water or low temp on CTC:** Pale, flavorless liquor.

---

### 2. Darjeeling (First Flush vs Second Flush)

#### Fermentation & Dominant Compounds

| Parameter | First Flush (spring) | Second Flush (summer) |
|-----------|---------------------|----------------------|
| Harvest | March–April | May–June |
| Oxidation level | **10–25%** (semi-oxidized; near oolong) | **80–100%** (fully oxidized black) |
| Dominant polyphenols | **Catechins** (EGCG, EGC), low TF/TR | **Theaflavins + thearubigins** |
| Amino acids | High (winter dormancy → nutrient accumulation) | Moderate |
| Character volatiles | Floral, muscatel precursors, green notes | **Muscatel** (geraniol, linalool oxides), fruity TF derivatives |
| Liquor color | Pale gold/green | Amber/copper |
| Fermentation time | ≤ 15 min or skipped | Standard 45–90 min |

First flush is botanically a black tea by trade classification but chemically closer to oolong. Second flush is the classic "champagne of teas" muscatel profile from TF/TR + seasonal terpenes.

#### Optimal Brewing

| Flush | Ratio (g/100 mL) | Temp (°C) | Time | Infusions |
|-------|------------------|-----------|------|-----------|
| **First flush Western** | **2.5–3.0** | **80–85** | 2–3 min | 1–2 |
| **Second flush Western** | **2.5** | **85–90** | 3–4 min | 1–2 |
| **First flush gongfu** | **4.0** | **85** | 20 s; +10 s | 4–5 |
| **Second flush gongfu** | **4.0** | **90** | 25 s; +10 s | 4–5 |

**Rationale:** First flush's low oxidation and delicate tips require sub-boiling water — 100 °C extracts harsh tannins and destroys muscatel/floral volatiles. Second flush's fuller oxidation tolerates 85–90 °C; muscatel develops from TF interacting with seasonal leaf chemistry. Never exceed 5 min — Darjeeling turns bitter quickly.

#### Water Chemistry

| Parameter | Target |
|-----------|--------|
| TDS | **50–100 mg/L** (soft — essential for Darjeeling) |
| pH | **6.5–7.0** |
| Ca²⁺ | **< 30 mg/L** |
| Bicarbonate | **< 30 mg/L** |

Darjeeling is among the most water-sensitive teas. Himalayan spring-water profiles are the benchmark. Hard water eliminates muscatel.

#### Gongfu vs Western

| | Gongfu | Western |
|---|--------|---------|
| Best for | Premium whole-leaf estate teas; exploring muscatel evolution | Standard Darjeeling service |
| First flush | Reveals green-floral layers | 2.5 g/100 mL, 80–85 °C, 2–3 min |
| Second flush | Muscatel builds across steeps | 2.5 g/100 mL, 85–90 °C, 3–4 min |
| Milk | **Never** (either flush) | — |

#### Compound Extraction Timeline

| Infusion | First Flush | Second Flush |
|----------|-------------|--------------|
| **1st** | **Floral volatiles**, theanine, light EGCG | **TF** (briskness), muscatel precursors, caffeine |
| **2nd** | Catechins increase; green-grape notes | TF + TR balance; muscatel peak |
| **3rd** | Peak **catechin + amino acid** harmony | **TR** (body), winey/fruity depth |
| **4th+** | Sweet, fading florals | Mellow amber, reduced astringency |

#### Common Mistakes

- **Boiling water (especially first flush):** #1 error — bitter, flat, no muscatel.
- **Treating first flush like Assam:** Needs oolong-like temperature.
- **Adding milk:** Destroys delicate profile (both flushes).
- **Over-dosing leaf:** Darjeeling is deceptively light; 3 g/100 mL max.
- **Using stale/monsoon flush for premium parameters:** Autumn/monsoon grades need hotter/shorter adjustment.

---

### 3. Keemun (*Qimen Hong Cha*)

#### Fermentation & Dominant Compounds

| Parameter | Value |
|-----------|-------|
| Oxidation level | **~100%** (full black) |
| Processing | Slow withering, careful rolling, controlled fermentation — Chinese "gongfu black" |
| Dominant polyphenols | **Theaflavins + thearubigins**; TF:TR ~ **1:9 to 1:12** |
| Unique aromatics | **β-ionone** (orchid/fruity), pyrazines, lactones — from cultivar *Zhuye* and processing |
| Residual catechins | Low; trace ECG in premium grades |
| Character | Wine-like, orchid, cocoa, pine — lighter body than Assam |

Keemun's fermentation is gentler than CTC — preserves more aromatic volatiles while achieving full oxidation.

#### Optimal Brewing

| Method | Ratio (g/100 mL) | Temp (°C) | Time | Infusions |
|--------|------------------|-----------|------|-----------|
| **Western** (recommended) | **2.0–2.5** | **90–95** | 3–5 min | 1–2 |
| **Scientific optimum** (LWT 2025) | **2.2–5.0** (1:45–1:20 mL/g) | **95–100** | **16–38 s** (1st infusion) | 3 |
| **Gongfu** | **4.0** | **95** | 15 s; +10 s | 4–5 |

**Rationale:** 2025 consumer-acceptance study defined ideal extraction yield (EY) 3.50–6.50 g/g and TDS 0.14–0.25 g/g. Keemun's orchid aromatics are volatile — water above 95 °C risks flattening; below 90 °C under-extracts TF. Gongfu short steeps highlight fruit/wine notes without TR bitterness.

#### Water Chemistry

| Parameter | Target |
|-----------|--------|
| TDS | **75–120 mg/L** |
| pH | **6.5–7.0** |
| Ca²⁺ | **< 40 mg/L** |
| Mg²⁺ | **5–12 mg/L** |

Moderately soft water. Keemun's delicate orchid is easily masked by hard water or high bicarbonate.

#### Gongfu vs Western

| | Gongfu | Western |
|---|--------|---------|
| Best for | Premium *teji* grades; wine/orchid evolution | Everyday Keemun |
| Ratio | 4 g / 100 mL | 2–2.5 g / 100 mL |
| Temp | 95 °C | 90–95 °C |
| Profile | Fruity orchid → cocoa → sweet | Balanced single cup |
| Milk | Not traditional (though tolerable) | Rarely |

#### Compound Extraction Timeline

| Infusion | What Dominates | Sensory Result |
|----------|----------------|----------------|
| **1st** (15–38 s) | **β-ionone volatiles**, light TF, caffeine | Orchid, fruit, wine |
| **2nd** | **TF peak**, cocoa notes | Brisk, cocoa-orchid balance |
| **3rd** | **TR + TF**, sustained aromatics | Body, pine, sweet finish |
| **Western 3–5 min** | Full TF/TR in one extraction | Classic Keemun: mellow, slightly smoky |

#### Common Mistakes

- **Boiling water:** Flattens orchid; harsh bitterness.
- **Over-steeping (> 5 min Western):** Tannic, loses fruit.
- **Using Assam-style ratios for CTC:** Keemun is whole-leaf; lower dose.
- **Storing open tin long-term:** Keemun loses β-ionone; stale = flat cocoa only.
- **Gongfu with low-grade fannings:** Dust over-extracts in seconds.

---

### 4. Ceylon (Sri Lanka)

#### Fermentation & Dominant Compounds

| Parameter | Value |
|-----------|-------|
| Oxidation level | **~100%** (full black) |
| Dominant polyphenols | **Theaflavins + thearubigins** |
| Elevation effect | High-grown (> 1,200 m): higher TPC, TF; brighter liquor. Low-grown: heavier TR, darker, more body |
| TF:TR ratio | Target **~1:9 to 1:12**; varies by estate and elevation |
| Residual catechins | Trace; high-grown retains slightly more |
| Character | Bright, citrus, brisk (high) vs. bold, malty (low) |

BOP/BOPF grades (broken leaf) extract faster than whole OP — similar CTC dynamics at smaller scale.

#### Optimal Brewing

| Grade | Ratio (g/100 mL) | Temp (°C) | Time | Infusions |
|-------|------------------|-----------|------|-----------|
| **High-grown OP Western** | **2.5** | **95–100** | 3–4 min | 1–2 |
| **Low-grown BOP Western** | **2.5** | **100** | 3–5 min | 1 |
| **BOPF (broken)** | **2.0** | **95** | 2–3 min | 1 |
| **Gongfu (whole OP)** | **4.0** | **95** | 20 s; +10 s | 4–5 |
| **Iced** | **4.0** | **100** | 5 min concentrate | 1 |

**Rationale:** Ceylon's briskness comes from TF — needs 95 °C+ for full extraction. Broken grades (BOPF) have high surface area: shorter time prevents HPS bitterness. High-grown teas are more delicate — 95 °C vs. 100 °C for low-grown.

#### Water Chemistry

| Parameter | Target |
|-----------|--------|
| TDS | **75–150 mg/L** |
| pH | **6.8–7.2** |
| Ca²⁺ | **< 50 mg/L** (scum risk at high hardness) |
| Bicarbonate | **< 50 mg/L** |

Ceylon tolerates moderate minerals. Very hard water (> 150 ppm CaCO₃) causes cloudiness and dulls brightness.

#### Gongfu vs Western

| | Gongfu | Western |
|---|--------|---------|
| Best for | Premium whole-leaf Uva/ Nuwara Eliya | Everyday BOP, iced tea, milk tea |
| Ratio | 4 g / 100 mL | 2–2.5 g / 100 mL |
| Profile | Citrus bright → malt → sweet | Single brisk cup |
| Iced | — | Ceylon's brightness survives cold if brewed hot first |

#### Compound Extraction Timeline

| Steep | What Dominates | Sensory Result |
|-------|----------------|----------------|
| **1st** (or 0–2 min) | **Caffeine + gallic acid**, early TF | Bright, light color |
| **2nd / 2–3 min** | **TF peak** — briskness maximum | Citrus, brisk, golden liquor |
| **3rd / 3–4 min** | **TR** builds — body and color | Full body, balanced |
| **5+ min** | HPS, tannin overload | Bitter, cloudy (especially BOPF) |

#### Common Mistakes

- **Same parameters for BOPF and OP:** Broken leaf needs less time.
- **Under-temperature (< 90 °C):** Weak, dull Ceylon loses signature briskness.
- **Re-steeping BOPF:** Broken particles exhaust in one steep.
- **Ignoring elevation:** High-grown needs slightly lower temp than low-grown.
- **Hard water with bright high-grown:** Loses citrus clarity.

---

## WHITE TEA

### 1. Bai Hao Yin Zhen (Silver Needle)

#### Fermentation & Dominant Compounds

| Parameter | Value |
|-----------|-------|
| Oxidation level | **5–10%** (minimal; withering-only) |
| Processing | Bud-only pluck; indoor withering; no rolling; low-temp drying |
| Dominant polyphenols | **Catechins** (EGCG, EGC, ECG) — highest among tea types in bud tissue |
| Amino acids | **Very high theanine** (buds richest in free amino acids) |
| TF / TR | Negligible |
| Caffeine | Moderate-high (buds concentrated) |
| Character | Hay, cucumber, melon, sweet; minimal astringency |

Silver Needle is functionally an unoxidized bud tea. Polyphenol profile closest to green tea but with higher amino acid:polyphenol ratio.

#### Optimal Brewing

| Method | Ratio (g/100 mL) | Temp (°C) | Time | Infusions |
|--------|------------------|-----------|------|-----------|
| **Gongfu** (recommended) | **5.0** | **90–95** | Rinse 5 s; 1st: 20–30 s; +10 s | 5–8 |
| **Western** | **2.0–3.0** | **80–85** | 2–3 min | 2–3 |
| **Cold brew** | **1.0** (10 g/L) | **4–8 °C** | 4–12 h | 1 |
| **Scientific extraction** | **2.0** | **90–100** | 5–7 min (max TPC) | 1 |

**Rationale:** Buds are sheathed in trichomes (hairs) that repel water — counterintuitively, **hot water (90–95 °C) is needed** for gongfu to penetrate unbroken buds. Western style uses cooler water (80–85 °C) because longer steep compensates. Cold brew selectively extracts theanine/sugars while leaving most catechins — sweetest profile.

#### Water Chemistry

| Parameter | Target |
|-----------|--------|
| TDS | **50–80 mg/L** (very soft) |
| pH | **6.5–7.0** |
| Ca²⁺ | **< 20 mg/L** |
| Mg²⁺ | **5–8 mg/L** |
| Bicarbonate | **< 25 mg/L** |

Pure or spring water optimal. PMC study on Fuding white tea: pure water yielded highest catechin extraction and best sensory scores (color, aroma, taste). Spring water best for theanine. Tap water highest amino acids but worst sensory scores.

#### Gongfu vs Western

| | Gongfu | Western |
|---|--------|---------|
| Best for | Full bud extraction, multiple sweet infusions | Delicate, light cup |
| Ratio | 5 g / 100 mL | 2–3 g / 100 mL |
| Temp | **90–95 °C** (hot — penetrates trichomes) | **80–85 °C** (gentle) |
| Profile | Thick, sweet, honey-melon | Light, cucumber-hay |
| Vessel | Gaiwan (watch buds stand/sink) | Glass teapot |

#### Compound Extraction Timeline

| Infusion | What Dominates | Sensory Result |
|----------|----------------|----------------|
| **Rinse** (5 s) | Surface dust, light volatiles | Wets trichome barrier |
| **1st** (20–30 s) | **Theanine + light EGCG**, hay volatiles | Sweet, cucumber, light |
| **2nd** (30–40 s) | **Catechin rise** (EGCG, EGC) | Fuller, honey notes |
| **3rd** (40–50 s) | **Peak catechin + amino acid** balance | Classic Yin Zhen: melon, sweet, thick |
| **4th+** | Residual theanine; fading catechins | Sweet water, thin |
| **Cold brew** | **Theanine dominant**; minimal caffeine/catechins | Viscous, floral, candy-sweet |

#### Common Mistakes

- **"Delicate = cool water" in gongfu:** Buds won't open; thin, flavorless cup. Use 90 °C+ for gongfu.
- **Pouring water directly onto buds:** Breaks buds; use rim pour.
- **Hard tap water:** Destroys sweetness and clarity.
- **Over-steeping Western (> 4 min):** Surprisingly bitter despite low oxidation.
- **Storing new tea too hot/humid:** Silver Needle ages slowly; heat degrades fresh hay notes.
- **Using aged Yin Zhen parameters for new tea:** New harvest: 80 °C Western; aged 1–3 yr: 85 °C.

---

## PU-ERH

### 1. Sheng (Raw) — Young vs Aged

#### Fermentation & Dominant Compounds

| Parameter | Young Sheng (1–5 yr) | Aged Sheng (10+ yr) |
|-----------|---------------------|---------------------|
| Manufacture oxidation | **~5–10%** (sheng maocha — sun-dried, kill-green) | Same base + **slow enzymatic/microbial aging** |
| Post-fermentation | Minimal (natural aging begins) | Extensive — polyphenol oligomerization |
| Dominant polyphenols (leaf) | **Catechins**: ECG, EGCG, EGC (APT study: ECG dominant at ~40 mg/g) | Catechins decline; **oligomeric polyphenols**, oxidized derivatives |
| TPC (leaf) | **~210 mg GAE/g** (aged raw example) | Similar or slightly lower; different composition |
| TF / TR | Trace in young; increases slightly with age | Low-moderate |
| Theabrownins | Negligible young | Increase with age |
| Microbial metabolites | Minimal | Aspergillus spp., complex fungal transformation |
| Character | Bitter, floral, vegetal, *huang pian* notes | Smooth, camphor, dried fruit, honey |

Young sheng is chemically a sun-dried green tea with aging potential. Aged sheng's smoothness comes from catechin polymerization, not wo dui fermentation.

#### Optimal Brewing

| Type | Ratio (g/100 mL) | Temp (°C) | Time | Infusions |
|------|------------------|-----------|------|-----------|
| **Young sheng gongfu** | **5.0–7.0** | **95–98** | Rinse 5 s; 1st: 10–15 s; +5 s | 8–12 |
| **Aged sheng gongfu** | **5.0–7.0** | **100** | Rinse 5–10 s; 1st: 15–20 s; +5 s | 10–15 |
| **Young sheng Western** | **2.0** | **90–95** | 2–3 min | 1–2 |
| **Aged sheng Western** | **2.0** | **100** | 3–4 min | 2–3 |
| **Scientific extraction** | **1.0** (0.4 g/40 mL) | **90–98** | 5 min (max bioactives) | 1 |

**Rationale:** Young sheng's high ECG/EGCG causes bitterness at 100 °C on first steeps — 95–98 °C preserves florals while extracting enough polyphenols. Aged sheng's polymerized compounds need full boil. Compressed cakes require **double rinse** (5 s each) to open and clean. Extraction kinetics study: bioactive release increases 60 → 98 °C; 90 °C and 98 °C similar for aged; young benefits from temperature control early.

#### Water Chemistry

| Parameter | Target |
|-----------|--------|
| TDS | **30–80 mg/L** (very soft — critical for *hui gan*) |
| pH | **6.5–7.0** |
| Ca²⁺ | **< 20 mg/L** — hard water kills returning sweetness |
| Mg²⁺ | **5–10 mg/L** |
| Bicarbonate | **< 30 mg/L** |

Pu-erh is the most water-sensitive tea for sweetness perception. Soft water essential for young sheng's *huí gān* (returning sweetness).

#### Gongfu vs Western

| | Gongfu | Western |
|---|--------|---------|
| Best for | All sheng — essential for compressed cakes | Quick tasting only |
| Young sheng | Short steeps manage bitterness; 7 g/100 mL | 2 g/100 mL often too bitter at 100 °C |
| Aged sheng | Long session (10+ infusions); full boil | Acceptable for loose aged maocha |
| Ratio | 5–7 g / 100 mL | 2 g / 100 mL |

#### Compound Extraction Timeline — Young Sheng

| Infusion | What Dominates | Sensory Result |
|----------|----------------|----------------|
| **Rinse** | Dust, compressed surface | Opens cake/tuo |
| **1st** (10–15 s) | **ECG + EGCG** (fast), caffeine | Sharp, bitter, floral, vegetal |
| **2nd** (15–20 s) | Peak **catechin** extraction | Intense, astringent, *huí gān* begins |
| **3rd** (20–25 s) | Catechins + emerging sweetness | Bitterness transforms; fruit notes |
| **5th+** | Declining catechins; **amino acids**, pectin | Sweet, honey, softer |

#### Compound Extraction Timeline — Aged Sheng

| Infusion | What Dominates | Sensory Result |
|----------|----------------|----------------|
| **1st** | Aged volatiles (camphor, dried fruit) | Smooth, woody, no sharp bitterness |
| **2nd** | **Oligomeric polyphenols**, theaflavin traces | Depth, minerality, honey |
| **3rd** | Peak complexity — polymers + microbial metabolites | Classic aged: smooth, sweet, long finish |
| **8th+** | Residual sweetness, thin body | Sweet water |

#### Common Mistakes

- **100 °C on young sheng 1st steep:** Excessive bitterness; no floral layer.
- **Single rinse on compressed cake:** Dirty, closed infusions.
- **Hard tap water:** No *hui gan*; flat, chalky.
- **Western long steep young sheng:** Unpalatably bitter.
- **Expecting aged profile from 1-year sheng:** Needs time or skilled brewing to manage astringency.

---

### 2. Shu (Ripe)

#### Fermentation & Dominant Compounds

| Parameter | Value |
|-----------|-------|
| Manufacture oxidation | **~5–10%** (same maocha base as sheng) |
| Wo dui fermentation | **45–90 days** at 40–60 °C, 70–85% humidity — microbial post-fermentation |
| Effective "fermentation" | **~80–90%** polyphenol transformation (microbial, not PPO) |
| Dominant polyphenols (leaf) | **Theabrownins**, **gallic acid** (elevated), low catechins |
| TPC (leaf) | **~105 mg GAE/g** (young shu example — lower than aged sheng but different profile) |
| Catechins (leaf) | **EGCG ~0.7 mg/g**, **ECG ~1.8 mg/g** (vs. sheng: 35+ and 40+ mg/g) |
| TF / TR | Low-moderate (microbial oxidation products) |
| Microbial metabolites | Statins (lovastatin trace), polysaccharides, β-glucans |
| Character | Earthy, woody, smooth, dark liquor |

Shu is defined by *wo dui* microbial fermentation: catechins → theabrownins + gallic acid. Chemically distinct from black tea (PPO oxidation).

#### Optimal Brewing

| Method | Ratio (g/100 mL) | Temp (°C) | Time | Infusions |
|--------|------------------|-----------|------|-----------|
| **Gongfu** (recommended) | **5.0–7.0** | **100** | Rinse 5 s; 1st: 5–10 s; +5 s | 8–12 |
| **Western** | **2.0–2.5** | **100** | 3–5 min | 1–2 |
| **Scientific optimum** | **5.0** (1:20 w/v) | **85.4** | 3 min (max TPC) | 1 |
| **Grandpa style** | **1.5** | **100** | Continuous | — |

**Rationale:** Shu extracts quickly — dark color and earthy compounds release in seconds. Full boil essential. Short gongfu steeps prevent muddy, fishy over-extraction. Scientific optimum at 85.4 °C/3 min for TPC, but sensory preference favors 100 °C for aroma. Rinse is mandatory (dust + *dui wei* / pile taste).

#### Water Chemistry

| Parameter | Target |
|-----------|--------|
| TDS | **30–80 mg/L** (soft) |
| pH | **6.5–7.0** |
| Ca²⁺ | **< 30 mg/L** — hard water + shu = dark murky liquor |
| Bicarbonate | **< 40 mg/L** — alkaline water over-darkens theabrownins |

Very soft water produces cleaner, sweeter shu. Hard water amplifies earthiness to mud.

#### Gongfu vs Western

| | Gongfu | Western |
|---|--------|---------|
| Best for | Quality cakes; layered sweetness under earth | Quick, strong cup |
| Ratio | 5–7 g / 100 mL | 2–2.5 g / 100 mL |
| Temp | 100 °C | 100 °C |
| Profile | Earth → wood → sweetness (good shu) | One-dimensional earth |
| Rinse | **Required** (1–2×) | Recommended |

#### Compound Extraction Timeline

| Infusion | What Dominates | Sensory Result |
|----------|----------------|----------------|
| **Rinse** | **Dust, pile fermentation volatiles** | Discard — cleans leaf |
| **1st** (5–10 s) | **Theabrownins**, gallic acid, caffeine | Dark, earthy, smooth |
| **2nd** (10–15 s) | **Peak theabrownin** + polysaccharides | Body, sweetness emerges |
| **3rd** (15–20 s) | Theabrownins + **microbial metabolites** | Classic shu: woody, dates, cocoa |
| **5th+** | Declining pigments; **sweet water** | Light, sweet, less earth |
| **Over-steeped** | HPS, fishy/off notes | Bad pile fermentation exposed |

#### Common Mistakes

- **No rinse:** First cup tastes muddy, fishy (*dui wei*).
- **Over-steeping (> 30 s 1st infusion):** Bitter, marine, unpleasant.
- **Cool water:** Under-extracted; pale, weak, still earthy but no sweetness.
- **Hard water:** Murky black liquor; amplified off-flavors.
- **Low-quality shu at high ratio:** Fishy, chemical — brewing cannot fix bad *wo dui*.
- **Same parameters as young sheng:** Shu needs less time, more heat, mandatory rinse.

---

## Quick Reference Matrix

| Tea | Oxidation % | Key Compounds | Gongfu Ratio | Temp (°C) | 1st Steep | Infusions |
|-----|-------------|---------------|--------------|-----------|-----------|-----------|
| Tie Guan Yin | 15–30 | Catechins | 5.0 | 95–100 | 15–25 s | 6–10 |
| Da Hong Pao | 60–80 | TF, TR, roast | 5.0–7.0 | 95–100 | 5–15 s | 7–12 |
| Dong Ding | 30–40 | Catechins + TF | 5.0–6.0 | 90–95 | 20–30 s | 6–8 |
| High Mountain | 10–20 | Catechins, theanine | 4.0 | 85–90 | 30–40 s | 5–7 |
| Assam CTC | 100 | TF, TR | — | 100 | 3–4 min | 1 |
| Assam Orthodox | 100 | TF, TR | 5.0 | 90–95 | 15 s | 4–6 |
| Darjeeling 1st | 10–25 | Catechins | 4.0 | 80–85 | 20 s | 4–5 |
| Darjeeling 2nd | 80–100 | TF, TR | 4.0 | 85–90 | 25 s | 4–5 |
| Keemun | 100 | TF, TR, ionones | 4.0 | 90–95 | 15–38 s | 4–5 |
| Ceylon OP | 100 | TF, TR | 4.0 | 95–100 | 20 s | 4–5 |
| Silver Needle | 5–10 | Catechins, theanine | 5.0 | 90–95 | 20–30 s | 5–8 |
| Sheng young | 5–10 | ECG, EGCG | 5.0–7.0 | 95–98 | 10–15 s | 8–12 |
| Sheng aged | 5–10 + aging | Oligomers | 5.0–7.0 | 100 | 15–20 s | 10–15 |
| Shu | 80–90 (microbial) | Theabrownins, GA | 5.0–7.0 | 100 | 5–10 s | 8–12 |

---

## Water Chemistry Summary

| Tea Category | TDS (mg/L) | Ca²⁺ (mg/L) | pH | Notes |
|--------------|------------|-------------|-----|-------|
| Light oolong / gaoshan | 50–100 | < 25 | 6.5–7.0 | Softest water |
| Wuyi roast / Dong Ding | 75–150 | < 40 | 6.8–7.2 | Slight minerals OK |
| Black (orthodox) | 75–150 | < 50 | 6.5–7.2 | Avoid scum |
| Black (CTC / milk) | 100–200 | < 80 | 6.8–7.5 | Tolerates hardness |
| White (Silver Needle) | 50–80 | < 20 | 6.5–7.0 | Pure water best |
| Pu-erh (all) | 30–80 | < 30 | 6.5–7.0 | Softest for *hui gan* |
| Darjeeling | 50–100 | < 30 | 6.5–7.0 | Muscatel needs soft water |

**Universal targets:** Mg²⁺ 5–15 mg/L (enhances extraction), bicarbonate < 50 mg/L, avoid chlorinated tap water.

---

## References

Checked against Crossref on 2026-11-06 by the sources agent. The audit trail — which
citation was wrong and why — is in `docs/sources/citation-audit.md`.

1. Cao Q-Q, Zhang X-Z, Xu Y-Q, et al. (2022). Optimization of brewing conditions for Tieguanyin oolong tea by quadratic orthogonal regression design. *npj Science of Food* 6(1):25. [DOI: 10.1038/s41538-022-00141-7](https://doi.org/10.1038/s41538-022-00141-7)
2. Liu X, Zhu Y, Yang W, et al. (2021). Chemical characterization of Wuyi rock tea with different roasting degrees and their discrimination based on volatile profiles. *RSC Advances* 11(20):12074–12085. [DOI: 10.1039/D0RA09703A](https://doi.org/10.1039/D0RA09703A)
3. Fernando CD, Soysa P (2015). Extraction kinetics of phytochemicals and antioxidant activity during black tea (*Camellia sinensis* L.) brewing. *Nutrition Journal* 14(1):74. [DOI: 10.1186/s12937-015-0060-x](https://doi.org/10.1186/s12937-015-0060-x)
4. Pedan V, Popp M, Rohn S, et al. (2018). Bioactive compound fingerprint analysis of aged raw Pu'er tea and young ripened Pu'er tea. *Molecules* 23(8):1931. [DOI: 10.3390/molecules23081931](https://doi.org/10.3390/molecules23081931)
5. Zhang H, Jiang Y, Lv Y (2017). Effect of water quality on the main components in Fuding white tea infusions. *Journal of Food Science and Technology* 54(5):1206–1211. [DOI: 10.1007/s13197-017-2571-2](https://doi.org/10.1007/s13197-017-2571-2) — [PMC5380641](https://pmc.ncbi.nlm.nih.gov/articles/PMC5380641/)
6. Jin Y, Zhao J, Kim EM (2019). Comprehensive investigation of the effects of brewing conditions in sample preparation of green tea infusions. *Molecules* 24(9):1735. [DOI: 10.3390/molecules24091735](https://doi.org/10.3390/molecules24091735) — [PMC6539062](https://pmc.ncbi.nlm.nih.gov/articles/PMC6539062/)
7. Perva-Uzunalić A, Škerget M, Knez Ž, et al. (2006). Extraction of active ingredients from green tea (*Camellia sinensis*): extraction efficiency of major catechins and caffeine. *Food Chemistry* 96(4):597–605. [DOI: 10.1016/j.foodchem.2005.03.015](https://doi.org/10.1016/j.foodchem.2005.03.015)
8. Cabrera M, Taher F, Llantada A, Do Q, Sapp T, Sommerhalter M (2021). Effect of water hardness on catechin and caffeine content in green tea infusions. *Molecules* 26(12):3485. [DOI: 10.3390/molecules26123485](https://doi.org/10.3390/molecules26123485)
9. Hossain MS, et al. (2022). Optimization of the factors affecting BT-2 black tea fermentation by observing their combined effects on the quality parameters. *Heliyon* 8:e08948. [DOI: 10.1016/j.heliyon.2022.e08948](https://doi.org/10.1016/j.heliyon.2022.e08948)
10. Isopescu RD, et al. (2018). Optimised Pu-erh tea infusion by experimental design and response surface methodology. *Revista de Chimie* 69(2):310–317. [DOI: 10.37358/rc.18.2.6096](https://doi.org/10.37358/rc.18.2.6096)
11. Armstrong L, et al. (2020). Optimizing the extraction of bioactive compounds from pu-erh tea (*Camellia sinensis* var. *assamica*) and evaluation of antioxidant activity. *Food Research International* 137:109430. [DOI: 10.1016/j.foodres.2020.109430](https://doi.org/10.1016/j.foodres.2020.109430)
12. Murugesan P (2018). Impact of different steeping time and water temperature on tea liquor. *International Journal of Technical Research & Science* 3(1). [DOI: 10.30780/ijtrs.v3.i1.2018.005](https://doi.org/10.30780/ijtrs.v3.i1.2018.005)
13. Zhao X, et al. (2025). Establishing a keemun black tea brewing control chart based on consumer acceptance via survival analysis and degree of satisfaction. *LWT* 224:117829. [DOI: 10.1016/j.lwt.2025.117829](https://doi.org/10.1016/j.lwt.2025.117829)
14. Yue Y, et al. (2014). TMDB: a literature-curated database for small molecular compounds found from tea. *BMC Plant Biology* 14(1):243. [DOI: 10.1186/s12870-014-0243-1](https://doi.org/10.1186/s12870-014-0243-1)
15. Zimmermann BF, Gleichenhagen M (2013). Steeping time and temperature on the content of the main flavanols in green tea. In: *Tea in Health and Disease Prevention*, pp. 335–341. [DOI: 10.1016/B978-0-12-384937-3.00028-8](https://doi.org/10.1016/B978-0-12-384937-3.00028-8)
16. Hajiaghaalipour F, Sanusi J, Kanthimathi MS (2016). Temperature and time of steeping affect the antioxidant properties of white, green, and black tea infusions. *Journal of Food Science* 81(1). [DOI: 10.1111/1750-3841.13149](https://doi.org/10.1111/1750-3841.13149) — published online 2015-11-27, print issue January 2016
17. Oracz J, et al. (2025). Optimizing brewing conditions for low-temperature green tea infusions: insights into functional and nutritional properties. *Food Chemistry* 474:143241. [DOI: 10.1016/j.foodchem.2025.143241](https://doi.org/10.1016/j.foodchem.2025.143241)
18. Mika M, et al. (2026). Brewing conditions and post-brewing handling shape the catechin profile and stability of tea infusions. *Food Chemistry* 527:150884. [DOI: 10.1016/j.foodchem.2026.150884](https://doi.org/10.1016/j.foodchem.2026.150884)

### Industry sources (not peer-reviewed)

- UK Tea Academy (2022). The Ultimate Ingredient for the Perfect Cup of Tea — water hardness white paper.
- World Green Tea Association — [O-CHA NET](https://www.o-cha.net/english/): serving parameters for sencha and gyokuro.

### Removed as unverifiable

- «Characterization of Indian black tea (CTC vs orthodox TF/TR). *Phytochemicals* 2020» — no such publication found.
- «Murugesh & Manoj (2015). Water quality and green tea. *J. Food Process Eng.*» — not found, together with the claim that hard water lowers catechins by 84–93 %.

### Needs manual checking

- Theppakorn T et al. (2016), *IFRJ* 23(2) — IFRJ is indexed in Crossref only partially.
- Matsuda H. & Ozaki Y. (1996), *Chagyo Kenkyu Hokoku*.

---

*Ratios use grams per 100 mL to align with `BrewMethod.ratio` in `types/tea.ts`. Times in seconds unless noted.*
