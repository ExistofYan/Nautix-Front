# NautiX 前端改造共享契约（所有代理必读）

## 0. 铁律
1. **只允许写分配给你的文件清单**，其他任何文件一律不碰（包括 router、MainLayout、i18n、style.css、axios.ts、api/types.ts、hooks/useChart.ts、其他组文件）。
2. **禁止运行任何构建/类型检查/安装命令**（npm run build、vue-tsc、npm install 等）——有其他代理在并行改别的文件，全局构建必然误报。写完用 Read 自查完整性即可。
3. 代码必须通过严格 TS：`noUnusedLocals`、`noUnusedParameters`、`erasableSyntaxOnly`（**禁 enum、禁 namespace、禁构造函数参数属性**）。类型枚举一律用 `const X = {...} as const` 对象。
4. **不要引入 lang.t / useLang / i18n 新 key**（i18n 字典键集受类型约束且另有任务处理）。页面文案直接硬编码中文即可（必要时中文+英文小字副标）。
5. Element Plus 组件（el-*）与全部 @element-plus/icons-vue 图标组件是**全局注册**的，模板直接用，无需 import。`<el-icon><Ship /></el-icon>` 这种写法。
6. 每个文件完整可编译：template + script setup + style scoped，不留 TODO 壳。

## 1. 请求层（真实约定）
```ts
import request from '@/api/axios'
// baseURL 已含 /api。拦截器把 response.data 直接返回 → 拿到的就是后端 body 本体。
// 分页返回 PageResult { records, total, size, current }（从 '@/api/types' import type { PageResult }）
```
`@/api/types`（live，勿改）已有：PageResult、ShipInfo、SensorConfig、SensorDict、SensorData、AlertRule、AlertRecord、AlertEvent、Port、Route、RoutePoint、WeatherRegion、ShipRuntimeStatus 等。**能用就用它，不要重复定义同名接口。**

## 2. 后端真实端点（shipsensor, localhost:1910/api）
| 端点 | 方法 | 返回 |
|---|---|---|
| /public/ping | GET | {status,timestamp} |
| /dashboard/stats | GET | {shipCount,alertCount,sensorConfigCount,weatherCount} |
| /dashboard/alert-summary | GET | [{status,count}] |
| /dashboard/ship-type-dist | GET | [{type,count}] |
| /dashboard/alert-hour-dist | GET | [{hour,count}] |
| /shipInfo/page | GET ?page&count&keyword&shipStatus&shipType&registryPort&sortField&sortOrder | PageResult\<ShipInfo\> |
| /shipInfo/all | GET | ShipInfo[] |
| /shipInfo/{id} | GET | ShipInfo |
| /runtime | GET | ShipRuntimeStatus[]（全船队实时位置/航速/航向/主机负荷/油量） |
| /runtime/{shipId} | GET | ShipRuntimeStatus |
| /route/page | GET ?page&count&keyword&startPortId&endPortId&sortField&sortOrder | PageResult\<Route\> |
| /route/{id} | GET | Route |
| /route-point | GET | RoutePoint[]（**全量**，含 routeId/pointOrder/lat/lng，前端按 routeId 分组） |
| /port/page, /port/all, /port/{id} | GET | Port / PageResult\<Port\> / Port |
| /weather | GET | WeatherRegion[] |
| /sensorData/page | GET ?page&size&shipId&startTime&endTime | PageResult\<SensorData\> |
| /sensorData/list | GET | SensorData[] |
| /sensorData/trend?limit=60 | GET | SensorData[] |
| /sensorData/volatility?scan=300000 | GET | [{configId,cnt,stdDev,mean}] |
| /sensorConfig/list | GET ?page&count&shipId&typeId&sensorName&status | PageResult\<SensorConfig\> |
| /sensorConfig | GET | SensorConfig[] |
| /sensorDict/list | GET | SensorDict[] |
| /alertRecord/page | GET ?page&size&shipId&handleStatus | PageResult\<AlertRecord\> |
| /alertRecord/list | GET | AlertRecord[] |
| /alertRule/page | GET ?page&size&ruleName&alertLevel | PageResult\<AlertRule\> |
| /alert-event | GET | AlertEvent[] |
| /sysOperationLog/page | GET ?page&count 等 | PageResult\<SysOperationLog\> |

**字段实体**：
- ShipInfo: id,shipName,imo,registryPort,shipType,buildYear,lengthOverall,beam,draft,displacement,mainEngineModel,sailingSpeed,shipyardBuilder,operatingCompany,surveyValidDate
- ShipRuntimeStatus: shipId,sailingStatus,latitude,longitude,speed,heading,engineLoad,fuelPercent,weatherId,lastUpdate
- Route: id,routeName,startPortId,endPortId,distanceNm,description
- RoutePoint: id,routeId,pointOrder,latitude,longitude
- WeatherRegion: id,regionName,airTemperature,seaTemperature,humidity,pressure,windSpeed,windDirection,waveHeight,weatherType,updateTime
- SensorData: id,configId,shipId,dataValue,recordedAt
- SensorConfig: id,shipId,typeId,sensorName,installDate,status
- SensorDict: id,typeCode,typeName,defaultUnit
- AlertRecord: id,shipId,ruleId,triggerValue,alertTime,handleStatus(0未处理/1已处理，参考 live 的 views/alert/AlertRecords.vue)

**不存在**的后端端点：/fleet、/replay、/command、/analytics、/route/{id}/points、/weather/{id}/layers。死 api 文件里这些假端点必须重写为上面真实端点的组合（如船队=shipInfo 按 operatingCompany 分组；回放=route-point+runtime+sensorData）。

## 3. 视觉风格（深色深空玻璃，与 MainLayout/Dashboard 一致）
- 根容器 class 用 `nx-page`（style.css 全局已定义），面板用 `nx-panel`。
- CSS 变量直接用：`--nx-primary #38bdf8, --nx-cyan, --nx-blue, --nx-violet, --nx-green #34d399, --nx-amber, --nx-red, --nx-bg, --nx-panel rgba(13,26,51,.72), --nx-panel-border rgba(56,189,248,.14), --nx-text #e2e8f0, --nx-text-dim #a8bdd9`
- 卡片/图标风格参考 live 的 `views/dashboard/Dashboard.vue`（读它）。
- 图表复用 hook（live，禁改）：
```ts
import { useChart, chartTheme } from '@/hooks/useChart'
const el = ref<HTMLElement>(); const { setOption } = useChart(el)
// <div ref="el" style="height:320px" /> watch 数据后 setOption(...)
```
- 加载/空态/错误：el-skeleton、el-empty、ElMessage 轻提示；请求失败 catch 后展示空态即可（后端可能未启动，不许白屏）。

## 4. 跨组引用契约（只读，不许改对方文件）
- `@/components/map/CesiumViewer.vue`（G6 维护）：无 props，emit `ready(viewer:any)`、`shipSelected(ship:ShipInfo|null)`。**当前实现是 DOM 海图查看器**，内部自持船舶点位渲染。其他组不要引用它，除非清单明示。
- `@/layouts/FullScreenLayout.vue`（G7 维护）：default slot 全屏容器。G7 的 Earth.vue 用。
- 其余一律只允许引用 live 文件与本组文件。

## 5. 数据兜底模式（统一写法）
```ts
const rows = ref<Route[]>([])
const loading = ref(false)
async function load() {
  loading.value = true
  try {
    const res = await getRoutePage({ page: 1, count: 50 })
    rows.value = res.records ?? []
  } catch { rows.value = [] }   // 静默降级，页面照常渲染空态
  finally { loading.value = false }
}
```
数值展示统一 `const fmt = (n?: number | null, d = 1) => (n == null || Number.isNaN(n) ? '--' : n.toFixed(d))`。
