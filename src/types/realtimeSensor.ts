/* 实时传感器读数（轮询 /sensorData/trend 派生） */

/** 单个传感器配置的最新读数与相对上一轮的增量 */
export interface RealtimeReading {
  configId: number
  sensorName?: string
  shipId?: number
  unit?: string
  /** 最新值 */
  value: number | null
  /** 与上一次采样的差值；首次为 null */
  delta: number | null
  /** 趋势方向 */
  trend: 'up' | 'down' | 'flat'
  /** 采样时间标签（recordedAt） */
  time: string
}
