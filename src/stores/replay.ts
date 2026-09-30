import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loadReplayFrames, loadReplayRoute } from '@/api/replay'
import type { Route } from '@/api/types'
import type { ReplayFrame, ReplaySpeed } from '@/types/replay'

/** 1x 倍速下每帧推进间隔（毫秒） */
const BASE_FRAME_MS = 900

export const useReplayStore = defineStore('replay', () => {
  const route = ref<Route | null>(null)
  const frames = ref<ReplayFrame[]>([])
  const currentIndex = ref(0)
  const playing = ref(false)
  const speed = ref<ReplaySpeed>(1)
  const loop = ref(true)
  const loading = ref(false)

  let timer: number | undefined

  const lastIndex = computed(() => Math.max(frames.value.length - 1, 0))
  const currentFrame = computed<ReplayFrame | null>(() => frames.value[currentIndex.value] ?? null)
  const frameCount = computed(() => frames.value.length)

  function stopTimer() {
    if (timer !== undefined) {
      window.clearInterval(timer)
      timer = undefined
    }
  }

  function stepOne() {
    if (currentIndex.value >= lastIndex.value) {
      if (loop.value && frames.value.length > 1) {
        currentIndex.value = 0
      } else {
        pause()
      }
      return
    }
    currentIndex.value += 1
  }

  function startTimer() {
    stopTimer()
    timer = window.setInterval(stepOne, BASE_FRAME_MS / speed.value)
  }

  async function loadRoute(routeId: number) {
    loading.value = true
    pause()
    try {
      const [meta, pts] = await Promise.all([loadReplayRoute(routeId), loadReplayFrames(routeId)])
      route.value = meta
      frames.value = pts
      currentIndex.value = 0
    } catch {
      route.value = null
      frames.value = []
      currentIndex.value = 0
    } finally {
      loading.value = false
    }
  }

  function play() {
    if (frames.value.length < 2 || playing.value) return
    playing.value = true
    startTimer()
  }

  function pause() {
    playing.value = false
    stopTimer()
  }

  function toggle() {
    playing.value ? pause() : play()
  }

  function next() {
    if (currentIndex.value < lastIndex.value) currentIndex.value += 1
  }

  function prev() {
    if (currentIndex.value > 0) currentIndex.value -= 1
  }

  function seek(index: number) {
    currentIndex.value = Math.min(Math.max(0, Math.round(index)), lastIndex.value)
  }

  function setSpeed(s: ReplaySpeed) {
    speed.value = s
    if (playing.value) startTimer()
  }

  function setLoop(v: boolean) {
    loop.value = v
  }

  return {
    route,
    frames,
    currentIndex,
    playing,
    speed,
    loop,
    loading,
    lastIndex,
    currentFrame,
    frameCount,
    loadRoute,
    play,
    pause,
    toggle,
    next,
    prev,
    seek,
    setSpeed,
    setLoop,
  }
})
