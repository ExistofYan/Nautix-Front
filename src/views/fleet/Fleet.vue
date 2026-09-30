<template>
  <div class="fleet-page nx-page">
    <div class="page-header nx-panel">
      <h1 class="page-title"><el-icon><Guide /></el-icon> 船队管理</h1>
      <el-input v-model="keyword" placeholder="搜索公司或船名" clearable style="width: 260px">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
    </div>

    <el-skeleton v-if="store.loading && store.fleets.length === 0" animated>
      <template #template>
        <div class="grid">
          <el-skeleton-item v-for="i in 6" :key="i" variant="rect" style="height: 158px; border-radius: 14px" />
        </div>
      </template>
    </el-skeleton>

    <div v-else-if="filtered.length" class="grid">
      <FleetCard v-for="f in filtered" :key="f.company" :fleet="f" @select="openFleet" />
    </div>
    <el-empty v-else description="未找到匹配船队" :image-size="90" />

    <FleetCompare v-if="store.fleets.length >= 2" :fleets="store.fleets" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFleet } from '@/hooks/useFleet'
import FleetCard from '@/components/fleet/FleetCard.vue'
import FleetCompare from '@/components/fleet/FleetCompare.vue'

const router = useRouter()
const { store } = useFleet()
const keyword = ref('')

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return store.fleets
  return store.fleets.filter(
    f => f.company.toLowerCase().includes(kw) || f.ships.some(s => (s.shipName ?? '').toLowerCase().includes(kw))
  )
})

function openFleet(company: string) {
  store.select(company)
  void router.push(`/fleet/${encodeURIComponent(company)}`).catch(() => { /* 路由由总装补齐 */ })
}
</script>

<style scoped>
.fleet-page { display: flex; flex-direction: column; gap: 18px; }
.page-header { border-radius: 14px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-title { margin: 0; font-size: 20px; font-weight: 800; color: #f1f5f9; display: flex; align-items: center; gap: 10px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px; }
</style>
