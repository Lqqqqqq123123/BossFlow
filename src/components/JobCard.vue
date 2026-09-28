<script setup lang="ts">
import { computed, ref } from 'vue'

import type { JobStatus } from '@/composables/useApplying/type'
import { useHelper } from '@/composables/useHelper'
import type { JobData } from '@/composables/useHelper'

const helper = useHelper()

const props = defineProps<{
  job: JobData
  hover?: boolean
}>()

const jobResult = computed(() => helper.jobResultMaps.get(props.job.key))
const taskTimeline = computed(() => helper.workflow?.timeline.get(props.job.key) ?? [])

const stateMaps: Record<JobStatus, string> = {
  pending: 'var(--ui-color-neutral-400)',
  wait: 'var(--ui-color-neutral-400)',
  error: 'var(--ui-color-error-500)',
  warn: 'var(--ui-color-warning-500)',
  success: 'var(--ui-color-success-500)',
  running: 'var(--ui-color-primary-500)',
  request: 'var(--ui-color-info-500)',
  ai: 'var(--ui-color-secondary-500)',
}

const jobStatus = computed(() => {
  const status = jobResult.value?.status ?? 'pending'
  return {
    status,
    color: stateMaps[status],
    show: jobResult.value?.status !== 'pending' ? 'flex' : 'none',
  }
})

const showDescription = ref(false)
const showDescriptionLoading = ref(false)
const showDescriptionMessage = ref<string | null>(null)

async function showDescriptionHandler() {
  showDescription.value = true
  showDescriptionLoading.value = true
  showDescriptionMessage.value = null
  try {
    await helper.onJobCardClick(props.job.key)
  } catch (error) {
    console.error('showDescriptionHandler error', error)
    showDescriptionMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    showDescriptionLoading.value = false
  }
}

function getActiveTimeType(job: JobData): 'success' | 'warning' | 'error' {
  const activeTime = job.activeTime
  if (!activeTime) return 'error'

  const diffDays = (Date.now() - activeTime) / (1000 * 60 * 60 * 24)
  if (diffDays <= 2) return 'success'
  if (diffDays <= 7) return 'warning'
  return 'error'
}
</script>

<template>
  <div
    v-if="job"
    class="job-card"
    :class="{ 'job-card-hover': hover }"
    :style="{
      '--state-color': jobStatus.color,
      '--state-show': jobStatus.show,
    }"
  >
    <div class="card-tag">
      {{ [job.brand.industry, job.degreeName, job.brand.scale].filter(Boolean).join(' · ') }}
    </div>
    <a :href="job.link" target="_blank" class="card-title">{{ job.jobName }}</a>
    <h3 class="card-salary">{{ job.salary }}</h3>

    <div
      v-show="showDescription"
      class="card-content"
      :title="job.jobDescription"
      @click="showDescription = false"
    >
      <template v-if="showDescriptionLoading">
        加载中...
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-4/5" />
      </template>
      <template v-else-if="showDescriptionMessage">{{ showDescriptionMessage }}</template>
      <template v-else>{{ job.jobDescription }}</template>
    </div>

    <div v-show="!showDescription" class="card-content" @click="showDescriptionHandler">
      <div class="flex flex-wrap gap-1">
        <UBadge v-for="tag in job.skills" :key="tag" size="sm" variant="subtle" color="warning">
          {{ tag }}
        </UBadge>
        <UBadge v-for="tag in job.jobLabels" :key="tag" size="sm" variant="subtle" color="success">
          {{ tag }}
        </UBadge>
      </div>
      <div v-if="job.welfareList?.length" class="card-footer">
        {{ job.welfareList.join(',') }}
      </div>
    </div>

    <div v-if="job.activeTime || job.activeTimeStr" class="active-time-tag">
      <UBadge :color="getActiveTimeType(job)" variant="subtle">
        活跃时间：{{
          job.activeTime
            ? `${new Date(job.activeTime).toLocaleString('zh')}${job.activeTimeStr ? ` (${job.activeTimeStr})` : ''}`
            : job.activeTimeStr
        }}
      </UBadge>
    </div>

    <details v-if="taskTimeline.length" class="job-timeline">
      <summary>执行时间线 · {{ taskTimeline.length }} 条</summary>
      <ol>
        <li v-for="(trace, index) in taskTimeline" :key="`${trace.timestamp}-${index}`">
          <span :data-status="trace.status" class="timeline-dot" />
          <span class="truncate">{{ trace.label }} · {{ trace.message }}</span>
          <time>{{
            new Date(trace.timestamp).toLocaleTimeString('zh-CN', { hour12: false })
          }}</time>
        </li>
      </ol>
    </details>

    <div class="author-row">
      <img alt="" class="avatar" height="80" :src="job.brand.logo" width="80" />
      <div class="min-w-0">
        <span class="company-name">{{ job.brand.name }}</span>
        <h4 class="truncate">{{ job.address }}</h4>
      </div>
    </div>

    <div
      v-if="jobResult"
      class="card-status flex-row items-center justify-center gap-2"
      :title="jobResult.reason || jobResult.msg"
    >
      <UIcon v-if="jobStatus.status === 'running'" name="i-line-md-loading-twotone-loop" />
      <UIcon v-else-if="jobStatus.status === 'request'" name="i-svg-spinners-wifi-fade" />
      <UIcon v-else-if="jobStatus.status === 'ai'" name="i-line-md-hazard-lights-loop" />
      <UIcon v-else-if="jobStatus.status === 'success'" name="i-lucide-check" />
      <UIcon v-else-if="jobStatus.status === 'warn'" name="i-lucide-triangle-alert" />
      <UIcon v-else-if="jobStatus.status === 'error'" name="i-lucide-x" />
      <span class="truncate">{{ jobResult.msg || jobResult.reason || '无内容' }}</span>
      <UButton
        v-if="jobStatus.status === 'error'"
        square
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-refresh-cw"
        aria-label="重试该岗位"
        :disabled="helper.workflowRunning.value"
        @click.stop="helper.workflow?.retry(job.key)"
      />
    </div>
  </div>
</template>
