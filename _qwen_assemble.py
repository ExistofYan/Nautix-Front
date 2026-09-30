import io, os
FE = 'D:/新建文件夹/java/javacode/nautix-frontend/src'

def W(rel, text):
    p = os.path.join(FE, rel.replace('/', os.sep))
    io.open(p, 'w', encoding='utf-8', newline='').write(text)
    print('WROTE', rel)

def patch(rel, old, new):
    p = os.path.join(FE, rel.replace('/', os.sep))
    t = io.open(p, encoding='utf-8').read()
    if old not in t:
        print('MISS ', rel)
        return
    io.open(p, 'w', encoding='utf-8', newline='').write(t.replace(old, new, 1))
    print('PATCH', rel)

# ============ 1. router: 新增路由块（插在 404 之前） ============
patch('router/index.ts',
"""    {
      path: '/system/logs',
      name: 'system-logs',
      component: () => import('@/views/system/Logs.vue'),
      meta: { title: 'Operation Logs', titleZh: '操作日志' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },""",
"""    {
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
      meta: { title: 'Digital Earth', titleZh: '数字地球' },
      fullscreen: true,
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
      meta: { title: 'Command Center', titleZh: '指挥中心' },
      fullscreen: true,
    },
    {
      path: '/command/kpi',
      name: 'command-kpi',
      component: () => import('@/views/command/KPI.vue'),
      meta: { title: 'KPI Wall', titleZh: 'KPI 大屏' },
      fullscreen: true,
    },
    {
      path: '/command/emergency',
      name: 'command-emergency',
      component: () => import('@/views/command/Emergency.vue'),
      meta: { title: 'Emergency', titleZh: '应急指挥' },
      fullscreen: true,
    },
    {
      path: '/command/traffic',
      name: 'command-traffic',
      component: () => import('@/views/command/TrafficCenter.vue'),
      meta: { title: 'Traffic Center', titleZh: '交通中心' },
      fullscreen: true,
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },""")

# ============ 2. MainLayout 菜单：新增分组 ============
patch('layouts/MainLayout.vue',
"""          <el-menu-item index="/analytics">
            <el-icon><DataAnalysis /></el-icon>
            <template #title>{{ lang.t('nav.analytics') }}</template>
          </el-menu-item>""",
"""          <el-menu-item index="/analytics">
            <el-icon><DataAnalysis /></el-icon>
            <template #title>{{ lang.t('nav.analytics') }}</template>
          </el-menu-item>

          <el-sub-menu index="replay">
            <template #title>
              <el-icon><VideoCamera /></el-icon>
              <span>回放与航线</span>
            </template>
            <el-menu-item index="/replay">航迹工作台</el-menu-item>
            <el-menu-item index="/replay/ship">单船回放</el-menu-item>
            <el-menu-item index="/replay/sensor">传感器回放</el-menu-item>
            <el-menu-item index="/route/replay">航线回放</el-menu-item>
            <el-menu-item index="/route/animation">航线动画</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="fleet">
            <template #title>
              <el-icon><Grid /></el-icon>
              <span>船队管理</span>
            </template>
            <el-menu-item index="/fleet">船队总览</el-menu-item>
            <el-menu-item index="/fleet/map">船队态势</el-menu-item>
            <el-menu-item index="/fleet/report">船队报告</el-menu-item>
            <el-menu-item index="/fleet/mission">任务规划</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="alert-extra">
            <template #title>
              <el-icon><WarnTriangleFilled /></el-icon>
              <span>告警分析</span>
            </template>
            <el-menu-item index="/alert/overview">告警总览</el-menu-item>
            <el-menu-item index="/alert/analysis">规则分析</el-menu-item>
            <el-menu-item index="/alert/statistics">告警统计</el-menu-item>
            <el-menu-item index="/alert/map">告警分布</el-menu-item>
            <el-menu-item index="/alert/history">告警历史</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="sensor-extra">
            <template #title>
              <el-icon><TrendCharts /></el-icon>
              <span>传感分析</span>
            </template>
            <el-menu-item index="/sensor/center">传感中心</el-menu-item>
            <el-menu-item index="/sensor/analysis">多维分析</el-menu-item>
            <el-menu-item index="/sensor/anomaly">异常检测</el-menu-item>
            <el-menu-item index="/sensor/correlation">关联矩阵</el-menu-item>
            <el-menu-item index="/sensor/history">历史数据</el-menu-item>
          </el-sub-menu>

          <el-menu-item index="/system">
            <el-icon><Monitor /></el-icon>
            <template #title>系统监控</template>
          </el-menu-item>

          <el-menu-item index="/earth">
            <el-icon><Apple /></el-icon>
            <template #title>数字地球</template>
          </el-menu-item>

          <el-menu-item index="/command">
            <el-icon><Aim /></el-icon>
            <template #title>指挥中心</template>
          </el-menu-item>""")

print('DONE')
