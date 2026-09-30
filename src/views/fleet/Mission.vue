<template>
  <div class="mission-page nx-page">
    <div class="cols">
      <MissionPlanner @update:missions="missions = $event" />
      <MissionTimeline :missions="missions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MissionPlanner from '@/components/fleet/MissionPlanner.vue'
import MissionTimeline from '@/components/fleet/MissionTimeline.vue'
import type { Mission } from '@/types/fleet'

const missions = ref<Mission[]>([])
</script>

<style scoped>
.mission-page { display: flex; flex-direction: column; gap: 18px; }
.cols { display: grid; grid-template-columns: minmax(320px, 420px) 1fr; gap: 18px; align-items: start; }
@media (max-width: 960px) {
  .cols { grid-template-columns: 1fr; }
}
</style>
