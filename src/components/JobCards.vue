<script lang="ts" setup>
import type { ComponentPublicInstance } from 'vue'
import { computed, ref } from 'vue'

import JobCard from '@/components/JobCard.vue'
import { useHelper } from '@/composables/useHelper'

const jobSetRef = ref<Record<string, Element | ComponentPublicInstance | null>>({})
const following = ref(true)

const cards = ref<HTMLDivElement>()
const helper = useHelper()
const statusFilter = ref<'all' | 'success' | 'error' | 'warn'>('all')

const visibleJobs = computed(() => {
  if (statusFilter.value === 'all') return helper.jobList.value
  return helper.jobList.value.filter(
    (job) => helper.jobResultMaps.get(job.key)?.status === statusFilter.value,
  )
})

const statusCounts = computed(() => {
  const counts = { success: 0, error: 0, warn: 0 }
  for (const job of helper.jobList.value) {
    const status = helper.jobResultMaps.get(job.key)?.status
    if (status === 'success' || status === 'error' || status === 'warn') counts[status] += 1
  }
  return counts
})

async function retryFailed() {
  const failed = helper.jobList.value.filter(
    (job) => helper.jobResultMaps.get(job.key)?.status === 'error',
  )
  for (const job of failed) {
    await helper.workflow?.retry(job.key)
  }
}

function onWheel(e: any) {
  e.preventDefault()
  if (!cards.value) {
    return
  }
  const left = -e.wheelDelta || e.deltaY / 2
  cards.value.scrollLeft = cards.value.scrollLeft + left
  following.value = false
}
function scrollHandler(key = helper.currentJob.value) {
  if (!key) {
    return
  }
  const d = jobSetRef.value[key]
  if (!d) {
    return
  }

  if ('scrollIntoView' in d) {
    d.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  } else if ('$el' in d) {
    d?.$el.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }
}

watch(
  () => helper.currentJob.value,
  (v) => {
    if (following.value && v) {
      scrollHandler(v)
    }
  },
)
</script>

<template>
  <section
    class="boss-helper-card relative mx-auto mb-8 w-[min(1120px,calc(100vw-32px))] max-w-[1120px]"
  >
    <header class="queue-toolbar">
      <div class="flex min-w-0 items-center gap-2">
        <UIcon name="i-lucide-rows-3" class="size-4 text-primary" />
        <span class="text-sm font-semibold text-highlighted">岗位队列</span>
        <UBadge color="neutral" variant="subtle" size="sm">
          {{ helper.jobList.value.length }} 个岗位
        </UBadge>
      </div>
      <div class="flex flex-wrap items-center justify-end gap-1.5">
        <UFieldGroup>
          <UButton
            v-for="item in [
              { value: 'all', label: '全部', count: helper.jobList.value.length },
              { value: 'success', label: '成功', count: statusCounts.success },
              { value: 'error', label: '失败', count: statusCounts.error },
              { value: 'warn', label: '过滤', count: statusCounts.warn },
            ]"
            :key="item.value"
            size="xs"
            :color="statusFilter === item.value ? 'primary' : 'neutral'"
            :variant="statusFilter === item.value ? 'soft' : 'outline'"
            :label="`${item.label} ${item.count}`"
            @click="statusFilter = item.value as typeof statusFilter"
          />
        </UFieldGroup>
        <UButton
          v-if="statusCounts.error"
          size="xs"
          color="error"
          variant="soft"
          icon="i-lucide-refresh-cw"
          label="重试失败项"
          :disabled="helper.workflowRunning.value"
          @click="retryFailed"
        />
        <UTooltip :text="following ? '关闭自动跟随' : '开启自动跟随'">
          <UButton
            square
            size="sm"
            :color="following ? 'primary' : 'neutral'"
            :variant="following ? 'soft' : 'ghost'"
            @click="following = !following"
            icon="i-lucide-locate-fixed"
            aria-label="切换岗位自动跟随"
          />
        </UTooltip>
      </div>
    </header>
    <div ref="cards" class="card-grid" @wheel.stop="onWheel">
      <JobCard
        v-for="job in visibleJobs"
        :ref="
          (ref) => {
            jobSetRef[job.key] = ref
          }
        "
        :key="job.key"
        :job="job"
        hover
      />
      <div
        v-if="visibleJobs.length === 0"
        class="flex min-h-44 min-w-full items-center justify-center text-sm text-muted"
      >
        当前筛选下暂无岗位
      </div>
    </div>
    <div class="card-grid-overlay" />
  </section>
</template>
