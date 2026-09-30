import { computed, onMounted, ref } from 'vue'
import { useAlertStore, type AlertFilters } from '@/stores/alert'
import type { EnrichedAlert } from '@/types/alert'

/**
 * 告警页组合式入口：挂载即分页加载，并暴露筛选/翻页/处置动作。
 */
export function useAlert(initial?: AlertFilters) {
  const store = useAlertStore()
  const selected = ref<EnrichedAlert | null>(null)
  const drawerOpen = ref(false)

  if (initial) store.filters = { ...initial }

  onMounted(() => {
    void store.load({ page: 1 })
  })

  const pendingCount = computed(() => store.records.filter(r => r.handleStatus !== 1).length)

  async function reload() {
    await store.load()
  }

  async function setPage(p: number) {
    await store.load({ page: p })
  }

  async function setSize(s: number) {
    await store.load({ size: s, page: 1 })
  }

  async function applyFilters(f: AlertFilters) {
    await store.load({ filters: f, page: 1 })
  }

  function open(row: EnrichedAlert) {
    selected.value = row
    store.current = row
    drawerOpen.value = true
  }

  async function markHandled(row: EnrichedAlert) {
    const ok = await store.markHandled(row)
    if (ok && selected.value?.id === row.id) {
      selected.value = store.current
    }
    return ok
  }

  return {
    store,
    rows: computed(() => store.records.map(store.enrich)),
    total: computed(() => store.total),
    page: computed(() => store.page),
    size: computed(() => store.size),
    loading: computed(() => store.loading),
    pendingCount,
    selected,
    drawerOpen,
    reload,
    setPage,
    setSize,
    applyFilters,
    open,
    markHandled,
    remove: store.remove,
    shipNameOf: store.shipNameOf,
  }
}
