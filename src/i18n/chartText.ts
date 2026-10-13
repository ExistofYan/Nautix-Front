import { translateUiText } from './uiText'

/**
 * ECharts 配置里的中文 → 英文。
 *
 * 图表文字绘制在 canvas 上，DOM 翻译层够不到，因此在 setOption 前
 * 深度遍历配置对象，翻译展示性字段（name / legend.data / 轴 name /
 * tooltip 字符串模板等）。
 *
 * 只翻译命中词典的字符串：数据库带来的船型、传感器名等中文值不在词典中，
 * 保持原样（与用户要求一致：DB 里的中文不动）。
 */

function translateValue(v: string): string {
  return translateUiText(v) ?? v
}

function walk(node: unknown): unknown {
  if (typeof node === 'string') {
    // 逐个字符串尝试翻译：translateUiText 只改命中词典/模板的展示文案，
    // 船名、港口名等数据值返回 null 即原样保留，因此对所有字符串安全。
    return translateValue(node)
  }
  if (Array.isArray(node)) {
    return node.map((item) => walk(item))
  }
  if (node && typeof node === 'object') {
    const src = node as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(src)) {
      const val = src[k]
      if (typeof val === 'function') {
        out[k] = val // formatter 函数无法安全改写，保持原样
        continue
      }
      out[k] = walk(val)
    }
    return out
  }
  return node
}

export function translateChartOption<T>(option: T): T {
  return walk(option) as T
}
