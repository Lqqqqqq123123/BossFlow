interface IntervalConfig {
  delayDeliveryInterval: number
  delayDeliveryIntervalMode?: 'fixed' | 'random'
  delayDeliveryIntervalMin?: number
  delayDeliveryIntervalMax?: number
}

function seconds(value: number | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(99999, Math.max(1, value))
    : fallback
}

export function getDeliveryInterval(config: IntervalConfig, random = Math.random): number {
  const fixed = seconds(config.delayDeliveryInterval, 5)
  if (config.delayDeliveryIntervalMode !== 'random') return fixed
  const a = seconds(config.delayDeliveryIntervalMin, fixed)
  const b = seconds(config.delayDeliveryIntervalMax, a)
  const min = Math.min(a, b)
  const max = Math.max(a, b)
  return min + (max - min) * Math.min(1, Math.max(0, random()))
}
