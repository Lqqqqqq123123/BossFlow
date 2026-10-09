import { reactiveComputed, watchThrottled } from '@vueuse/core'

import { ref } from '#imports'
import { counter } from '@/message'
import type { Statistics } from '@/types/formData'
import { getCurDay } from '@/utils'
import deepmerge, { jsonClone } from '@/utils/deepmerge'
import { logger } from '@/utils/logger'
import { recordStatisticsProcessed, recordStatisticsTask } from '@/utils/statisticsRecord'
import { accountStorageKey } from '@/utils/accountStorage'

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
    recordStatisticsTask(todayData, taskId, result)
  }

  function recordProcessed() {
    recordStatisticsProcessed(todayData)
  }

  async function getStatistics(): Promise<string> {
    await updateStatistics()
    return JSON.stringify(jsonClone({ t: todayData, s: statisticsData.value }))
  }

  async function setStatistics(data: string) {
    const { t, s } = JSON.parse(data)
    deepmerge(todayData, t, { clone: false })
    statisticsData.value = s
    await counter.storageSet(accountStorageKey(todayKey), t)
    await counter.storageSet(accountStorageKey(statisticsKey), s)
  }

  watchThrottled(
    todayData,
    (v) => {
      void counter.storageSet(accountStorageKey(todayKey), jsonClone(v))
    },
    { throttle: 200 },
  )

  async function updateStatistics(curData = jsonClone(todayData)) {
    void counter.storageGet<Statistics[]>(accountStorageKey(statisticsKey), []).then((data) => {
      statisticsData.value = data
    })

    const g = await counter.storageGet(accountStorageKey(todayKey), curData)
    logger.debug('统计数据:', date, g)
    if (g.date === date) {
      deepmerge(todayData, g, { clone: false })
      return g
    }

    const statistics = await counter.storageGet(accountStorageKey(statisticsKey), [])

    const newStatistics = [g, ...statistics]
    await counter.storageSet(accountStorageKey(statisticsKey), newStatistics)
    await counter.storageSet(accountStorageKey(todayKey), curData)
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
