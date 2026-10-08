<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'

import JobCard from '@/components/JobCard.vue'
import type { TableColumn } from '@nuxt/ui'
import { useHelper, Log } from '@/composables/useHelper'
import { exportJson } from '@/utils/jsonImportExport'

const helper = useHelper()
const toast = useToast()

const dialogData = reactive<{ show: boolean; data?: Log }>({ show: false })

const aiFilterActiveNames = ref('response')
const aiGreetActiveNames = ref('response')

const stateMeta: Record<Log['state'], { label: string; color: 'info' | 'success' | 'warning' | 'error' }> = {
  info: { label: '信息', color: 'info' },
  success: { label: '成功', color: 'success' },
  warning: { label: '警告', color: 'warning' },
  danger: { label: '错误', color: 'error' },
}

type LevelFilter = 'all' | Log['state']
const activeLevel = ref<LevelFilter>('all')
const keyword = ref('')

const levelOptions = computed(() => [
  { label: '全部', value: 'all' as const, count: helper.logs.value.length },
  ...(Object.keys(stateMeta) as Log['state'][]).map((state) => ({
    label: stateMeta[state].label,
    value: state,
    count: helper.logs.value.filter((log) => log.state === state).length,
  })),
])

const filteredLogs = computed(() => {
  let list = helper.logs.value
  if (activeLevel.value !== 'all') {
    list = list.filter((log) => log.state === activeLevel.value)
  }
  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter((log) =>
      [log.title, log.message, log.state_name, log.job?.jobName, log.job?.brand?.name].some(
        (text) => text?.toLowerCase().includes(kw),
      ),
    )
  }
  return [...list].reverse()
})

function formatTime(time?: number) {
  if (!time) return '-'
  const d = new Date(time)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function openDetail(log: Log) {
  dialogData.show = true
  dialogData.data = log
}

function clearLogs() {
  helper.logs.clear()
  toast.add({ title: '日志已清空', color: 'success' })
}

function exportLogs() {
  if (!filteredLogs.value.length) {
    toast.add({ title: '当前没有可导出的日志', color: 'warning' })
    return
  }
  exportJson(
    {
      exportedAt: new Date().toISOString(),
      count: filteredLogs.value.length,
      logs: filteredLogs.value,
    },
    'BossFlow日志',
  )
  toast.add({ title: `已导出 ${filteredLogs.value.length} 条日志`, color: 'success' })
}

const columns: TableColumn<Log>[] = [
  {
    accessorKey: 'state',
    header: '级别',
    cell: ({ row }) => {
      const meta = stateMeta[row.original.state] ?? stateMeta.info
      return (
        <UBadge color={meta.color} variant="subtle" size="sm">
          {row.original.state_name || meta.label}
        </UBadge>
      )
    },
  },
  {
    accessorKey: 'title',
    header: '岗位 / 事件',
    cell: ({ row }) => (
      <UButton
        color="neutral"
        variant="link"
        size="sm"
        class="cursor-pointer"
        onClick={() => openDetail(row.original)}
      >
        {row.original.title}
      </UButton>
    ),
  },
  {
    accessorKey: 'message',
    header: '消息',
    cell: ({ row }) => <span class="line-clamp-1 text-muted">{row.original.message || '-'}</span>,
  },
  {
    accessorKey: 'time',
    header: '时间',
    cell: ({ row }) => <span class="text-muted tabular-nums">{formatTime(row.original.time)}</span>,
  },
]
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-muted bg-elevated/40 p-2 pl-3"
    >
      <div class="flex flex-wrap items-center gap-1">
        <UButton
          v-for="opt in levelOptions"
          :key="opt.value"
          size="xs"
          :color="activeLevel === opt.value ? 'primary' : 'neutral'"
          :variant="activeLevel === opt.value ? 'soft' : 'ghost'"
          @click="activeLevel = opt.value"
        >
          {{ opt.label }}
          <UBadge
            :color="activeLevel === opt.value ? 'primary' : 'neutral'"
            variant="subtle"
            size="xs"
            >{{ opt.count }}</UBadge
          >
        </UButton>
      </div>
      <div class="flex items-center gap-2">
        <UInput
          v-model="keyword"
          icon="i-lucide-search"
          placeholder="搜索岗位或消息"
          size="xs"
          class="w-44 sm:w-56"
        />
        <UButton
          size="xs"
          color="neutral"
          variant="outline"
          icon="i-lucide-download"
          data-help="将当前筛选后的日志导出为 JSON 文件"
          @click="exportLogs"
        >
          导出
        </UButton>
        <UButton
          size="xs"
          color="error"
          variant="outline"
          icon="i-lucide-trash-2"
          data-help="清空本次运行产生的全部日志"
          @click="clearLogs"
        >
          清空
        </UButton>
      </div>
    </div>

    <UTable v-if="filteredLogs.length" :columns="columns" :data="filteredLogs" :height="360" />
    <div
      v-else
      class="flex h-60 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted text-muted"
    >
      <UIcon name="i-lucide-scroll-text" class="size-8 opacity-60" />
      <p class="text-sm">
        {{
          helper.logs.value.length
            ? '没有符合筛选条件的日志'
            : '暂无日志，开始投递后这里会记录每个岗位的处理结果'
        }}
      </p>
    </div>
  </div>

  <UModal v-model:open="dialogData.show" title="日志详情">
    <template #body>
      <div class="log-detail">
        <div class="log-detail-left">
          <JobCard v-if="dialogData.data?.job" :job="dialogData.data.job" />
        </div>
        <div class="log-detail-right">
          <UTabs class="demo-tabs">
            <UTabsList>
              <UTabsTrigger v-if="dialogData.data?.data?.aiFilteringQ" value="first"
                >AI过滤</UTabsTrigger
              >
              <UTabsTrigger v-if="dialogData.data?.data?.aiGreetingQ" value="second"
                >AI打招呼</UTabsTrigger
              >
              <UTabsTrigger v-if="dialogData.data?.data?.err" value="fourth">错误信息</UTabsTrigger>
            </UTabsList>
            <UTabsContent v-if="dialogData.data?.data?.aiFilteringQ" value="first">
              <UAccordion v-model="aiFilterActiveNames" type="single" collapsible>
                <UAccordionItem value="prompt" title="Prompt">
                  <div class="ai-text">{{ dialogData.data.data.aiFilteringQ }}</div>
                </UAccordionItem>
                <UAccordionItem
                  v-if="dialogData.data.data.aiFilteringR"
                  value="thinking"
                  title="思考过程"
                >
                  <div class="ai-text">{{ dialogData.data.data.aiFilteringR }}</div>
                </UAccordionItem>
                <UAccordionItem value="response" title="响应" class="active">
                  <div class="ai-text">{{ dialogData.data.data.aiFilteringAtext }}</div>
                </UAccordionItem>
              </UAccordion>
            </UTabsContent>
            <UTabsContent v-if="dialogData.data?.data?.aiGreetingQ" value="second">
              <UAccordion v-model="aiGreetActiveNames" type="single" collapsible>
                <UAccordionItem value="prompt" title="Prompt">
                  <div class="ai-text">{{ dialogData.data.data.aiGreetingQ }}</div>
                </UAccordionItem>
                <UAccordionItem
                  v-if="dialogData.data.data.aiGreetingR"
                  value="thinking"
                  title="思考过程"
                >
                  <div class="ai-text">{{ dialogData.data.data.aiGreetingR }}</div>
                </UAccordionItem>
                <UAccordionItem value="response" title="响应" class="active">
                  <div class="ai-text">{{ dialogData.data.data.aiGreetingA }}</div>
                </UAccordionItem>
              </UAccordion>
            </UTabsContent>
            <UTabsContent v-if="dialogData.data?.data?.err" value="fourth">
              <div>{{ dialogData.data.data.err }}</div>
              <div v-if="dialogData.data?.data?.message">{{ dialogData.data.data.message }}</div>
            </UTabsContent>
          </UTabs>
        </div>
      </div>
    </template>
    <template #footer>
      <UButton @click="dialogData.show = false"> 关闭 </UButton>
    </template>
  </UModal>
</template>

<style lang="scss" scoped>
.log-detail {
  display: flex;
  gap: 20px;
  min-height: 500px;

  &-left {
    flex: 0 0 350px;
  }

  &-right {
    flex: 1;
    overflow-y: auto;
  }
}

.ai-text {
  white-space: pre-wrap;
  user-select: text;
  padding: 8px;
  line-height: 1.5;
}
</style>
