<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'

import Alert from '@/components/Alert.vue'
import { useConf } from '@/composables/conf'
import { useHelper } from '@/composables/useHelper'

const ctx = useHelper()

const statistics = ctx.statistics

// const { next, page } = usePager()
const conf = useConf()
const statisticCycle = ref(1)
const sessionTimeout = ref<number | null>(null)
const sessionTimeoutInput = ref<number | undefined>(undefined)
const savingDefault = ref(false)
async function saveDefaultTimeout() {
  savingDefault.value = true
  conf.formData.deliveryTimeoutMinutes = sessionTimeoutInput.value ?? defaultTimeout.value
  try {
    await conf.confSaving()
  } finally {
    savingDefault.value = false
  }
}

const statisticCycleData = [
  {
    label: '近三日投递',
    help: '愿你每一次投递都能得到回应',
    date: 3,
  },
  {
    label: '本周投递',
    help: '愿你早日找到心满意足的工作',
    date: 7,
  },
  {
    label: '本月投递',
    help: '愿你在面试中得到满意的结果',
    date: 30,
  },
  {
    label: '历史投递',
    help: '愿你能早九晚五还双休带五险',
    date: -1,
  },
]

const cycle = computed(() => {
  const date = statisticCycleData[statisticCycle.value].date
  let ans = 0
  for (
    let i = 0;
    // eslint-disable-next-line no-unmodified-loop-condition
    (date === -1 || i < date - 1) && i < statistics.statisticsData.value.length;
    i++
  ) {
    ans += statistics.statisticsData.value[i].success
  }
  return ans
})

const deliveryLimit = computed(() => {
  return conf.formData.deliveryLimit.value
})

const isRunning = computed(() => ctx.workflow?.status.value === 'running')
const isPaused = computed(() => ctx.workflow?.status.value === 'stop')
const defaultTimeout = computed(() => Number(conf.formData.deliveryTimeoutMinutes) || 0)
function startDelivery() {
  const value = sessionTimeoutInput.value
  sessionTimeout.value = value == null ? defaultTimeout.value : Math.max(0, value)
  ctx.deliveryTimeoutOverride.value = sessionTimeout.value
  void ctx.start()
}
const currentPageProgress = computed(() => {
  const total = ctx.workflow?.total.value ?? 0
  const current = ctx.workflow?.current.value ?? 0
  return percentage(current, total)
})

function percentage(value: number, total: number) {
  if (total <= 0) return 0
  return Number(((value / total) * 100).toFixed(1))
}

onMounted(() => {
  statistics.updateStatistics()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <section
      class="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-muted bg-elevated/40 p-4"
    >
      <div class="min-w-56 flex-1">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-highlighted">自动投递</span>
          <UBadge
            :color="isRunning ? 'success' : isPaused ? 'warning' : 'neutral'"
            variant="subtle"
            size="sm"
          >
            {{ isRunning ? '运行中' : isPaused ? '已暂停' : '待命' }}
          </UBadge>
        </div>
        <div class="mt-2 flex items-center gap-3">
          <UProgress
            :value="currentPageProgress"
            size="sm"
            class="max-w-96 flex-1"
            data-help="当前页面岗位处理进度"
          />
          <span class="min-w-12 text-right text-xs tabular-nums text-muted">
            {{ currentPageProgress }}%
          </span>
        </div>
      </div>

      <UFieldGroup>
        <UInputNumber
          v-if="!isRunning"
          v-model="sessionTimeoutInput"
          :min="0"
          :max="1440"
          placeholder="时限(分钟)"
          class="w-36"
          data-help="本次投递时限，留空使用默认值，0 表示不限时"
        />
        <UButton
          v-if="!isRunning"
          icon="i-lucide-save"
          color="neutral"
          variant="outline"
          :loading="savingDefault"
          title="保存为默认时限"
          @click="saveDefaultTimeout"
        />
        <UButton
          v-if="!isRunning"
          color="primary"
          icon="i-lucide-play"
          :label="isPaused ? '继续投递' : '开始投递'"
          data-help="点击开始就会开始投递"
          @click="startDelivery"
        />
        <UButton
          v-if="isRunning"
          color="warning"
          variant="soft"
          icon="i-lucide-pause"
          label="暂停"
          data-help="暂停后可以继续投递"
          @click="ctx.stop()"
        />
        <UButton
          v-if="isPaused"
          color="neutral"
          variant="outline"
          icon="i-lucide-rotate-ccw"
          label="重置"
          data-help="重置已被筛选的岗位，开始将重新处理"
          @click="ctx.reset()"
        />
      </UFieldGroup>
      <span class="w-full text-xs text-muted">
        默认时限：{{ defaultTimeout > 0 ? `${defaultTimeout} 分钟` : '不限时' }}
      </span>
    </section>

    <section
      v-if="conf.configLevel.intermediate"
      class="grid grid-cols-2 divide-x divide-y divide-muted overflow-hidden rounded-lg border border-muted md:grid-cols-5 md:divide-y-0"
    >
      <div class="min-w-0 p-4" data-help="统计当天脚本扫描过的所有岗位">
        <div class="flex items-center gap-1.5 text-xs text-muted">
          <UIcon name="i-lucide-layers-3" class="size-4" />
          今日处理
        </div>
        <div class="mt-1 text-xl font-semibold tabular-nums text-highlighted">
          {{ statistics.todayData.total }} <span class="text-xs font-normal text-dimmed">份</span>
        </div>
      </div>
      <div class="min-w-0 p-4" data-help="当天实际成功投递的岗位">
        <div class="flex items-center gap-1.5 text-xs text-muted">
          <UIcon name="i-lucide-send" class="size-4 text-success" />
          成功投递
        </div>
        <div class="mt-1 text-xl font-semibold tabular-nums text-highlighted">
          {{ statistics.todayData.success }}
          <span class="text-xs font-normal text-dimmed">/ {{ deliveryLimit }}</span>
        </div>
      </div>
      <div class="min-w-0 p-4" data-help="统计当天岗位过滤的比例，被过滤/总数">
        <div class="flex items-center gap-1.5 text-xs text-muted">
          <UIcon name="i-lucide-filter-x" class="size-4 text-warning" />
          过滤率
        </div>
        <div class="mt-1 text-xl font-semibold tabular-nums text-highlighted">
          {{
            percentage(
              statistics.todayData.total - statistics.todayData.success,
              statistics.todayData.total,
            )
          }}<span class="text-xs font-normal text-dimmed">%</span>
        </div>
      </div>
      <div class="min-w-0 p-4" data-help="统计当天刷到的已处理岗位比例">
        <div class="flex items-center gap-1.5 text-xs text-muted">
          <UIcon name="i-lucide-copy-check" class="size-4 text-info" />
          重复率
        </div>
        <div class="mt-1 text-xl font-semibold tabular-nums text-highlighted">
          {{ percentage(statistics.todayData.repeat, statistics.todayData.total)
          }}<span class="text-xs font-normal text-dimmed">%</span>
        </div>
      </div>
      <div class="min-w-0 p-4" :data-help="statisticCycleData[statisticCycle].help">
        <UDropdownMenu
          :items="
            statisticCycleData.map((item, index) => ({
              label: item.label,
              onSelect: () => (statisticCycle = index),
            }))
          "
        >
          <UButton
            color="neutral"
            variant="link"
            size="xs"
            trailing-icon="i-lucide-chevron-down"
            class="p-0 text-muted"
          >
            {{ statisticCycleData[statisticCycle].label }}
          </UButton>
        </UDropdownMenu>
        <div class="mt-1 text-xl font-semibold tabular-nums text-highlighted">
          {{ cycle + statistics.todayData.success }}
          <span class="text-xs font-normal text-dimmed">份</span>
        </div>
      </div>
    </section>

    <div class="flex items-center gap-3">
      <UProgress
        data-help="今日投递进度"
        class="flex-1"
        size="sm"
        :value="percentage(statistics.todayData.success, deliveryLimit)"
      />
      <span class="text-xs tabular-nums text-muted">
        {{ percentage(statistics.todayData.success, deliveryLimit) }}%
      </span>
    </div>

    <Alert
      id="config-statistics"
      description="投递上限请根据账号情况设置，建议 120–140，平台最高限制通常为 150。"
      color="warning"
      show-icon
    />
  </div>
</template>

<style lang="scss"></style>
