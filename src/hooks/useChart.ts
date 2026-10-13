import * as echarts from 'echarts'
import { onMounted, onUnmounted, watch, type Ref } from 'vue'
import { translateChartOption } from '@/i18n/chartText'
import { useLang } from '@/stores/lang'

/**
 * Lightweight ECharts wrapper: binds to container, auto-resizes, disposes on unmount.
 *
 * 图表文字画在 canvas 上，DOM 翻译层覆盖不到，因此：
 *  - setOption 前按当前语言翻译配置里的展示文案；
 *  - 缓存最近一次原始配置，语言切换时自动重绘，无需各页面自行 watch。
 *
 * @param el template ref pointing to the DOM container
 */
export function useChart(el: Ref<HTMLElement | undefined | null>) {
  let chart: echarts.ECharts | null = null
  let lastOption: echarts.EChartsOption | null = null
  const lang = useLang()

  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
    chart?.resize()
  }) : null

  onMounted(() => {
    if (el.value) {
      chart = echarts.init(el.value)
      if (resizeObserver) resizeObserver.observe(el.value)
      if (lastOption) chart.setOption(applyLang(lastOption), true)
    }
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
    chart?.dispose()
    chart = null
    lastOption = null
  })

  function applyLang(option: echarts.EChartsOption): echarts.EChartsOption {
    return lang.lang === 'en' ? translateChartOption(option) : option
  }

  function setOption(option: echarts.EChartsOption) {
    lastOption = option
    if (!chart && el.value) {
      chart = echarts.init(el.value)
      if (resizeObserver) resizeObserver.observe(el.value)
    }
    chart?.setOption(applyLang(option), true)
  }

  // 语言切换：用缓存的原始配置重新翻译并整图重绘
  watch(() => lang.lang, () => {
    if (chart && lastOption) chart.setOption(applyLang(lastOption), true)
  })

  return { setOption }
}

/* Chart common dark theme tokens */
export const chartTheme = {
  textStyle: { color: '#a8bdd9' },
  legendText: '#a8bdd9',
  axisLine: 'rgba(148,184,232,0.25)',
  splitLine: 'rgba(148,184,232,0.08)',
  palette: ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#22d3ee', '#fb7185', '#818cf8'],
}
