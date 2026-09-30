import { createRouter, createWebHistory } from 'vue-router'
import { tokenExpired } from '@/api/axios'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 公开路由（无需登录）
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/Login.vue'),
      meta: { title: 'Login', public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/Register.vue'),
      meta: { title: 'Register', public: true },
    },

    // 受保护路由（需要登录）；meta.title=英文，meta.titleZh=中文
    { path: '/', redirect: '/dashboard' },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/dashboard/Dashboard.vue'),
      meta: { title: 'Dashboard', titleZh: '仪表盘' },
    },
    {
      path: '/ship',
      name: 'ship',
      component: () => import('@/views/ship/Ship.vue'),
      meta: { title: 'Ship Management', titleZh: '船舶管理' },
    },
    {
      path: '/sensor/realtime',
      name: 'sensor-realtime',
      component: () => import('@/views/sensor/SensorRealtime.vue'),
      meta: { title: 'Sensor Realtime Data', titleZh: '传感器实时数据' },
    },
    {
      path: '/sensor/config',
      name: 'sensor-config',
      component: () => import('@/views/sensor/SensorConfig.vue'),
      meta: { title: 'Sensor Configuration', titleZh: '传感器配置' },
    },
    {
      path: '/sensor/dict',
      name: 'sensor-dict',
      component: () => import('@/views/sensor/SensorDictionary.vue'),
      meta: { title: 'Sensor Dictionary', titleZh: '传感器字典' },
    },
    {
      path: '/alert/records',
      name: 'alert-records',
      component: () => import('@/views/alert/AlertRecords.vue'),
      meta: { title: 'Alert Records', titleZh: '告警记录' },
    },
    {
      path: '/alert/rules',
      name: 'alert-rules',
      component: () => import('@/views/alert/AlertRules.vue'),
      meta: { title: 'Alert Rules', titleZh: '告警规则' },
    },
    {
      path: '/route',
      name: 'route-manage',
      component: () => import('@/views/route/Route.vue'),
      meta: { title: 'Route Management', titleZh: '航线管理' },
    },
    {
      path: '/port',
      name: 'port',
      component: () => import('@/views/port/Port.vue'),
      meta: { title: 'Port Management', titleZh: '港口管理' },
    },
    {
      path: '/weather',
      name: 'weather',
      component: () => import('@/views/weather/Weather.vue'),
      meta: { title: 'Weather Monitor', titleZh: '天气监测' },
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: () => import('@/views/analytics/Analytics.vue'),
      meta: { title: 'Analytics Center', titleZh: '分析中心' },
    },
    {
      path: '/system/logs',
      name: 'system-logs',
      component: () => import('@/views/system/Logs.vue'),
      meta: { title: 'Operation Logs', titleZh: '操作日志' },
    },

    // ---------- 航线分析（盘活模块） ----------
    {
      path: '/route/detail/:id',
      name: 'route-detail',
      component: () => import('@/views/route/RouteDetail.vue'),
      meta: { title: 'Route Detail', titleZh: '航线详情' },
    },
    {
      path: '/route/stats/:id',
      name: 'route-stats',
      component: () => import('@/views/route/RouteStatistics.vue'),
      meta: { title: 'Route Statistics', titleZh: '航线统计' },
    },
    {
      path: '/route/replay',
      name: 'route-replay',
      component: () => import('@/views/route/RouteReplay.vue'),
      meta: { title: 'Route Replay', titleZh: '航线回放' },
    },
    {
      path: '/route/replay/:id',
      name: 'route-replay-id',
      component: () => import('@/views/route/RouteReplay.vue'),
      meta: { title: 'Route Replay', titleZh: '航线回放' },
    },
    {
      path: '/route/animation',
      name: 'route-animation',
      component: () => import('@/views/route/RouteAnimation.vue'),
      meta: { title: 'Route Animation', titleZh: '航线动画' },
    },

    // ---------- 航迹回放工作台 ----------
    {
      path: '/workspace',
      name: 'workspace',
      component: () => import('@/views/workspace/ClassicWorkspace.vue'),
      meta: { title: 'Classic Workspace', titleZh: '效率工作台' },
    },
    {
      path: '/replay/player',
      name: 'replay-player',
      component: () => import('@/views/replay/ReplayPlayer.vue'),
      meta: { title: 'Replay Workbench', titleZh: '回放工作台' },
    },
    {
      path: '/replay/route/:id',
      name: 'replay-route-id',
      component: () => import('@/views/replay/RouteReplay.vue'),
      meta: { title: 'Route Replay Detail', titleZh: '航线回放详情' },
    },
    {
      path: '/replay',
      name: 'replay',
      component: () => import('@/views/replay/Replay.vue'),
      meta: { title: 'Track Replay', titleZh: '航迹回放' },
    },
    {
      path: '/replay/ship',
      name: 'replay-ship',
      component: () => import('@/views/replay/ShipReplay.vue'),
      meta: { title: 'Ship Replay', titleZh: '单船回放' },
    },
    {
      path: '/replay/sensor',
      name: 'replay-sensor',
      component: () => import('@/views/replay/SensorReplay.vue'),
      meta: { title: 'Sensor Replay', titleZh: '传感器回放' },
    },

    // ---------- 智能问答台 ----------
    {
      path: '/ai',
      name: 'ai-workbench',
      component: () => import('@/views/ai/AIWorkbench.vue'),
      meta: { title: 'AI Workbench', titleZh: '智能问答台' },
    },

    // ---------- 告警分析 ----------
    {
      path: '/alert/overview',
      name: 'alert-overview',
      component: () => import('@/views/alert/Alert.vue'),
      meta: { title: 'Alert Overview', titleZh: '告警总览' },
    },
    {
      path: '/alert/analysis',
      name: 'alert-analysis',
      component: () => import('@/views/alert/AlertAnalysis.vue'),
      meta: { title: 'Alert Analysis', titleZh: '告警分析' },
    },
    {
      path: '/alert/history',
      name: 'alert-history',
      component: () => import('@/views/alert/AlertHistory.vue'),
      meta: { title: 'Alert History', titleZh: '告警历史' },
    },
    {
      path: '/alert/statistics',
      name: 'alert-statistics',
      component: () => import('@/views/alert/AlertStatistics.vue'),
      meta: { title: 'Alert Statistics', titleZh: '告警统计' },
    },
    {
      path: '/alert/map',
      name: 'alert-map',
      component: () => import('@/views/alert/AlertMap.vue'),
      meta: { title: 'Alert Map', titleZh: '告警分布' },
    },

    // ---------- 传感器分析 ----------
    {
      path: '/sensor/center',
      name: 'sensor-center',
      component: () => import('@/views/sensor/Sensor.vue'),
      meta: { title: 'Sensor Center', titleZh: '传感中心' },
    },
    {
      path: '/sensor/analysis',
      name: 'sensor-analysis',
      component: () => import('@/views/sensor/SensorAnalysis.vue'),
      meta: { title: 'Sensor Analysis', titleZh: '传感器分析' },
    },
    {
      path: '/sensor/anomaly',
      name: 'sensor-anomaly',
      component: () => import('@/views/sensor/SensorAnomaly.vue'),
      meta: { title: 'Sensor Anomaly', titleZh: '异常检测' },
    },
    {
      path: '/sensor/correlation',
      name: 'sensor-correlation',
      component: () => import('@/views/sensor/SensorCorrelation.vue'),
      meta: { title: 'Sensor Correlation', titleZh: '关联分析' },
    },
    {
      path: '/sensor/history',
      name: 'sensor-history',
      component: () => import('@/views/sensor/SensorHistory.vue'),
      meta: { title: 'Sensor History', titleZh: '历史数据' },
    },

    // ---------- 船队管理 ----------
    {
      path: '/fleet',
      name: 'fleet',
      component: () => import('@/views/fleet/Fleet.vue'),
      meta: { title: 'Fleet', titleZh: '船队管理' },
    },
    {
      path: '/fleet/map/:company?',
      name: 'fleet-map',
      component: () => import('@/views/fleet/FleetMap.vue'),
      meta: { title: 'Fleet Map', titleZh: '船队态势' },
    },
    {
      path: '/fleet/report',
      name: 'fleet-report',
      component: () => import('@/views/fleet/FleetReport.vue'),
      meta: { title: 'Fleet Report', titleZh: '船队报告' },
    },
    {
      path: '/fleet/mission',
      name: 'fleet-mission',
      component: () => import('@/views/fleet/Mission.vue'),
      meta: { title: 'Mission Planner', titleZh: '任务规划' },
    },

    // ---------- 分析子页 ----------
    {
      path: '/analytics/fleet',
      name: 'analytics-fleet',
      component: () => import('@/views/analytics/FleetAnalytics.vue'),
      meta: { title: 'Fleet Analytics', titleZh: '船队分析' },
    },
    {
      path: '/analytics/fuel',
      name: 'analytics-fuel',
      component: () => import('@/views/analytics/FuelAnalytics.vue'),
      meta: { title: 'Fuel Analytics', titleZh: '燃油分析' },
    },
    {
      path: '/analytics/sensor',
      name: 'analytics-sensor',
      component: () => import('@/views/analytics/SensorAnalytics.vue'),
      meta: { title: 'Sensor Analytics', titleZh: '传感分析' },
    },
    {
      path: '/analytics/ship',
      name: 'analytics-ship',
      component: () => import('@/views/analytics/ShipAnalytics.vue'),
      meta: { title: 'Ship Analytics', titleZh: '船舶分析' },
    },
    {
      path: '/analytics/report',
      name: 'analytics-report',
      component: () => import('@/views/analytics/Report.vue'),
      meta: { title: 'Report', titleZh: '综合报表' },
    },

    // ---------- 系统监控 ----------
    {
      path: '/system',
      name: 'system',
      component: () => import('@/views/system/System.vue'),
      meta: { title: 'System Monitor', titleZh: '系统监控' },
    },
    {
      path: '/system/cache',
      name: 'system-cache',
      component: () => import('@/views/system/Cache.vue'),
      meta: { title: 'Cache', titleZh: '缓存明细' },
    },
    {
      path: '/system/pipeline',
      name: 'system-pipeline',
      component: () => import('@/views/system/Pipeline.vue'),
      meta: { title: 'Data Pipeline', titleZh: '数据管道' },
    },
    {
      path: '/system/simulator',
      name: 'system-simulator',
      component: () => import('@/views/system/SimulatorMonitor.vue'),
      meta: { title: 'Simulator', titleZh: '模拟器监控' },
    },

    // ---------- 数字地球 / 模拟器 / 指挥大屏（全屏，脱离主布局） ----------
    {
      path: '/earth',
      name: 'earth',
      component: () => import('@/views/earth/Earth.vue'),
      meta: { title: 'Digital Earth', titleZh: '数字地球', fullscreen: true },
    },
    {
      path: '/simulator',
      name: 'simulator',
      component: () => import('@/views/simulator/Simulator.vue'),
      meta: { title: 'Simulator Console', titleZh: '模拟器控制台' },
    },
    {
      path: '/command',
      name: 'command',
      component: () => import('@/views/command/Command.vue'),
      meta: { title: 'Command Center', titleZh: '指挥中心', fullscreen: true },
    },
    {
      path: '/command/kpi',
      name: 'command-kpi',
      component: () => import('@/views/command/KPI.vue'),
      meta: { title: 'KPI Wall', titleZh: 'KPI 大屏', fullscreen: true },
    },
    {
      path: '/command/emergency',
      name: 'command-emergency',
      component: () => import('@/views/command/Emergency.vue'),
      meta: { title: 'Emergency', titleZh: '应急指挥', fullscreen: true },
    },
    {
      path: '/command/traffic',
      name: 'command-traffic',
      component: () => import('@/views/command/TrafficCenter.vue'),
      meta: { title: 'Traffic Center', titleZh: '交通中心', fullscreen: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

// 路由守卫：检查认证状态
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const isPublicRoute = to.meta.public === true

  // 如果是公开路由（登录/注册），直接放行
  if (isPublicRoute) {
    // 如果已登录且访问登录页，重定向到首页
    if (token && (to.path === '/login' || to.path === '/register')) {
      next('/dashboard')
    } else {
      next()
    }
    return
  }

  // 如果是受保护路由，检查是否已登录
  if (!token || tokenExpired()) {
    // 未登录或登录已过期，清理失效状态并跳转登录页，
    // 重新登录后 token 刷新，各页面即可正常加载数据
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else {
    next()
  }
})

export default router
