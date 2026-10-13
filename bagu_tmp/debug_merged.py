from docx import Document

M = r'D:\新建文件夹\java\javacode\nautix-frontend\bagu_tmp\项目八股_完整版_含基础八股.docx'
d = Document(M)

paras = d.paragraphs
print('total:', len(paras))
texts = [p.text for p in paras]

for probe in ['七、', 'T1.', 'M1.', 'R1.', 'N1.', 'O1.', 'S1.', '【一句话背诵】']:
    hits = [i for i, t in enumerate(texts) if probe in t]
    print(probe, '-> count', len(hits), 'first_idx', hits[0] if hits else None)

print('--- tail 12 ---')
for p in paras[-12:]:
    print(repr(p.style.name), p.text[:60])
