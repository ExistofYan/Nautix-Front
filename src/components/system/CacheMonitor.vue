<template>
  <div class="nx-panel cache-card">
    <div class="head">
      <span class="title"><el-icon><Coin /></el-icon> 浏览器缓存监视</span>
      <el-button size="small" round :loading="loading" @click="collect">刷新</el-button>
    </div>

    <div class="quota-row">
      <div class="q-block">
        <div class="q-label">存储配额用量</div>
        <el-progress
          type="dashboard"
          :percentage="quotaPct"
          :width="96"
          :stroke-width="8"
          color="#38bdf8"
        >
          <template #default>
            <div class="q-center">
              <div class="q-pct">{{ quotaPct }}%</div>
              <div class="q-sub">{{ fmtBytes(usage) }}</div>
            </div>
          </template>
        </el-progress>
        <div class="q-hint">{{ quotaKnown ? `配额 ${fmtBytes(quota)}` : '浏览器未暴露配额 API' }}</div>
      </div>

      <div class="key-table-wrap">
        <el-table :data="entries" size="small" height="220" stripe>
          <el-table-column prop="key" label="localStorage 键" min-width="140" show-overflow-tooltip />
          <el-table-column label="体积" width="90">
            <template #default="{ row }">{{ fmtBytes(row.bytes) }}</template>
          </el-table-column>
          <el-table-column label="预览" min-width="160">
            <template #default="{ row }">
              <span class="preview">{{ row.preview }}</span>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="!entries.length && !loading" class="empty-mini">localStorage 为空</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface CacheEntry { key: string; bytes: number; preview: string }

const entries = ref<CacheEntry[]>([])
const usage = ref(0)
const quota = ref<number | null>(null)
const quotaPct = ref(0)
const quotaKnown = ref(false)
const loading = ref(false)

function fmtBytes(n: number | null): string {
  if (n == null) return '--'
  if (!Number.isFinite(n) || n <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`
}

async function collect() {
  loading.value = true
  try {
    const list: CacheEntry[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      const v = localStorage.getItem(k) ?? ''
      list.push({
        key: k,
        bytes: new Blob([k + v]).size,
        preview: v.length > 48 ? v.slice(0, 48) + '…' : v,
      })
    }
    entries.value = list.sort((a, b) => b.bytes - a.bytes)
    usage.value = list.reduce((a, e) => a + e.bytes, 0)

    quotaKnown.value = false
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate()
      if (est.quota && est.usage != null) {
        quota.value = est.quota
        usage.value = Math.max(usage.value, est.usage)
        quotaPct.value = Math.min(100, Math.round((est.usage / est.quota) * 100))
        quotaKnown.value = true
      }
    }
  } catch {
    /* degrade silently — table just stays empty */
  } finally {
    loading.value = false
  }
}

onMounted(collect)
</script>

<style scoped>
.cache-card { padding: 18px 20px; border-radius: 14px; }
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.title { display: inline-flex; align-items: center; gap: 8px; color: var(--nx-text); font-weight: 700; font-size: 15px; }
.quota-row { display: grid; grid-template-columns: 180px 1fr; gap: 18px; }
.q-block { text-align: center; }
.q-label { font-size: 12px; color: var(--nx-text-dim); margin-bottom: 8px; }
.q-center .q-pct { font-size: 18px; font-weight: 800; color: #7dd3fc; }
.q-center .q-sub { font-size: 10.5px; color: #64748b; }
.q-hint { margin-top: 8px; font-size: 11px; color: #64748b; }
.key-table-wrap { min-width: 0; }
.preview { color: var(--nx-text-dim); font-family: Consolas, monospace; font-size: 11.5px; }
.empty-mini { margin-top: 10px; font-size: 12px; color: #64748b; text-align: center; }
</style>
