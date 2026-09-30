import { onMounted, onUnmounted } from 'vue'
import { useCommandStore } from '@/stores/command'

/** 指挥中心轮询：挂载即刷新一次，之后每 10s 拉取快照；卸载清理定时器。 */
export function useCommand(intervalMs = 10000) {
  const store = useCommandStore()

  let timer: number | undefined

  onMounted(() => {
    void store.refreshAll()
    timer = window.setInterval(() => {
      void store.refreshAll()
    }, intervalMs)
  })

  onUnmounted(() => {
    if (timer !== undefined) clearInterval(timer)
  })

  return { store }
}
