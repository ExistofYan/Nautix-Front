import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAllPorts } from '@/api/port'
import type { Port } from '@/api/types'

/**
 * Port dictionary cache. Other views resolve port names through nameOf(id)
 * instead of re-fetching /port/all. Failures keep the previous cache.
 */
export const usePortStore = defineStore('port', () => {
  const ports = ref<Port[]>([])
  const loaded = ref(false)
  const currentPort = ref<Port | null>(null)

  const byId = computed(() => {
    const m = new Map<number, Port>()
    for (const p of ports.value) if (p.id != null) m.set(p.id, p)
    return m
  })

  function nameOf(id?: number | null): string {
    if (id == null) return '—'
    return byId.value.get(id)?.portName || `港 #${id}`
  }

  async function load(force = false) {
    if (loaded.value && !force) return
    try {
      const res = await getAllPorts()
      ports.value = Array.isArray(res) ? res : []
      loaded.value = true
    } catch {
      /* silent — callers show empty states */
    }
  }

  function selectPort(port: Port | null) {
    currentPort.value = port
  }

  return { ports, loaded, currentPort, byId, nameOf, load, selectPort }
})
