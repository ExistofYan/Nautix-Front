/* 图表通用类型 */

/** 单条命名序列（多轴/多系列图通用） */
export interface Series {
  name: string
  color?: string
  /** 与 xAxis labels 对齐的数值，缺测用 null */
  data: (number | null)[]
}

/** 双轴折线配置 */
export interface LineChartConfig {
  labels: string[]
  series: Series[]
  yAxisName?: string
  rightAxisSeries?: number[]
}

/** 深空主题调色板（与 hooks/useChart chartTheme 同源） */
export const CHART_PALETTE = [
  '#38bdf8', '#a78bfa', '#34d399', '#fbbf24',
  '#f472b6', '#22d3ee', '#fb7185', '#818cf8',
] as const

export function paletteAt(i: number): string {
  return CHART_PALETTE[i % CHART_PALETTE.length]
}
