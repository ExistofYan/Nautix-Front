import { computed, onMounted, onUnmounted } from 'vue'
import { useSystemStore } from '@/stores/system'
import { useRuntimeStore } from '@/stores/runtime'

/**
 * Shared polling for system monitoring views: probes gateway latency + fleet
 * runtime + dashboard counters every `intervalMs` (default 5s). Pauses while
 * the tab is hidden and resumes immediately when visible again.
 */
export function useSystemPolling(intervalMs = 5000) {
  const sys = useSystemStore()
  const rt = useRuntimeStore()
  let timer: number | undefined

  async function tick() {
    await Promise.all([sys.probe(), rt.refresh(), sys.loadStats()])
  }

  function start() {
    stop()
    void tick()
    timer = window.setInterval(() => void tick(), intervalMs)
  }

  function stop() {
    if (timer !== undefined) {
      clearInterval(timer)
      timer = undefined
    }
  }

  function onVisibility() {
    if (document.hidden) stop()
    else start()
  }

  onMounted(() => {
    start()
    document.addEventListener('visibilitychange', onVisibility)
  })

  onUnmounted(() => {
    stop()
    document.removeEventListener('visibilitychange', onVisibility)
  })

  return { sys, rt, tick }
}

/** Convenience reactive view over the system store. */
export function useSystem() {
  const store = useSystemStore()
  const online = computed(() => store.online)
  const avgRtt = computed(() => store.avgRtt)
  return { store, online, avgRtt }
}
