import assert from 'node:assert/strict'
import test from 'node:test'

import { getDeliveryInterval } from '../src/utils/deliveryInterval.ts'

void test('旧配置保留固定间隔且不调用随机源', () => {
  assert.equal(
    getDeliveryInterval({ delayDeliveryInterval: 8 }, () => {
      throw new Error('不应调用')
    }),
    8,
  )
})
void test('随机模式覆盖范围边界和中间值，每次重新取样', () => {
  const config = {
    delayDeliveryInterval: 5,
    delayDeliveryIntervalMode: 'random' as const,
    delayDeliveryIntervalMin: 5,
    delayDeliveryIntervalMax: 10,
  }
  assert.equal(
    getDeliveryInterval(config, () => 0),
    5,
  )
  assert.equal(
    getDeliveryInterval(config, () => 1),
    10,
  )
  assert.equal(
    getDeliveryInterval(config, () => 0.5),
    7.5,
  )
})
void test('倒序和相同边界正常处理，异常数值安全回退', () => {
  assert.equal(
    getDeliveryInterval(
      {
        delayDeliveryInterval: 5,
        delayDeliveryIntervalMode: 'random',
        delayDeliveryIntervalMin: 10,
        delayDeliveryIntervalMax: 5,
      },
      () => 0,
    ),
    5,
  )
  assert.equal(
    getDeliveryInterval({
      delayDeliveryInterval: 5,
      delayDeliveryIntervalMode: 'random',
      delayDeliveryIntervalMin: 7,
      delayDeliveryIntervalMax: 7,
    }),
    7,
  )
  assert.equal(getDeliveryInterval({ delayDeliveryInterval: NaN }), 5)
  assert.equal(getDeliveryInterval({ delayDeliveryInterval: -1 }), 1)
})
