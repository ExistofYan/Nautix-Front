import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { pingOnce, type PingSample } from '@/api/runtime'
import { getDashboardStats, type DashboardStats } from '@/api/dashboard'

const MAX_POINTS = 100

/**
 * Gateway/system health store. There is no dedicated backend metrics endpoint,
 * so liveness + latency are SAMPLED FROM THE GATEWAY via /public/ping and the
 * dashboard counters via /dashboard/stats. All failures degrade silently.
 */
export const useSystemStore = defineStore('system', () => {
  const samples = ref<PingSample[]>([])
  const stats = ref<DashboardStats | null>(null)
  const lastRefresh = ref<number | null>(null)

  const online = computed(() => {
    const last = samples.value[samples.value.length - 1]
    return !!last && last.ok
  })

  const avgRtt = computed(() => {
    const ok = samples.value.filter(s => s.ok)
    if (!ok.length) return null
    return Math.round(ok.reduce((a, s) => a + s.rttMs, 0) / ok.length)
  })

  const failRate = computed(() => {
    if (!samples.value.length) return 0
    const bad = samples.value.filter(s => !s.ok).length
    return Math.round((bad / samples.value.length) * 100)
  })

  async function probe() {
    const s = await pingOnce()
    samples.value.push(s)
    if (samples.value.length > MAX_POINTS) {
      samples.value.splice(0, samples.value.length - MAX_POINTS)
    }
  }

  async function loadStats() {
    try {
      stats.value = await getDashboardStats()
      lastRefresh.value = Date.now()
    } catch {
      /* keep previous value; page still renders with empty state */
    }
  }

  function reset() {
    samples.value = []
  }

  return { samples, stats, lastRefresh, online, avgRtt, failRate, probe, loadStats, reset }
})
