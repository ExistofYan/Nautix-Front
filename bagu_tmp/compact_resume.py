# -*- coding: utf-8 -*-
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.text import WD_LINE_SPACING
from io import BytesIO
import sys

path = sys.argv[1]
doc = Document(path)

for sec in doc.sections:
    sec.top_margin = Cm(0.8)
    sec.bottom_margin = Cm(0.8)
    sec.left_margin = Cm(1.1)
    sec.right_margin = Cm(1.1)

def tune(p, size, before, after, line=1.0):
    pf = p.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
    pf.line_spacing = line
    for r in p.runs:
        r.font.size = Pt(size)

for p in doc.paragraphs:
    style = (p.style.name or '') if p.style else ''
    if style.startswith('Title'):
        tune(p, 16, 0, 2)
    elif style == 'Heading 1':
        tune(p, 11.5, 5, 2)
    elif style == 'Heading 2':
        tune(p, 10.5, 4, 1)
    else:
        tune(p, 9, 0, 1, line=1.05)

out = BytesIO()
doc.save(out)
with open(path, 'wb') as f:
    f.write(out.getvalue())
print('compacted:', path)
