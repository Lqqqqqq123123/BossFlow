import assert from 'node:assert/strict'
import test from 'node:test'

import type { Statistics } from '../src/types/formData.ts'
import { recordStatisticsProcessed, recordStatisticsTask } from '../src/utils/statisticsRecord.ts'

function createStatistics(): Statistics {
  return {
    date: '2026-09-28',
    success: 0,
    total: 0,
    repeat: 0,
    activityFilter: 0,
    tasks: {},
  }
}

void test('只有岗位投递成功才增加成功数', () => {
  const statistics = createStatistics()
  recordStatisticsTask(statistics, '岗位详情获取', { status: 'success' })
  recordStatisticsTask(statistics, '岗位投递', { status: 'success' })
  assert.equal(statistics.success, 1)
  assert.equal(statistics.tasks['岗位投递'].success, 1)
})

void test('每个实际处理岗位只在处理完成时累计总数', () => {
  const statistics = createStatistics()
  recordStatisticsTask(statistics, '岗位投递', { status: 'success' })
  assert.equal(statistics.total, 0)
  recordStatisticsProcessed(statistics)
  assert.equal(statistics.total, 1)
})

void test('重复岗位和活跃度过滤分别计数', () => {
  const statistics = createStatistics()
  recordStatisticsTask(statistics, '已沟通', { isSkip: true, status: 'warn' })
  recordStatisticsTask(statistics, '活跃度过滤', { isSkip: true, status: 'warn' })
  assert.equal(statistics.repeat, 1)
  assert.equal(statistics.activityFilter, 1)
})
