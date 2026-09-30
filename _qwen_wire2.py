"""接线第二部分：RouteTimeline/港口看板/SensorCard/LogViewer/hooks/types/ClassicWorkspace/stores 索引。幂等。"""
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

# ---------- RouteDetail.vue：途经点时间线 ----------
try:
    t = rd('views/route/RouteDetail.vue')
    if 'RouteTimeline' not in t:
        old = "import { useRoute } from 'vue-router'"
        assert old in t
        t = t.replace(old, old + "\nimport RouteTimeline from '@/components/route/RouteTimeline.vue'", 1)
        # template insertion after header block
        anchor = '</div>'
        i = t.find('<template>')
        j = t.find('</template>')
        seg = t[i:j]
        ins_at = seg.rfind('</div>', 0, seg.find('nx-panel')) if 'nx-panel' in seg else -1
        # simpler: insert before the last closing div of template root
        k = seg.rfind('</div>')
        new_seg = seg[:k] + """
    <GlassPanel title="途经点" class="rd-timeline">
      <RouteTimeline :points="points" />
    </GlassPanel>
    """ + seg[k:]
        t = t[:i] + new_seg + t[j:]
        t = t.replace("import RouteTimeline from '@/components/route/RouteTimeline.vue'",
                      "import RouteTimeline from '@/components/route/RouteTimeline.vue'\nimport GlassPanel from '@/components/layout/GlassPanel.vue'", 1)
        wr('views/route/RouteDetail.vue', t)
        log.append('edit views/route/RouteDetail.vue: +RouteTimeline(途经点)+GlassPanel')
    else:
        log.append('skip RouteDetail (timeline present)')
except Exception as e:
    log.append(f'SKIP RouteDetail error: {e}')

# ---------- Port.vue：港口看板（PortCard 网格 + PortDetail 抽屉） ----------
try:
    t = rd('views/port/Port.vue')
    if 'PortCard' not in t:
        t = t.replace("import PortConnection from '@/components/port/PortConnection.vue'",
                      "import PortConnection from '@/components/port/PortConnection.vue'\nimport PortCard from '@/components/port/PortCard.vue'\nimport PortDetail from '@/components/port/PortDetail.vue'", 1)
        t = t.replace("import type { Port } from '@/api/types'",
                      "import type { Port } from '@/api/types'\nimport { usePortStore } from '@/stores/port'\nimport { useWeatherStore } from '@/stores/weather'", 1)
        # script additions at end before onMounted(reload)
        t = t.replace('onMounted(reload)', """const portStore = usePortStore()
const weatherStore = useWeatherStore()
const boardOpen = ref(false)
const boardPort = ref<Port | null>(null)

async function openBoard(p: Port) {
  boardPort.value = p
  boardOpen.value = true
}

onMounted(() => {
  reload()
  void portStore.load()
  void weatherStore.load()
})""", 1)
        # template: insert board section right after <PortStatistics /> line region — place before </template> root close
        idx = t.find('<PortStatistics')
        assert idx > 0
        end_line = t.find('\n', idx)
        board_tpl = """
    <div class="nx-panel board-section">
      <div class="board-head">
        <h3 class="board-title">港口看板</h3>
        <span class="board-sub">共 {{ portStore.ports.length }} 个港口 · 天气缓存 {{ weatherStore.regions.length }} 区</span>
      </div>
      <div v-if="portStore.loading" class="board-loading"><el-skeleton :rows="2" animated /></div>
      <div v-else class="board-grid">
        <PortCard v-for="p in portStore.ports.slice(0, 12)" :key="p.id" :port="p" @click="openBoard(p)" />
      </div>
    </div>
    <PortDetail :port="boardPort" v-model:visible="boardOpen" />"""
        t = t[:end_line + 1] + board_tpl + t[end_line + 1:]
        t = t.replace('.empty-state {', """.board-section { margin-top: 16px; padding: 14px 16px; }
.board-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 10px; }
.board-title { font-size: 15px; color: var(--nx-text); margin: 0; }
.board-sub { font-size: 12px; color: var(--nx-text-dim); }
.board-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.board-loading { padding: 12px; }
.empty-state {""", 1)
        wr('views/port/Port.vue', t)
        log.append('edit views/port/Port.vue: +港口看板(PortCard/PortDetail/port store/weather store)')
    else:
        log.append('skip Port.vue (board present)')
except Exception as e:
    log.append(f'SKIP Port error: {e}')

# ---------- Sensor.vue：列表模式 SensorCard ----------
try:
    t = rd('views/sensor/Sensor.vue')
    if 'SensorCard' not in t:
        t = t.replace("import RPMChart from '@/components/sensor/RPMChart.vue'",
                      "import RPMChart from '@/components/sensor/RPMChart.vue'\nimport SensorCard from '@/components/sensor/SensorCard.vue'\nimport { useSensorStore } from '@/stores/sensor'", 1)
        t = t.replace("""          <SensorDashboard />""",
                      """          <SensorDashboard />
          <div class="sc-list">
            <div class="sc-list-title">传感器清单（点击卡片查看详情）</div>
            <div class="sc-list-grid">
              <SensorCard
                v-for="c in sensorStore.configs.slice(0, 12)"
                :key="c.id"
                :config="c"
                :selected="selectedId === c.id"
                @select="(cfg) => onSelect(cfg)"
              />
            </div>
          </div>""", 1)
        t = t.replace('const selectedId = ref<number>()',
                      'const selectedId = ref<number>()\nconst sensorStore = useSensorStore()\nsensorStore.ensureLoaded()', 1)
        # styles
        t = t.replace('@media', """.sc-list { margin-top: 4px; }
.sc-list-title { font-size: 13px; color: var(--nx-text-dim); margin-bottom: 8px; }
.sc-list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; }
@media""", 1)
        wr('views/sensor/Sensor.vue', t)
        log.append('edit views/sensor/Sensor.vue: +SensorCard 列表+useSensorStore')
    else:
        log.append('skip Sensor.vue (cards present)')
except Exception as e:
    log.append(f'SKIP Sensor error: {e}')

# ---------- System.vue：操作日志流 LogViewer ----------
try:
    t = rd('views/system/System.vue')
    if 'LogViewer' not in t:
        t = t.replace("import QueueMonitor from '@/components/system/QueueMonitor.vue'",
                      "import QueueMonitor from '@/components/system/QueueMonitor.vue'\nimport LogViewer from '@/components/system/LogViewer.vue'", 1)
        t = t.replace('    </div>\n  </div>\n</template>', """    </div>

    <div class="nx-panel logs-block">
      <div class="logs-title">操作日志流</div>
      <LogViewer />
    </div>
  </div>
</template>""", 1)
        t = t.replace('.sys-home {', '.logs-block { padding: 14px 16px; }\n.logs-title { font-size: 14px; color: var(--nx-text); margin-bottom: 10px; }\n.sys-home {', 1)
        wr('views/system/System.vue', t)
        log.append('edit views/system/System.vue: +LogViewer 区块')
    else:
        log.append('skip System.vue')
except Exception as e:
    log.append(f'SKIP System error: {e}')

# ---------- AlertStatistics.vue：改用 hooks/useAlert ----------
try:
    t = rd('views/alert/AlertStatistics.vue')
    if 'hooks/useAlert' not in t:
        t = t.replace("import { useAlertStore } from '@/stores/alert'",
                      "import { useAlert } from '@/hooks/useAlert'", 1)
        t = t.replace('const store = useAlertStore()', 'const { store } = useAlert()', 1)
        wr('views/alert/AlertStatistics.vue', t)
        log.append('edit views/alert/AlertStatistics.vue: useAlertStore -> hooks/useAlert')
    else:
        log.append('skip AlertStatistics')
except Exception as e:
    log.append(f'SKIP AlertStatistics error: {e}')

# ---------- SensorHistory.vue：增补 useSensor 计数徽章 ----------
try:
    t = rd('views/sensor/SensorHistory.vue')
    if 'hooks/useSensor' not in t:
        t = t.replace("import { useSensorStore } from '@/stores/sensor'",
                      "import { useSensorStore } from '@/stores/sensor'\nimport { useSensor } from '@/hooks/useSensor'", 1)
        t = t.replace('const sensorStore = useSensorStore()',
                      'const sensorStore = useSensorStore()\nconst { sensorCount } = useSensor()', 1)
        # surface count in header desc
        i = t.find('nx-page-desc')
        assert i > 0
        j = t.find('</p>', i)
        t = t[:j] + ' · 已接入传感器 {{ sensorCount }} 台' + t[j:]
        wr('views/sensor/SensorHistory.vue', t)
        log.append('edit views/sensor/SensorHistory.vue: +useSensor 计数')
    else:
        log.append('skip SensorHistory')
except Exception as e:
    log.append(f'SKIP SensorHistory error: {e}')

print('\n'.join(log))
print('PART-B DONE')
