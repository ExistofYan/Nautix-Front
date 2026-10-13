"""接线第七部分修正版：PortMarker 挂 PortStatistics、useWebSocket+WebSocketMessage 挂 Simulator。幂等。"""
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

# ---------- PortStatistics.vue ----------
t = rd('components/port/PortStatistics.vue')
if 'PortMarker' not in t:
    old = """    </template>
    <el-empty v-else description="暂无港口数据" :image-size="70" />"""
    if old not in t:
        # match actual mojibake-safe anchors by structure
        old = None
    # structural approach: insert scatter block before the closing of v-else-if template (line with '</template>' followed by el-empty)
    lines = t.split('\n')
    ins_at = None
    for i, ln in enumerate(lines):
        if '<el-empty' in ln and 'v-else' in ln:
            ins_at = i
            break
    assert ins_at is not None, 'el-empty anchor missing'
    scatter = """      <div class="ps-scatter">
        <div class="ps-scatter-title">港口分布（SVG 投影）</div>
        <svg viewBox="0 0 1000 600" class="ps-scatter-svg">
          <rect width="1000" height="600" fill="#081426" rx="12" />
          <g stroke="rgba(56,189,248,0.10)" stroke-width="0.6">
            <line v-for="i in 10" :key="'v'+i" :x1="(i-1)*100" y1="0" :x2="(i-1)*100" y2="600" />
            <line v-for="i in 6" :key="'h'+i" x1="0" :y1="(i-1)*120" x2="1000" :y2="(i-1)*120" />
          </g>
          <PortMarker
            v-for="p in ports.filter(x => x.longitude != null && x.latitude != null)"
            :key="p.id"
            :port="p"
            :x="projX(p.longitude)"
            :y="projY(p.latitude)"
            :size="7"
            :show-label="ports.length <= 40"
          />
        </svg>
      </div>
"""
    lines.insert(ins_at, scatter.rstrip('\n'))
    t = '\n'.join(lines)
    t = t.replace("import { usePortStore } from '@/stores/port'",
                  "import { usePortStore } from '@/stores/port'\nimport PortMarker from '@/components/port/PortMarker.vue'", 1)
    t = t.replace("const ports = computed(() => store.ports)",
                  """const ports = computed(() => store.ports)

/** 散点投影：经度 -180..180 → 0..1000，纬度 84..-72 → 0..600 */
function projX(lon?: number | null): number {
  return lon == null ? -999 : ((lon + 180) / 360) * 1000
}
function projY(lat?: number | null): number {
  return lat == null ? -999 : ((84 - lat) / 156) * 600
}""", 1)
    # styles append before </style>
    t = t.replace('</style>', """.ps-scatter { margin-top: 14px; }
.ps-scatter-title { font-size: 12.5px; color: var(--nx-text-dim, #a8bdd9); margin-bottom: 6px; }
.ps-scatter-svg { width: 100%; height: auto; display: block; border-radius: 12px; }
</style>""", 1)
    wr('components/port/PortStatistics.vue', t)
    log.append('mount PortMarker into PortStatistics scatter')
else:
    log.append('skip PortStatistics')

# ---------- views/simulator/Simulator.vue ----------
t = rd('views/simulator/Simulator.vue')
if 'useWebSocket' not in t:
    lines = t.split('\n')
    for k, ln in enumerate(lines):
        if ln.startswith('import'):
            lines.insert(k + 1, "import { useWebSocket } from '@/hooks/useWebSocket'\nimport type { WebSocketMessage } from '@/types/WebSocketMessage'")
            break
    t = '\n'.join(lines)
    block = """/* ---- 实时推送通道（后端未开 WS 时自动重连静默待命；收到 runtime 推送即刷新） ---- */
const wsUrl = () => ((import.meta.env.VITE_WS_URL as string | undefined) ?? 'ws://localhost:1910/ws/runtime')
const { connected: wsConnected, on: wsOn } = useWebSocket(wsUrl)
wsOn('message', (ev: MessageEvent) => {
  try {
    const msg = JSON.parse(String(ev.data)) as WebSocketMessage
    if (msg.type === 'runtime') void reload()
  } catch {
    /* 非 JSON 帧忽略 */
  }
})

"""
    idx = t.find('onMounted(')
    assert idx > 0, 'Simulator onMounted anchor missing'
    t = t[:idx] + block + t[idx:]
    # badge in header desc
    ti = t.find('<template>')
    tj = t.find('</template>')
    seg = t[ti:tj]
    kj = seg.find('</div>')
    if kj > 0:
        seg2 = seg[:kj] + '\n      <el-tag size="small" effect="dark" round :type="wsConnected ? \'success\' : \'info\'">{{ wsConnected ? \'WS 已连接\' : \'WS 轮询降级\' }}</el-tag>\n      ' + seg[kj:]
        t = t[:ti] + seg2 + t[tj:]
    wr('views/simulator/Simulator.vue', t)
    log.append('wire useWebSocket + WebSocketMessage into Simulator.vue')
else:
    log.append('skip Simulator.vue')

print('\n'.join(log))
print('PART-G2 DONE')
