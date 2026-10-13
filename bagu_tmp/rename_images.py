# -*- coding: utf-8 -*-
"""Interview 目录 35 张 png 语义化重命名（映射以本人逐张查看拼图为准）。
先全量校验再执行：源缺失或目标名冲突则整体中止，不做部分改名。"""
import os, sys

D = r'C:\Users\33265\Desktop\Interview'

PAIRS = [
 ("DoorKnocking开会",                       "Abaqus课程图01_拱形开口二维结构网格"),
 ("DoorKnocking开会 (2)",                   "Abaqus课程图02_板位移矢量图"),
 ("DoorKnocking开会 (3)",                   "Abaqus课程图03_梁Mises应力云图"),
 ("Weixin Image_20261009212502_613_479",    "Abaqus课程图04_桁架杆系模型"),
 ("Weixin Image_20261009212554_617_479",    "Abaqus课程图05_边界条件设置对话框"),
 ("Weixin Image_20261009212700_622_479",    "微信聊天记录_教授夸桥建模复杂"),
 ("Weixin Image_20261009212711_623_479",    "微信聊天记录_教授追问有限元计算"),
 ("Weixin Image_20261009212804_625_479",    "微信聊天记录_教授发参考资料"),
 ("屏幕截图 2026-10-09 213358",             "CFD课程图06_U形域六面体结构网格"),
 ("屏幕截图 2026-10-09 213618",             "NAUTIX截图01_传感器实时数据"),
 ("屏幕截图 2026-10-09 213634",             "NAUTIX截图02_传感器字典"),
 ("屏幕截图 2026-10-09 213646",             "NAUTIX截图03_告警规则列表"),
 ("屏幕截图 2026-10-09 213714",             "NAUTIX截图04_港口管理"),
 ("屏幕截图 2026-10-09 213833",             "NAUTIX截图05_气象监测"),
 ("屏幕截图 2026-10-09 213839",             "NAUTIX截图06_数据分析中心"),
 ("屏幕截图 2026-10-09 213855",             "NAUTIX截图07_航线轨迹回放"),
 ("屏幕截图 2026-10-09 213927",             "NAUTIX截图08_船队管理"),
 ("屏幕截图 2026-10-09 214011",             "NAUTIX截图09_船队态势地图"),
 ("屏幕截图 2026-10-09 214034",             "NAUTIX截图10_告警分析"),
 ("屏幕截图 2026-10-09 214137",             "NAUTIX截图11_告警态势地图"),
 ("屏幕截图 2026-10-09 214159",             "NAUTIX截图12_指挥中心大屏"),
 ("屏幕截图 2026-10-09 214232",             "NAUTIX截图13_AI工作台对话"),
 ("Weixin Image_20261009214308_661_479",    "Abaqus软件界面_人形机器人演示模型"),
 ("桥（教授带的）",                          "Julia桥墩图01_桥梁场景三维模型"),
 ("桥（教授带的） (2)",                      "Julia桥墩图02_水载甲板自重组合工况"),
 ("桥（教授带的） (3)",                      "Julia桥墩图03_纯水荷载响应"),
 ("桥（教授带的） (4)",                      "Julia桥墩图04_网格与水压力载荷"),
 ("船1（教授带的）",                         "Julia货船图01_船体三维入水模型"),
 ("屏幕截图 2026-10-09 214804",             "Julia货船图02_网格与海水压力"),
 ("屏幕截图 2026-10-09 214809",             "Julia货船图03_外板应力云图"),
 ("屏幕截图 2026-10-09 214814",             "Julia货船图04_变形图325倍放大"),
 ("屏幕截图 2026-10-09 214830",             "Julia巡逻船图01_船体三维模型"),
 ("屏幕截图 2026-10-09 214835",             "Julia巡逻船图02_网格与海水压力"),
 ("屏幕截图 2026-10-09 214838",             "Julia巡逻船图03_外板应力云图"),
 ("屏幕截图 2026-10-09 214842",             "Julia巡逻船图04_变形图246倍放大"),
]

assert len(PAIRS) == 35, len(PAIRS)
news = [n + ".png" for _, n in PAIRS]
assert len(set(news)) == 35, "新名字内部有重复"

existing = set(os.listdir(D))
errors = []
for old, new in PAIRS:
    if not os.path.exists(os.path.join(D, old + ".png")):
        errors.append(f"源文件缺失: {old}.png")
    if (new + ".png") in existing:
        errors.append(f"目标名已被占用: {new}.png")
if errors:
    print("\n".join(errors)); sys.exit(1)

for old, new in PAIRS:
    os.rename(os.path.join(D, old + ".png"), os.path.join(D, new + ".png"))
print(f"renamed {len(PAIRS)} files")

after = sorted(f for f in os.listdir(D) if f.lower().endswith('.png'))
print("png total:", len(after))
print("missing:", set(news) - set(after) or "无")
print("unexpected:", (set(after) - set(news)) or "无")
