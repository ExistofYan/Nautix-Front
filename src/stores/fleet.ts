import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getFleetList } from '@/api/fleet'
import type { Fleet } from '@/types/fleet'

export const useFleetStore = defineStore('fleet', () => {
  const fleets = ref<Fleet[]>([])
  const selectedCompany = ref<string | null>(null)
  const loading = ref(false)

  const selectedFleet = computed(
    () => fleets.value.find(f => f.company === selectedCompany.value) ?? null
  )

  async function load() {
    loading.value = true
    try {
      fleets.value = await getFleetList()
      if (selectedCompany.value && !fleets.value.some(f => f.company === selectedCompany.value)) {
        selectedCompany.value = null
      }
    } catch {
      fleets.value = []
    } finally {
      loading.value = false
    }
  }

  function select(company: string | null) {
    selectedCompany.value = company
  }

  return { fleets, selectedCompany, selectedFleet, loading, load, select }
})
