import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useFleetStore } from '@/stores/fleet'

/** 船队数据：进入页面即加载，30s 轮询刷新实时指标 */
export function useFleet() {
  const store = useFleetStore()
  let timer: number | undefined

  const fleetCount = computed(() => store.fleets.length)

  onMounted(() => {
    void store.load()
    timer = window.setInterval(() => void store.load(), 30_000)
  })
  onBeforeUnmount(() => {
    if (timer !== undefined) window.clearInterval(timer)
  })

  return { store, fleetCount }
}
