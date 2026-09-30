<template>
  <div class="reco-panel nx-panel">
    <div class="r-head">
      <span class="title"><el-icon><Star /></el-icon> 智能推荐</span>
      <span class="meta">{{ items.length }} 条</span>
    </div>

    <el-empty v-if="!items.length" description="暂无推荐" :image-size="60" />
    <ul v-else class="list">
      <li v-for="(it, i) in items" :key="i" class="item" @click="$emit('pick', it)">
        <span class="rank" :class="'r' + (i + 1)">{{ i + 1 }}</span>
        <div class="main">
          <b>{{ it.title }}</b>
          <em v-if="it.desc">{{ it.desc }}</em>
        </div>
        <el-tag v-if="it.tag" size="small" effect="plain" round>{{ it.tag }}</el-tag>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
export interface RecoItem {
  title: string
  desc?: string
  tag?: string
}

defineProps<{ items: RecoItem[] }>()
defineEmits<{ (e: 'pick', item: RecoItem): void }>()
</script>

<style scoped>
.reco-panel { padding: 14px 16px; border-radius: 13px; }
.r-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.title { display: inline-flex; align-items: center; gap: 7px; color: var(--nx-text); font-weight: 700; font-size: 14px; }
.meta { font-size: 11px; color: #64748b; }
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.item { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 10px; background: rgba(9, 17, 35, 0.5); border: 1px solid transparent; cursor: pointer; transition: all 0.15s ease; }
.item:hover { border-color: rgba(125, 211, 252, 0.35); background: rgba(13, 31, 49, 0.8); }
.rank { flex: none; width: 22px; height: 22px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #94a3b8; background: rgba(148, 184, 232, 0.12); }
.rank.r1 { color: #fbbf24; background: rgba(251, 191, 36, 0.15); }
.rank.r2 { color: #cbd5e1; background: rgba(203, 213, 225, 0.12); }
.rank.r3 { color: #d97706; background: rgba(217, 119, 6, 0.12); }
.main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.main b { color: var(--nx-text); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.main em { color: #64748b; font-style: normal; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.arrow { color: #475569; flex: none; }
</style>
