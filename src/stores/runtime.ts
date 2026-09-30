import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { deriveRuntimeFeed } from '@/api/runtime'
import type { ShipRuntimeStatus } from '@/api/types'

/**
 * Rolling fleet runtime feed. Polls /runtime; on failure keeps the previous
 * snapshot so monitoring pages never blank out.
 */
export const useRuntimeStore = defineStore('runtime', () => {
  const rows = ref<ShipRuntimeStatus[]>([])
  const fetchedAt = ref<number | null>(null)
  const lastErrorAt = ref<number | null>(null)

  const byShip = computed(() => {
    const m = new Map<number, ShipRuntimeStatus>()
    for (const r of rows.value) {
      if (r.shipId != null) m.set(r.shipId, r)
    }
    return m
  })

  /** Ships whose feed is fresher than `sec` seconds. */
  function freshWithin(sec: number) {
    const now = Date.now()
    return rows.value.filter(r => {
      if (!r.lastUpdate) return false
      const t = new Date(r.lastUpdate).getTime()
      return Number.isFinite(t) && now - t <= sec * 1000
    })
  }

  async function refresh() {
    try {
      const feed = await deriveRuntimeFeed()
      rows.value = feed.rows
      fetchedAt.value = feed.fetchedAt
    } catch {
      lastErrorAt.value = Date.now()
    }
  }

  return { rows, fetchedAt, lastErrorAt, byShip, freshWithin, refresh }
})
