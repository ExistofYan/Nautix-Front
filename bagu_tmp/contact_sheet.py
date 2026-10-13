# -*- coding: utf-8 -*-
"""把 Interview 目录 34 张 png 拼成编号九宫格，便于一次性人工识别。只读原图，输出到 bagu_tmp。"""
from PIL import Image, ImageDraw
import os

D = r'C:\Users\33265\Desktop\Interview'
OUT = r'D:\新建文件夹\java\javacode\nautix-frontend\bagu_tmp'

files = [
 "DoorKnocking开会.png","DoorKnocking开会 (2).png","DoorKnocking开会 (3).png",
 "Weixin Image_20261009212502_613_479.png","Weixin Image_20261009212554_617_479.png",
 "Weixin Image_20261009212700_622_479.png","Weixin Image_20261009212711_623_479.png",
 "Weixin Image_20261009212804_625_479.png",
 "屏幕截图 2026-10-09 213358.png","屏幕截图 2026-10-09 213618.png",
 "屏幕截图 2026-10-09 213634.png","屏幕截图 2026-10-09 213646.png",
 "屏幕截图 2026-10-09 213714.png","屏幕截图 2026-10-09 213833.png",
 "屏幕截图 2026-10-09 213839.png","屏幕截图 2026-10-09 213855.png",
 "屏幕截图 2026-10-09 213927.png","屏幕截图 2026-10-09 214011.png",
 "屏幕截图 2026-10-09 214034.png","屏幕截图 2026-10-09 214137.png",
 "屏幕截图 2026-10-09 214159.png","屏幕截图 2026-10-09 214232.png",
 "Weixin Image_20261009214308_661_479.png",
 "桥（教授带的）.png","桥（教授带的） (2).png","桥（教授带的） (3).png","桥（教授带的） (4).png",
 "船1（教授带的）.png",
 "屏幕截图 2026-10-09 214804.png","屏幕截图 2026-10-09 214809.png",
 "屏幕截图 2026-10-09 214814.png","屏幕截图 2026-10-09 214830.png",
 "屏幕截图 2026-10-09 214835.png","屏幕截图 2026-10-09 214838.png",
 "屏幕截图 2026-10-09 214842.png",
]
assert len(files) == 35, len(files)
for f in files:
    assert os.path.exists(os.path.join(D, f)), f

CW, CH = 1500, 950  # 单元格
PER = 9
for sheet in range(4):
    part = files[sheet*PER:(sheet+1)*PER]
    canvas = Image.new('RGB', (CW*3, CH*3), (30,30,30))
    dr = ImageDraw.Draw(canvas)
    for i, f in enumerate(part):
        idx = sheet*PER + i + 1
        im = Image.open(os.path.join(D, f)).convert('RGB')
        im.thumbnail((CW-20, CH-60))
        x, y = (i%3)*CW, (i//3)*CH
        canvas.paste(im, (x+10, y+50))
        dr.rectangle([x, y, x+CW-1, y+44], fill=(0,0,0))
        dr.text((x+12, y+10), f"#{idx:02d}", fill=(255,255,0))
        dr.text((x+90, y+12), f[:38], fill=(255,255,255))
    canvas.save(os.path.join(OUT, f"contact_{sheet+1}.png"))
    print("saved", sheet+1, canvas.size)
