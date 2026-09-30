import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAllWeatherRegions } from '@/api/weather'
import type { WeatherRegion } from '@/api/types'
import type { Weather } from '@/types/weather'

export const useWeatherStore = defineStore('weather', () => {
  const weatherList = ref<Weather[]>([])
  const regions = ref<WeatherRegion[]>([])

  async function loadWeather() {
    try {
      const res = await getAllWeatherRegions()
      const list = Array.isArray(res) ? res : []
      regions.value = list
      weatherList.value = list.map((r: WeatherRegion) => ({
        id: r.id ?? 0,
        region: r.regionName ?? '',
        temperature: r.airTemperature ?? 0,
        pressure: r.pressure ?? 0,
        humidity: r.humidity ?? 0,
        windSpeed: r.windSpeed ?? 0,
      }))
    } catch {
      /* silent */
    }
  }

  async function load() {
    await loadWeather()
  }

  return { weatherList, regions, loadWeather, load }
})
