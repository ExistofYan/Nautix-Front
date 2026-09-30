/* WebSocket 消息体类型：实时推送（runtime/alert/sensor）通用信封 */

/** 信封基础字段 */
export interface WsEnvelope<T = unknown> {
  type: string
  data: T
  timestamp: string
}

/** 船舶运行时状态推送（与后端 ShipRuntimeStatus 对齐） */
export interface RuntimePushData {
  shipId?: number
  sailingStatus?: string
  latitude?: number
  longitude?: number
  speed?: number
  heading?: number
  engineLoad?: number
  fuelPercent?: number
  weatherId?: number
  lastUpdate?: string
}

export type RuntimePush = WsEnvelope<{ ships: RuntimePushData[] }>

/** 告警推送 */
export interface AlertPushData {
  recordId?: number
  shipId?: number
  ruleId?: number
  ruleName?: string
  triggerValue?: number
  alertLevel?: number
  alertTime?: string
}

export type AlertPush = WsEnvelope<{ alerts: AlertPushData[] }>

/** 传感器读数推送 */
export interface SensorPushData {
  configId?: number
  shipId?: number
  sensorName?: string
  dataValue?: number
  unit?: string
  recordedAt?: string
}

export type SensorPush = WsEnvelope<{ readings: SensorPushData[] }>

/** 已知消息类型的判别联合；未知类型走 GenericMessage 兜底 */
export type WebSocketMessage =
  | (WsEnvelope<RuntimePush['data']> & { type: 'runtime' })
  | (WsEnvelope<AlertPush['data']> & { type: 'alert' })
  | (WsEnvelope<SensorPush['data']> & { type: 'sensor' })
  | WsEnvelope

/** 类型守卫：宽松判断，缺字段不抛错 */
export function isRuntimePush(m: WebSocketMessage): m is WsEnvelope<RuntimePush['data']> & { type: 'runtime' } {
  return m.type === 'runtime'
}

export function isAlertPush(m: WebSocketMessage): m is WsEnvelope<AlertPush['data']> & { type: 'alert' } {
  return m.type === 'alert'
}
