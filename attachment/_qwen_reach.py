import re, os

src = 'src'
allfiles = []
for r, d, fs in os.walk(src):
    for f in fs:
        allfiles.append(os.path.normpath(os.path.join(r, f)).replace('\\', '/'))
fset = set(allfiles)


def resolve(fromfile, spec):
    if spec.startswith('@/'):
        base = os.path.join('src', spec[2:])
    elif spec.startswith('./') or spec.startswith('../'):
        base = os.path.normpath(os.path.join(os.path.dirname(fromfile), spec))
    else:
        return None
    for e in ['', '.ts', '.vue', '.js', '.css']:
        if os.path.isfile(base + e):
            return os.path.normpath(base + e).replace('\\', '/')
    for i in ['/index.ts', '/index.vue', '/index.js']:
        if os.path.isfile(base + i):
            return os.path.normpath(base + i).replace('\\', '/')
    return None


pat_from = re.compile(r"""(?:from|export\s+from)\s*['"]([^'"]+)['"]""")
pat_paren = re.compile(r"""import\s*\(\s*['"]([^'"]+)['"]""")
pat_side = re.compile(r"""^\s*import\s+['"]([^'"]+)['"]""", re.M)

edges = {}
for f in allfiles:
    if not f.endswith(('.ts', '.vue', '.js')):
        continue
    t = open(f, encoding='utf-8').read()
    ds = set()
    for rx in (pat_from, pat_paren, pat_side):
        for m in rx.finditer(t):
            r = resolve(f, m.group(1))
            if r and r in fset:
                ds.add(r)
    edges[f] = ds

name2sfc = {os.path.basename(f)[:-4]: f for f in allfiles if f.endswith('.vue')}


def tag_edges(f):
    t = open(f, encoding='utf-8').read()
    out = set()
    for m in re.finditer(r'<(/?)([A-Z][A-Za-z0-9]*)', t):
        nm = m.group(2)
        if nm in name2sfc and name2sfc[nm] != f:
            out.add(name2sfc[nm])
    for m in re.finditer(r'<([a-z][\w]*-[\w-]+)', t):
        kb = m.group(1)
        pascal = ''.join(w.capitalize() for w in kb.split('-'))
        if pascal in name2sfc:
            out.add(name2sfc[pascal])
    return out


for f in allfiles:
    if f.endswith('.vue'):
        edges.setdefault(f, set()).update(tag_edges(f))

live = set()
stack = ['src/main.ts']
while stack:
    n = stack.pop()
    if n in live:
        continue
    live.add(n)
    stack.extend(edges.get(n, ()))


def keep(f):
    return f.endswith('.d.ts') or f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'))


dead = [x for x in allfiles if x not in live and not keep(x)]
print('TOTAL src files:', len(allfiles), ' LIVE:', len(live), ' DEAD(code):', len(dead))
for d in sorted(dead):
    print(' ', d)
