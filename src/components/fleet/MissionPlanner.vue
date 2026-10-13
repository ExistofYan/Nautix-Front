<template>
  <div class="mission-planner nx-panel">
    <h4><el-icon><Calendar /></el-icon> 新建任务计划</h4>
    <el-form label-position="top" size="default">
      <el-form-item label="指派船舶">
        <el-select-v2 v-model="form.shipId" :options="shipOptions" filterable placeholder="选择船舶" style="width: 100%" />
      </el-form-item>
      <el-form-item label="执行航线">
        <el-select-v2 v-model="form.routeId" :options="routeOptions" filterable placeholder="选择航线" style="width: 100%" />
      </el-form-item>
      <el-form-item label="计划窗口">
        <el-date-picker
          v-model="range"
          type="datetimerange"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DDTHH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.note" type="textarea" :rows="2" maxlength="120" show-word-limit placeholder="选填" />
      </el-form-item>
      <el-button type="primary" round :disabled="!canSubmit" @click="submit">保存计划</el-button>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getAllShipsCached } from '@/api/ship'
import { getRoutePage } from '@/api/route'
import type { Mission } from '@/types/fleet'

const STORE_KEY = 'nautix.missions'

const emit = defineEmits<{
  (e: 'update:missions', list: Mission[]): void
}>()

const ships = ref<{ id: number; shipName: string }[]>([])
const routes = ref<{ id: number; routeName: string }[]>([])
const missions = ref<Mission[]>([])
const range = ref<[string, string] | null>(null)
const form = reactive({ shipId: undefined as number | undefined, routeId: undefined as number | undefined, note: '' })

const shipOptions = computed(() => ships.value.map(s => ({ value: s.id, label: s.shipName })))
const routeOptions = computed(() => routes.value.map(r => ({ value: r.id, label: r.routeName })))
const canSubmit = computed(() => form.shipId != null && form.routeId != null && range.value != null)

function readStore(): Mission[] {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]') as Mission[] } catch { return [] }
}

function submit() {
  if (!canSubmit.value || !range.value) return
  const ship = ships.value.find(s => s.id === form.shipId)
  const route = routes.value.find(r => r.id === form.routeId)
  const mission: Mission = {
    id: `${Date.now()}`,
    shipId: form.shipId as number,
    shipName: ship?.shipName,
    routeId: form.routeId as number,
    routeName: route?.routeName,
    startAt: range.value[0],
    endAt: range.value[1],
    note: form.note || undefined,
  }
  missions.value = [mission, ...readStore()]
  localStorage.setItem(STORE_KEY, JSON.stringify(missions.value))
  emit('update:missions', missions.value)
  ElMessage.success('计划已保存到本机')
  form.shipId = undefined
  form.routeId = undefined
  form.note = ''
  range.value = null
}

onMounted(async () => {
  missions.value = readStore()
  emit('update:missions', missions.value)
  try {
    const [all, page] = await Promise.all([getAllShipsCached(), getRoutePage({ page: 1, count: 50 })])
    ships.value = (all ?? []).filter(s => s.id != null).map(s => ({ id: s.id as number, shipName: s.shipName ?? `船 #${s.id}` }))
    routes.value = (page.records ?? []).filter(r => r.id != null).map(r => ({ id: r.id as number, routeName: r.routeName ?? `航线 #${r.id}` }))
  } catch { /* 空态兜底 */ }
})
</script>

<style scoped>
.mission-planner { border-radius: 14px; padding: 18px 20px; }
h4 { margin: 0 0 16px; font-size: 14px; color: #f1f5f9; display: flex; align-items: center; gap: 8px; letter-spacing: .5px; }
.saved { margin-top: 18px; border-top: 1px dashed rgba(56,189,248,.15); padding-top: 12px; }
.saved-title { font-size: 12px; color: #64748b; letter-spacing: 1px; margin-bottom: 8px; }
.saved-row { display: flex; justify-content: space-between; align-items: center; color: #cbd5e1; font-size: 13px; padding: 5px 0; }
</style>
