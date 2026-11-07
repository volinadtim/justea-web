#!/usr/bin/env python3
"""Докладывает недостающие картинки работы в _works и правит _works.json."""
import json, os, shutil, sys

R = '../refs/docs/design/references'
wid, src = sys.argv[1], sys.argv[2]
works = json.load(open(os.path.join(R, '_works', '_works.json')))
w = next(x for x in works if x['id'].startswith(wid))
dst = os.path.join(R, '_works', w['id'])
files = sorted(f for f in os.listdir(src) if f.startswith('shot-'))
for f in os.listdir(dst):
    os.remove(os.path.join(dst, f))
for f in files:
    shutil.copyfile(os.path.join(src, f), os.path.join(dst, f))
w['images'] = files
json.dump(works, open(os.path.join(R, '_works', '_works.json'), 'w'),
          ensure_ascii=False, indent=1)
print(w['id'], '→', files)
