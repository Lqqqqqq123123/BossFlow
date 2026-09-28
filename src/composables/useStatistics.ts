import { reactiveComputed, watchThrottled } from '@vueuse/core'

import { ref } from '#imports'
import { counter } from '@/message'
import type { Statistics } from '@/types/formData'
import { getCurDay } from '@/utils'
import deepmerge, { jsonClone } from '@/utils/deepmerge'
import { logger } from '@/utils/logger'

export const todayKey = 'local:web-geek-job-Today'
export const statisticsKey = 'local:web-geek-job-Statistics'

export const useStatistics = () => {
  const date = getCurDay()

  const todayData = reactiveComputed<Statistics>(() => {
    const current = {
      date,
      success: 0,
      total: 0,
      repeat: 0,
      activityFilter: 0,
      tasks: {},
    }
    return current
  })

  const statisticsData = ref<Statistics[]>([])

  function recordTaskResult(taskId: string, result: { isSkip?: boolean; status?: string }) {
    if (result.status) {
      todayData.tasks[taskId] ??= {}
      todayData.tasks[taskId][result.status] ??= 0
      todayData.tasks[taskId][result.status] += 1
    }

    if (taskId === '岗位投递' && result.status === 'success') {
      todayData.success += 1
    }
    if (result.isSkip && (taskId === '已沟通' || taskId.startsWith('重复沟通-'))) {
      todayData.repeat += 1
    }
    if (result.isSkip && taskId === '活跃度过滤') {
      todayData.activityFilter += 1
    }
  }

  function recordProcessed() {
    todayData.total += 1
  }

  async function getStatistics(): Promise<string> {
    await updateStatistics()
    return JSON.stringify(jsonClone({ t: todayData, s: statisticsData.value }))
  }

  async function setStatistics(data: string) {
    const { t, s } = JSON.parse(data)
    deepmerge(todayData, t, { clone: false })
    statisticsData.value = s
    await counter.storageSet(todayKey, t)
    await counter.storageSet(statisticsKey, s)
  }

  watchThrottled(
    todayData,
    (v) => {
      void counter.storageSet(todayKey, jsonClone(v))
    },
    { throttle: 200 },
  )

  async function updateStatistics(curData = jsonClone(todayData)) {
    void counter.storageGet<Statistics[]>(statisticsKey, []).then((data) => {
      statisticsData.value = data
    })

    const g = await counter.storageGet(todayKey, curData)
    logger.debug('统计数据:', date, g)
    if (g.date === date) {
      deepmerge(todayData, g, { clone: false })
      return g
    }

    const statistics = await counter.storageGet(statisticsKey, [])

    const newStatistics = [g, ...statistics]
    await counter.storageSet(statisticsKey, newStatistics)
    await counter.storageSet(todayKey, curData)
    statisticsData.value = newStatistics
  }

  return {
    todayData,
    statisticsData,
    recordTaskResult,
    recordProcessed,
    updateStatistics,
    getStatistics,
    setStatistics,
  }
}
