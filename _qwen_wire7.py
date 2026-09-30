"""接线第七部分：PortMarker 挂 PortStatistics、useWebSocket+WebSocketMessage 挂 Simulator 页。幂等。"""
import io, os, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
SRC = 'D:/新建文件夹/java/javacode/nautix-frontend/src'

def rd(p):
    with open(os.path.join(SRC, p), encoding='utf-8') as f:
        return f.read()

def wr(p, t):
    with open(os.path.join(SRC, p), 'w', encoding='utf-8', newline='\n') as f:
        f.write(t)

log = []

# ---------- PortStatistics.vue：港口散点图用 PortMarker ----------
t = rd('components/port/PortStatistics.vue')
if 'PortMarker' not in t:
    # template: add scatter svg after first panel section end; find '</template>' of root and insert before final closing div
    i = t.find('<template>')
    j = t.find('</template>')
    seg = t[i:j]
    k = seg.rfind('</div>')
    new_seg = seg[:k] + """
      <div class="ps-scatter nx-panel">
        <div class="ps-scatter-title">港口分布（SVG 投影）</div>
        <svg viewBox="0 0 1000 600" class="ps-scatter-svg">
          <rect width="1000" height="600" fill="#081426" rx="12" />
          <g stroke="rgba(56,189,248,0.10)" stroke-width="0.6">
            <line v-for="i in 10" :key="'v'+i" :x1="(i-1)*100" y1="0" :x2="(i-1)*100" y2="600" />
            <line v-for="i in 6" :key="'h'+i" x1="0" :y1="(i-1)*120" x2="1000" :y2="(i-1)*120" />
          </g>
          <PortMarker
            v-for="p in scatterPorts"
            :key="p.id"
            :port="p"
            :x="projX(p.longitude)"
            :y="projY(p.latitude)"
            :size="7"
            :show-label="scatterPorts.length <= 40"
          />
        </svg>
        <div class="ps-scatter-sub">{{ scatterPorts.length }} / {{ ports.length }} 个港口（有坐标者）</div>
      </div>
    """ + seg[k:]
    t = t[:i] + new_seg + t[j:]
    # script additions
    t = t.replace("import { computed", "import PortMarker from '@/components/port/PortMarker.vue'\nimport { computed", 1)
    anchor = None
    for cand in ['const loading = ref(false)', 'const rows = ref<Port[]>([])']:
        if cand in t:
            anchor = cand
            break
    assert anchor, 'no script anchor in PortStatistics'
    t = t.replace(anchor, anchor + """

/** 散点投影：经度 -180..180 → 0..1000，纬度 84..-72 → 0..600 */
function projX(lon?: number | null): number {
  return lon == null ? -999 : ((lon + 180) / 360) * 1000
}
function projY(lat?: number | null): number {
  return lat == null ? -999 : ((84 - lat) / 156) * 600
}""", 1)
    wr('components/port/PortStatistics.vue', t)
    log.append('mount PortMarker into PortStatistics scatter (need ports var check)')
else:
    log.append('skip PortStatistics')

# ---------- views/simulator/Simulator.vue：接入 useWebSocket + WebSocketMessage ----------
t = rd('views/simulator/Simulator.vue')
if 'useWebSocket' not in t:
    lines = t.split('\n')
    for k, ln in enumerate(lines):
        if ln.startswith('import'):
            lines.insert(k + 1, "import { useWebSocket } from '@/hooks/useWebSocket'\nimport type { WebSocketMessage } from '@/types/WebSocketMessage'")
            break
    t = '\n'.join(lines)
    # add ws state near other refs; find a stable anchor
    anchor = None
    for cand in ['onMounted(', 'const loading = ref(false)']:
        if cand in t:
            anchor = cand
            break
    block = """/* ---- 实时推送通道（后端当前未开 WS，自动重连静默待命；收到 runtime 推送时刷新列表） ---- */
const wsUrl = () => (import.meta.env.VITE_WS_URL as string | undefined) ?? 'ws://localhost:1910/ws/runtime'
const { connected: wsConnected, on: wsOn } = useWebSocket(wsUrl)
wsOn('message', (ev: MessageEvent) => {
  try {
    const msg = JSON.parse(String(ev.data)) as WebSocketMessage
    if (msg.type === 'runtime') void reload?.()
  } catch {
    /* 非 JSON 帧忽略 */
  }
})

"""
    idx = t.find(anchor) if anchor else -1
    if idx >= 0:
        t = t[:idx] + block + t[idx:]
        # surface badge in template header
        ti = t.find('<template>')
        tj = t.find('</template>')
        seg = t[ti:tj]
        kj = seg.find('</div>', seg.find('nx-page-desc')) if 'nx-page-desc' in seg else seg.find('</div>')
        if kj > 0:
            seg2 = seg[:kj] + '\n        <el-tag size="small" effect="dark" round :type="wsConnected ? \'success\' : \'info\'">{{ wsConnected ? \'WS 已连接\' : \'WS 轮询降级\' }}</el-tag>\n        ' + seg[kj:]
            t = t[:ti] + seg2 + t[tj:]
    wr('views/simulator/Simulator.vue', t)
    log.append('wire useWebSocket + WebSocketMessage into Simulator.vue')
else:
    log.append('skip Simulator.vue')

print('\n'.join(log))
print('PART-G DONE')
