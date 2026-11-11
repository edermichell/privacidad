#!/usr/bin/env python3
"""Empaqueta public/ en un solo HTML autocontenido (modo offline, sin servidor)."""
import re, pathlib
pub = pathlib.Path(__file__).parent / 'public'
order = ['data', 'avatar', 'voice', 'brain', 'game']
out = []
for name in order:
    src = (pub / f'{name}.js').read_text()
    exports = re.findall(r'^export\s+(?:async\s+)?(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)', src, re.M)
    def imp(m):
        names = [n.strip() for n in m.group(1).split(',') if n.strip()]
        mod = m.group(2)
        return 'const { ' + ', '.join(names) + f' }} = __{mod};'
    src = re.sub(r"^import\s*\{([^}]*)\}\s*from\s*'\./(\w+)\.js';?", imp, src, flags=re.M | re.S)
    src = re.sub(r'^export\s+', '', src, flags=re.M)
    ret = f'return {{ {", ".join(exports)} }};' if exports else ''
    out.append(f'const __{name} = (() => {{\n{src}\n{ret}\n}})();')
js = '\n'.join(out).replace('</script', '<\\/script')
html = (pub / 'index.html').read_text()
css = (pub / 'styles.css').read_text()
html = html.replace('<link rel="stylesheet" href="styles.css">', f'<style>\n{css}\n</style>')
html = html.replace('<script type="module" src="game.js"></script>', f'<script>\n{js}\n</script>')
(pathlib.Path(__file__).parent / 'scam-call.html').write_text(html)
print('ok', len(html) // 1024, 'KB')
