<template>
  <div class="nx-page cache-page">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title"><el-icon><Coin /></el-icon> 浏览器缓存明细</h2>
        <p class="nx-page-desc">localStorage 键值全量清单 · 含会话令牌等登录态，仅在本机展示、绝不上传</p>
      </div>
      <el-button type="danger" plain round @click="clearNonAuth">
        <el-icon><Delete /></el-icon> 清理非登录态键
      </el-button>
    </div>

    <CacheMonitor />

    <div class="nx-panel detail-card">
      <div class="d-head">
        <span class="title">全部键值（共 {{ allKeys.length }} 个）</span>
        <el-input v-model="kw" placeholder="搜索键名/值" size="small" clearable style="width: 220px">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>
      <el-table :data="filtered" size="small" stripe max-height="420">
        <el-table-column prop="key" label="键" width="220" show-overflow-tooltip />
        <el-table-column label="值" min-width="360">
          <template #default="{ row }">
            <code class="val">{{ row.value }}</code>
          </template>
        </el-table-column>
        <el-table-column label="体积" width="90">
          <template #default="{ row }">{{ bytesOf(row) }} B</template>
        </el-table-column>
      </el-table>
      <div v-if="!filtered.length" class="empty-mini">{{ allKeys.length ? '无匹配键' : 'localStorage 为空' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CacheMonitor from '@/components/system/CacheMonitor.vue'

interface KV { key: string; value: string }

const allKeys = ref<KV[]>([])

function bytesOf(kv: KV): number { return new Blob([kv.key + kv.value]).size }
const kw = ref('')

function collect() {
  const list: KV[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k) continue
    list.push({ key: k, value: localStorage.getItem(k) ?? '' })
  }
  allKeys.value = list.sort((a, b) => a.key.localeCompare(b.key))
}

const filtered = computed(() => {
  const q = kw.value.trim().toLowerCase()
  if (!q) return allKeys.value
  return allKeys.value.filter(e => e.key.toLowerCase().includes(q) || e.value.toLowerCase().includes(q))
})

async function clearNonAuth() {
  try {
    await ElMessageBox.confirm(
      '将删除除 token / user 之外的所有本地存储键，用于重置演示数据。是否继续？',
      '清理确认',
      { type: 'warning', confirmButtonText: '清理', cancelButtonText: '取消' },
    )
  } catch { return }
  const keep = new Set(['token', 'user'])
  const doomed = allKeys.value.filter(e => !keep.has(e.key)).map(e => e.key)
  doomed.forEach(k => localStorage.removeItem(k))
  collect()
  ElMessage.success(`已清理 ${doomed.length} 个键`)
}

onMounted(collect)
</script>

<style scoped>
.cache-page { display: flex; flex-direction: column; gap: 18px; }
.detail-card { padding: 18px 20px; border-radius: 14px; }
.d-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 12px; flex-wrap: wrap; }
.title { color: var(--nx-text); font-weight: 700; font-size: 15px; }
.val { color: var(--nx-text-dim); font-size: 11.5px; word-break: break-all; }
.empty-mini { margin-top: 12px; text-align: center; font-size: 12px; color: #64748b; }
</style>
