import re

src = open(r'D:\新建文件夹\java\javacode\nautix-frontend\src\i18n\index.ts', encoding='utf-8').read()

i_en = src.find('const en')
i_zh = src.find('const zh')
en_block = src[i_en:i_zh]
zh_block = src[i_zh:src.find('export const messages')]

pat = re.compile(r"^\s{2}'[^']+'\s*:", re.M)
en_keys = pat.findall(en_block)
zh_keys = pat.findall(zh_block)

print('en keys:', len(en_keys))
print('zh keys:', len(zh_keys))
print('MsgKey = keyof typeof en:', "keyof typeof en" in src)
