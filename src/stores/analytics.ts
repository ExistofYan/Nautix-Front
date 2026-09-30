import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getFleetCompanyDist, type FleetRow } from '@/api/analytics'

export const useAnalyticsStore = defineStore('analytics', () => {
  const data = ref<FleetRow[]>([])
  const loading = ref(false)
  async function load() {
    loading.value = true
    try {
      data.value = await getFleetCompanyDist()
    } catch {
      data.value = []
    } finally {
      loading.value = false
    }
  }
  return { data, loading, load }
})
