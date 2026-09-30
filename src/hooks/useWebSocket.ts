import { ref, onScopeDispose, getCurrentScope } from 'vue'

export interface UseWebSocketOptions {
  /** 心跳间隔 ms，默认 25s；0 关闭 */
  heartbeatMs?: number
  /** 心跳消息体 */
  heartbeatPayload?: unknown
  /** 重连上限次数，默认 Infinity */
  maxRetries?: number
  /** 指数退避基数 ms，默认 1000（1s,2s,4s…封顶 30s） */
  backoffBaseMs?: number
  /** 是否自动连接，默认 true */
  immediate?: boolean
}

/**
 * 通用 WebSocket hook：自动重连（指数退避）+ 心跳 + on/off 事件订阅。
 * 当前 shipsensor 后端暂无 WS 端点，本工具供实时推送类页面按需接入；
 * 连接失败会静默重试而非抛错，不影响宿主页面渲染。
 */
export function useWebSocket(url: string | (() => string), options: UseWebSocketOptions = {}) {
  const {
    heartbeatMs = 25000,
    heartbeatPayload = { type: 'ping' },
    maxRetries = Number.POSITIVE_INFINITY,
    backoffBaseMs = 1000,
    immediate = true,
  } = options

  const connected = ref(false)
  const lastError = ref<string | null>(null)
  let retries = 0
  let socket: WebSocket | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let closedByUs = false
  const listeners = new Map<string, Set<(data: unknown) => void>>()

  function emit(type: string, data: unknown) {
    listeners.get(type)?.forEach((fn) => {
      try { fn(data) } catch { /* 订阅方自兜底 */ }
    })
  }

  function clearTimers() {
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null }
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null }
  }

  function scheduleReconnect() {
    if (!closedByUs && retries < maxRetries) {
      retries += 1
      const delay = Math.min(30000, backoffBaseMs * 2 ** (retries - 1))
      retryTimer = setTimeout(connect, delay)
    }
  }

  function connect() {
    closedByUs = false
    try {
      socket?.close()
    } catch { /* ignore */ }
    const target = typeof url === 'function' ? url() : url
    try {
      socket = new WebSocket(target)
    } catch (e) {
      lastError.value = String(e)
      scheduleReconnect()
      return
    }
    socket.onopen = () => {
      connected.value = true
      lastError.value = null
      retries = 0
      if (heartbeatMs > 0) {
        heartbeatTimer = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            try { socket.send(JSON.stringify(heartbeatPayload)) } catch { /* ignore */ }
          }
        }, heartbeatMs)
      }
      emit('open', null)
    }
    socket.onmessage = (ev) => {
      let parsed: unknown = ev.data
      try { parsed = JSON.parse(String(ev.data)) } catch { /* 保留原始字符串 */ }
      const type =
        parsed && typeof parsed === 'object' && 'type' in parsed
          ? String((parsed as { type: unknown }).type)
          : 'message'
      emit(type, parsed)
      emit('message', parsed)
    }
    socket.onerror = () => {
      lastError.value = `ws error @ ${new Date().toISOString()}`
    }
    socket.onclose = () => {
      connected.value = false
      clearTimers()
      emit('close', null)
      scheduleReconnect()
    }
  }

  function send(payload: unknown): boolean {
    if (socket?.readyState === WebSocket.OPEN) {
      try {
        socket.send(typeof payload === 'string' ? payload : JSON.stringify(payload))
        return true
      } catch { return false }
    }
    return false
  }

  function on(type: string, fn: (data: unknown) => void) {
    if (!listeners.has(type)) listeners.set(type, new Set())
    listeners.get(type)!.add(fn)
  }

  function off(type: string, fn: (data: unknown) => void) {
    listeners.get(type)?.delete(fn)
  }

  function close() {
    closedByUs = true
    clearTimers()
    try { socket?.close() } catch { /* ignore */ }
    socket = null
    connected.value = false
  }

  if (immediate) connect()
  if (getCurrentScope()) onScopeDispose(close)

  return { connected, lastError, connect, close, send, on, off }
}
