import assert from 'node:assert/strict'
import test from 'node:test'

import { withTimeout } from '../src/utils/withTimeout.ts'

void test('保存正常完成时返回结果', async () => {
  assert.equal(await withTimeout(async () => true, 100, '超时'), true)
})

void test('保存失败时保留实际错误', async () => {
  await assert.rejects(
    withTimeout(
      async () => {
        throw new Error('存储失败')
      },
      100,
      '超时',
    ),
    /存储失败/,
  )
})

void test('扩展无响应时结束等待并报告超时', async () => {
  await assert.rejects(
    withTimeout(() => new Promise(() => {}), 10, '扩展未响应'),
    /扩展未响应/,
  )
})

void test('同步序列化异常也能结束等待', async () => {
  await assert.rejects(
    withTimeout(
      () => {
        throw new Error('序列化失败')
      },
      100,
      '超时',
    ),
    /序列化失败/,
  )
})
