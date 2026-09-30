import re, os

pat = re.compile(r"""['"](/[a-zA-Z][a-zA-Z0-9/_{}.\-]*)['"]""")
tpl = re.compile(r"""`(/[^`]*)`""")
found = {}
for r, d, fs in os.walk('src/api'):
    for f in fs:
        p = os.path.join(r, f)
        t = open(p, encoding='utf-8').read()
        for m in list(pat.finditer(t)) + list(tpl.finditer(t)):
            found.setdefault(m.group(1), set()).add(f)
for k in sorted(found):
    print(k, '<-', ','.join(sorted(found[k])))
