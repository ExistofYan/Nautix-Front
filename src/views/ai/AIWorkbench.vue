<template>
  <div class="nx-page ai-wb">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title"><el-icon><MagicStick /></el-icon> NautiX 智能问答台</h2>
        <p class="nx-page-desc">对话直连 /ai/chat · 建议问题来自 /ai/suggestions · 洞察与推荐由本地规则引擎生成</p>
      </div>
      <el-button round :disabled="!messages.length" @click="clearChat"><el-icon><Delete /></el-icon> 清空会话</el-button>
    </div>

    <div class="cols">
      <!-- 左：对话区 -->
      <GlassPanel title="对话" :icon="ChatDotRound" class="chat-col">
        <div ref="scrollEl" class="chat-body">
          <AIResponseCard
            v-for="(m, i) in messages"
            :key="i"
            :text="m.text"
            :mine="m.mine"
            :at="m.at"
            :insights="m.insights"
          />
          <div v-if="store.loading" class="typing nx-panel">思考中<span class="dots">...</span></div>
          <el-empty v-if="!messages.length && !store.loading" description="向 NautiX 提问，或点右侧推荐开始" :image-size="70" />
        </div>
        <QueryInput
          v-model="draft"
          :busy="store.loading"
          :suggestions="store.suggestions.slice(0, 6)"
          @query="ask"
        />
      </GlassPanel>

      <!-- 右：洞察 + 推荐 -->
      <div class="side-col">
        <InsightCard
          v-for="(ins, i) in insights"
          :key="i"
          :title="ins.title"
          :body="ins.body"
          :kind="ins.kind"
          :level="ins.level"
          :confidence="ins.confidence"
        />
        <RecommendationPanel :items="recos" @pick="(r: RecoItem) => ask(r.title)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { ChatDotRound, Delete, MagicStick } from '@element-plus/icons-vue'
import GlassPanel from '@/components/layout/GlassPanel.vue'
import AIResponseCard from '@/components/ai/AIResponseCard.vue'
import QueryInput from '@/components/ai/QueryInput.vue'
import InsightCard from '@/components/ai/InsightCard.vue'
import RecommendationPanel, { type RecoItem } from '@/components/ai/RecommendationPanel.vue'
import { useAIStore } from '@/stores/ai'
import { getFleetCompanyDist, getFuelDistribution, getRuleTriggerStats, type FleetRow, type FuelStat, type RuleTriggerRow } from '@/api/analytics'

interface Msg { text: string; mine: boolean; at: number; insights?: string[] }

const store = useAIStore()
const draft = ref('')
const messages = ref<Msg[]>([])
const scrollEl = ref<HTMLElement>()

const fleetRows = ref<FleetRow[]>([])
const fuel = ref<FuelStat>({ total: 0, lowCount: 0, buckets: [] })
const rules = ref<RuleTriggerRow[]>([])

/* 洞察卡：基于真实聚合数据的本地规则引擎（口径在正文注明） */
const insights = computed(() => {
  const out: { title: string; body: string; kind: 'trend' | 'risk' | 'tip' | 'stat'; level: string; confidence: number }[] = []
  if (fleetRows.value.length) {
    const top = fleetRows.value[0]
    out.push({
      title: '最大船队', kind: 'stat', level: '概览', confidence: 95,
      body: `${top.company} 以 ${top.shipCount} 艘居首（口径：/shipInfo/all 按运营公司聚合）。`,
    })
  }
  if (fuel.value.total > 0) {
    const pct = Math.round((fuel.value.lowCount / fuel.value.total) * 100)
    out.push({
      title: '燃油风险', kind: pct > 15 ? 'risk' : 'trend', level: pct > 15 ? '关注' : '正常', confidence: 80,
      body: `${fuel.value.lowCount}/${fuel.value.total} 艘油量低于 15%（${pct}%），口径：/runtime.fuelPercent。`,
    })
  }
  if (rules.value.length) {
    const r = rules.value[0]
    out.push({
      title: '最高频告警规则', kind: 'tip', level: '提示', confidence: 70,
      body: `「${r.ruleName}」累计触发 ${r.count} 次、待处理 ${r.pending} 条，建议优先核查阈值设置。`,
    })
  }
  return out
})

/* 推荐问题：点击即提问 */
const recos = computed<RecoItem[]>(() => {
  const items: RecoItem[] = [
    { title: '当前有多少艘船在航？', desc: '实时船位统计', tag: 'runtime' },
    { title: '哪些传感器波动异常？', desc: '稳定性排行', tag: 'sensor' },
    { title: '未处理告警清单', desc: '待处置事项', tag: 'alert' },
  ]
  if (fleetRows.value.length) {
    items.unshift({ title: `${fleetRows.value[0].company} 的船队规模如何？`, desc: '最大船队画像', tag: 'fleet' })
  }
  if (fuel.value.lowCount > 0) {
    items.splice(1, 0, { title: '低油量船舶有哪些（<15%）？', desc: `${fuel.value.lowCount} 艘待补能`, tag: 'fuel' })
  }
  return items
})

async function ask(q: string) {
  const text = q.trim()
  if (!text || store.loading) return
  draft.value = ''
  messages.value.push({ text, mine: true, at: Date.now() })
  await store.send(text)
  const last = store.messages[store.messages.length - 1]
  messages.value.push({
    text: last?.content ?? '（无回复）',
    mine: false,
    at: Date.now(),
    insights: last?.intent ? [`intent:${last.intent}`] : [],
  })
  void scrollBottom()
}

function clearChat() { messages.value = []; store.clear() }

async function scrollBottom() {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
}

onMounted(async () => {
  void store.loadSuggestions(true)
  const [fl, fu, ru] = await Promise.all([
    getFleetCompanyDist().catch(() => [] as FleetRow[]),
    getFuelDistribution().catch(() => ({ total: 0, lowCount: 0, buckets: [] }) as FuelStat),
    getRuleTriggerStats().catch(() => [] as RuleTriggerRow[]),
  ])
  fleetRows.value = Array.isArray(fl) ? fl : []
  fuel.value = fu
  rules.value = Array.isArray(ru) ? ru : []
})
</script>

<style scoped>
.ai-wb { display: flex; flex-direction: column; gap: 18px; }
.cols { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(300px, 1fr); gap: 18px; align-items: start; }
.chat-col { display: flex; flex-direction: column; min-height: 560px; }
.chat-body { flex: 1; overflow-y: auto; max-height: 520px; padding-right: 4px; margin-bottom: 14px; }
.typing { display: inline-block; padding: 8px 14px; border-radius: 12px; color: #a78bfa; font-size: 13px; }
.dots { animation: blink 1.2s infinite steps(3); }
@keyframes blink { 50% { opacity: .3; } }
.side-col { display: flex; flex-direction: column; gap: 16px; }
@media (max-width: 1100px) { .cols { grid-template-columns: 1fr; } }
</style>
