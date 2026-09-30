<template>
  <el-drawer
    :model-value="!!ship"
    :size="drawerSize"
    direction="rtl"
    :with-header="false"
    class="ship-drawer"
    @close="$emit('close')"
  >
    <ShipDetail v-if="ship" :ship="ship" />
  </el-drawer>
</template>

<script setup lang="ts">
/** 船舶详情抽屉：el-drawer 包装 ShipDetail，props.ship 为空即关闭 */
import { computed } from 'vue'
import type { ShipInfo } from '@/api/types'
import ShipDetail from './ShipDetail.vue'

const props = defineProps<{
  ship?: ShipInfo | null
  size?: number | string
}>()

defineEmits<{ (e: 'close'): void }>()

const drawerSize = computed(() =>
  typeof props.size === 'number' ? `${props.size}px` : props.size ?? '420px',
)
</script>

<style>
.ship-drawer .el-drawer__body {
  padding: 16px;
  background: var(--nx-bg, #060d1f);
}
</style>
