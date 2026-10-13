import { zh2en } from './zh2en'

/**
 * 界面文案翻译核心（DOM 翻译层与图表翻译共用）。
 *
 * 两级匹配：
 *  1) 词典精确匹配（zh2en，键为渲染后的完整文案）；
 *  2) 参数化模板正则匹配（如「近 60 条读数趋势」「共 12 艘船」）。
 *
 * 未命中返回 null —— 调用方保持原文。数据库里的船名 / 港口名 / 船型等
 * 中文值不在词典中，天然不会被误翻。
 */

const CJK = /[\u4e00-\u9fff]/

/** 参数化文案模式：渲染后含数字/变量的模板串 */
const PATTERNS: Array<[RegExp, string]> = [
  [/^近 (\d+) 条读数趋势$/, 'Trend of last $1 readings'],
  [/^第 (\d+) 段 · ([\d.,]+) nm$/, 'Segment $1 · $2 nm'],
  [/^占比 ([\d.]+)%$/, '$1% of total'],
  [/^航线 #(\d+)$/, 'Route #$1'],
  [/^航线 (\d+)$/, 'Route $1'],
  [/^规则 #(\d+)$/, 'Rule #$1'],
  [/^规则#(\d+)$/, 'Rule #$1'],
  [/^船 #(\d+)$/, 'Ship #$1'],
  [/^区域 (\d+)$/, 'Region $1'],
  [/^共 ([\d,.]+) 艘船$/, '$1 ships'],
  [/^共 ([\d,.]+) 个港口$/, '$1 ports'],
  [/^共 ([\d,.]+) 条航线$/, '$1 routes'],
  [/^共 ([\d,.]+) 条传感器配置$/, '$1 sensor configs'],
  [/^共 ([\d,.]+) 种传感器类型$/, '$1 sensor types'],
  [/^共 ([\d,.]+) 条告警记录$/, '$1 alert records'],
  [/^共 ([\d,.]+) 条告警规则$/, '$1 alert rules'],
  [/^共 ([\d,.]+) 条日志$/, '$1 log entries'],
  [/^共 ([\d,.]+) 条$/, '$1 items'],
  [/^共 ([\d,.]+) 个$/, '$1 total'],
  [/^(\d+) 条\/页$/, '$1 / page'],
  [/^(\d+) 个区域已全部加载$/, 'All $1 regions loaded'],
  [/^已显示 ([\d,.]+) \/ ([\d,.]+) 个区域 —— 滚动加载更多$/, 'Showing $1 of $2 regions — scroll for more'],
  [/^更新：(.+)$/, 'Updated: $1'],
  [/^最近刷新：(.+)$/, 'Last refresh: $1'],
  [/^自动刷新：(.+)$/, 'Auto refresh: $1'],
  [/^([\d,.]+) 艘在报 · ([\d,.]+) 艘位于所选航线 ±(.+)° 带内$/, '$1 ships reporting · $2 within ±$3° of the selected route'],
  [/^(\S+): ([\d,.]+) 艘 \(([\d.]+)%\)$/, '$1: $2 ships ($3%)'],
  [/^([\d,.]+) 区$/, '$1 regions'],
  [/^([\d,.]+) 艘$/, '$1 ships'],
  [/^([\d,.]+) 条$/, '$1'],
  [/^([\d,.]+) 个$/, '$1'],
  [/^([\d,.]+) 类$/, '$1 groups'],
  [/^WP-(\d+) · #(\d+)$/, 'WP-$1 · #$2'],
]

/** 模板串（含 {b}/{c}/{d} 等 ECharts 标记）里内嵌的量词/单位 */
const TEMPLATE_UNITS: Array<[RegExp, string]> = [
  [/艘/g, 'ships'],
  [/海里/g, 'nmi'],
  [/公里/g, 'km'],
]

export function translateUiText(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed || !CJK.test(trimmed)) return null
  const exact = zh2en[trimmed]
  if (exact) return exact
  for (const [re, tpl] of PATTERNS) {
    if (re.test(trimmed)) return trimmed.replace(re, tpl)
  }
  // 模板串兜底：只处理带 {x} 标记的展示模板，替换内嵌量词/单位。
  // 数据值（船名/港口名）不含花括号，天然不会被这里改动。
  if (trimmed.includes('{')) {
    let out = trimmed
    for (const [re, rep] of TEMPLATE_UNITS) out = out.replace(re, rep)
    if (out !== trimmed) return out
  }
  return null
}

/** 把译文写回原文的首尾空白结构 */
export function translatePreserveSpace(raw: string): string | null {
  const en = translateUiText(raw)
  if (en === null) return null
  const lead = raw.slice(0, raw.length - raw.trimStart().length)
  const tail = raw.slice(raw.trimEnd().length)
  return lead + en + tail
}
