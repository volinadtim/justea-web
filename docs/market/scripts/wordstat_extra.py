# -*- coding: utf-8 -*-
"""Добор Вордстата по явно заданным фразам.

Нужен в двух случаях:
 1. Сид «увёл в чужую тему» из-за лемматизации (audit_wordstat.py их находит):
    «матча» -> «матч», «ассам» -> «асса», «банча» -> «банч». Для таких нужен
    уточнённый вариант: «матча чай», «чай ассам».
 2. Уточняющие вопросы от других агентов по конкретным формулировкам.

Дописывает в тот же wordstat-shows.jsonl, поэтому merge_wordstat.py подхватит
данные без изменений.

    python3 wordstat_extra.py <куки> "фраза" "фраза" ...
    python3 wordstat_extra.py <куки> --file phrases.txt
"""
import importlib.util, json, pathlib, random, sys, time

HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("ws", HERE / "wordstat.py")
ws = importlib.util.module_from_spec(spec); spec.loader.exec_module(ws)

REGIONS = ["2", "213", "225"]


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    cookies = pathlib.Path(sys.argv[1])
    args = sys.argv[2:]
    if args[0] == "--file":
        phrases = [l.strip() for l in pathlib.Path(args[1]).read_text(
            encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")]
    else:
        phrases = args

    s = ws.make_session(ws.load_cookies(cookies))
    print(f"Авторизован как: {ws.check_auth(s)}", flush=True)

    dst = HERE.parent / "wordstat-raw" / "wordstat-shows.jsonl"
    done = set()
    if dst.exists():
        for line in dst.open(encoding="utf-8"):
            d = json.loads(line)
            done.add((d["seed"], d["region_id"]))

    print(f"Фраз: {len(phrases)} × регионов: {len(REGIONS)}", flush=True)
    with dst.open("a", encoding="utf-8") as fh:
        for i, ph in enumerate(phrases, 1):
            for rid in REGIONS:
                if (ph, rid) in done:
                    print(f"  уже снято: {ph} / {rid}", flush=True)
                    continue
                try:
                    t = ws.get_table(s, ph, rid)
                except RuntimeError as e:
                    if "captcha" in str(e):
                        print("Капча. Останавливаюсь.", flush=True); return
                    print(f"  ! {ph} / {rid}: {e}", flush=True); continue
                except Exception as e:
                    print(f"  ! {ph} / {rid}: {type(e).__name__}", flush=True); continue
                rows = t["tableData"].get("popular") or []
                per = t["info"].get("period", {})
                fh.write(json.dumps({
                    "seed": ph, "region_id": rid,
                    "region": ws.REGION_NAMES.get(rid, rid),
                    "period_start": per.get("startDate"), "period_end": per.get("endDate"),
                    "query_invalid": t.get("isQueryInvalid"),
                    "has_next_page": t["info"].get("hasNextPage"),
                    "rows": [{"phrase": x["text"], "shows": int(x["value"])}
                             for x in rows if str(x.get("value", "")).isdigit()],
                    "extra": True,
                    "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                }, ensure_ascii=False) + "\n")
                fh.flush()
                exact = next((x["shows"] for x in
                              ({"phrase": r["text"], "shows": int(r["value"])}
                               for r in rows if str(r.get("value", "")).isdigit())
                              if x["phrase"].strip().lower() == ph.lower()), None)
                print(f"  {ph[:38]:40} {ws.REGION_NAMES.get(rid, rid):4} "
                      f"строк={len(rows):3} точная форма={exact}", flush=True)
                time.sleep(2.5 + random.random() * 2)
    print("Готово.", flush=True)


if __name__ == "__main__":
    main()
