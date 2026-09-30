import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useReplayStore } from '@/stores/replay'
import type { ReplaySpeed } from '@/types/replay'

/**
 * 回放工作台组合式函数：绑定 store、键盘快捷键（空格播放/暂停、←/→ 步进）与帧时间标签。
 */
export function useReplay(routeId?: () => number | undefined) {
  const store = useReplayStore()

  /** 当前帧 mm:ss 时间标签（按 1x 倍速每帧约 0.9s 估算） */
  function frameTimeLabel(index: number): string {
    const totalSec = Math.round(Math.max(index, 0) * 0.9)
    const m = String(Math.floor(totalSec / 60)).padStart(2, '0')
    const s = String(totalSec % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  const currentTimeLabel = computed(() => frameTimeLabel(store.currentIndex))
  const totalTimeLabel = computed(() => frameTimeLabel(store.lastIndex))

  function onKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
    if (e.code === 'Space') {
      e.preventDefault()
      store.toggle()
    } else if (e.code === 'ArrowRight') {
      store.next()
    } else if (e.code === 'ArrowLeft') {
      store.prev()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKey)
    const id = routeId?.()
    if (id != null) void store.loadRoute(id)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKey)
    store.pause()
  })

  if (routeId) {
    watch(routeId, id => {
      if (id != null) void store.loadRoute(id)
    })
  }

  return { store, currentTimeLabel, totalTimeLabel, frameTimeLabel, setSpeed: (s: ReplaySpeed) => store.setSpeed(s) }
}
