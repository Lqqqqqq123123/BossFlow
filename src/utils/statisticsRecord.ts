import type { Statistics } from '../types/formData.ts'

export type StatisticsTaskResult = { isSkip?: boolean; status?: string }

export function recordStatisticsTask(
  statistics: Statistics,
  taskId: string,
  result: StatisticsTaskResult,
) {
  if (result.status) {
    statistics.tasks[taskId] ??= {}
    statistics.tasks[taskId][result.status] ??= 0
    statistics.tasks[taskId][result.status] += 1
  }

  if (taskId === '岗位投递' && result.status === 'success') statistics.success += 1
  if (result.isSkip && (taskId === '已沟通' || taskId.startsWith('重复沟通-'))) {
    statistics.repeat += 1
  }
  if (result.isSkip && taskId === '活跃度过滤') statistics.activityFilter += 1
}

export function recordStatisticsProcessed(statistics: Statistics) {
  statistics.total += 1
}
