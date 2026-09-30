import request from './axios'
import type { ShipRuntimeStatus } from './types'

/* Runtime/health probes derived from REAL backend endpoints only.
 * The gateway has no dedicated metrics endpoint, so system telemetry is
 * sampled through /public/ping (round-trip latency) and /runtime (fleet feed). */

export interface PingSample {
  t: number        // epoch ms of the probe
  rttMs: number    // round-trip time measured client-side
  ok: boolean      // false when the probe failed
}

/** One ping probe with RTT measurement. Never throws. */
export async function pingOnce(): Promise<PingSample> {
  const start = performance.now()
  try {
    await request.get('/public/ping')
    return { t: Date.now(), rttMs: Math.round(performance.now() - start), ok: true }
  } catch {
    return { t: Date.now(), rttMs: Math.round(performance.now() - start), ok: false }
  }
}

/** Burst of N sequential probes — used for a quick latency snapshot chart. */
export async function pingSample(count = 5): Promise<PingSample[]> {
  const out: PingSample[] = []
  for (let i = 0; i < count; i++) {
    out.push(await pingOnce())
  }
  return out
}

/** Fleet runtime feed wrapper — keeps the raw list shape but adds fetch timestamp. */
export async function deriveRuntimeFeed(): Promise<{ rows: ShipRuntimeStatus[]; fetchedAt: number }> {
  const start = Date.now()
  const rows = await request.get<unknown, ShipRuntimeStatus[]>('/runtime')
  return { rows: Array.isArray(rows) ? rows : [], fetchedAt: start }
}
