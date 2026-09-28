<script lang="ts" setup>
import type { TabsItem } from '@nuxt/ui'
import { useRafFn } from '@vueuse/core'
import { computed, onMounted, ref, shallowRef, watch } from 'vue'

import ChatBox from '@/components/ChatBox.vue'
import JobCards from '@/components/JobCards.vue'
import Version from '@/components/Menu/Version.vue'
import Ai from '@/components/Tabs/AI.vue'
import Config from '@/components/Tabs/Config.vue'
import Filter from '@/components/Tabs/Filter.vue'
import Logs from '@/components/Tabs/Logs.vue'
import Statistics from '@/components/Tabs/Statistics.vue'
import { useConf, appearanceConf } from '@/composables/conf'
import { useModel } from '@/composables/useModel'

import { useHelper, VITE_VERSION } from './composables/useHelper'

const model = useModel()
const conf = useConf()
const helper = useHelper()
const { todayData } = helper.statistics

const items = computed<TabsItem[]>(() => {
  const configs = [
    { slot: 'statistics', label: '投递', icon: 'i-lucide-gauge' },
    { slot: 'filter', label: '筛选', icon: 'i-lucide-list-filter' },
    { slot: 'config', label: '配置', icon: 'i-lucide-settings-2' },
    { slot: 'ai', label: 'AI', icon: 'i-lucide-sparkles' },
    { slot: 'logs', label: '日志', icon: 'i-lucide-scroll-text' },
  ] satisfies (TabsItem | boolean | null | undefined | '')[]

  return configs.filter((item) => !!item) as TabsItem[]
})

// const externalFilter = ref<HTMLElement>()
const container = ref<HTMLElement>()
const isFeatureEnabled = ref(false)
const helpContent = ref('鼠标移到对应元素查看提示')
const anchor = ref({ x: 0, y: 0 })
const isHovering = ref(false)
const helpVisible = computed(() => isFeatureEnabled.value && isHovering.value)
let lastElement: HTMLElement | null = null
let lastRect = { left: 0, top: 0, width: 0, height: 0 }
let root: ShadowRoot | Document = document
const boxStyles = shallowRef({
  display: 'none',
  width: '0px',
  height: '0px',
  transform: 'translate(0, 0)',
})

watch(helpVisible, (visible) => {
  if (visible) {
    resume()
  } else {
    pause()
    lastElement = null
    boxStyles.value = { ...boxStyles.value, display: 'none' }
  }
})

const reference = computed(() => ({
  getBoundingClientRect: () =>
    ({
      width: 0,
      height: 0,
      left: anchor.value.x,
      right: anchor.value.x,
      top: anchor.value.y,
      bottom: anchor.value.y,
    }) as DOMRect,
}))

const updateOverlay = () => {
  const target = root.elementFromPoint(anchor.value.x, anchor.value.y) as HTMLElement | null
  const el = target?.closest('[data-help]') as HTMLElement | null
  const help = el?.dataset.help || ''
  if (!el || help === 'no-help') {
    if (boxStyles.value.display !== 'none') {
      boxStyles.value = { ...boxStyles.value, display: 'none' }
      lastElement = null
    }
    return
  }

  const rect = el.getBoundingClientRect()
  const hasMoved =
    Math.abs(rect.left - lastRect.left) > 0.5 ||
    Math.abs(rect.top - lastRect.top) > 0.5 ||
    rect.width !== lastRect.width

  if (el === lastElement && !hasMoved) return

  lastElement = el
  lastRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
  helpContent.value = help

  boxStyles.value = {
    display: 'block',
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    transform: `translate(${rect.left}px, ${rect.top}px)`,
  }
}

const { pause, resume } = useRafFn(updateOverlay, { immediate: false })

const chatOpen = ref(appearanceConf.value.defaultShowChatBox)

onMounted(() => {
  root = (container.value?.getRootNode() as ShadowRoot) ?? document
  void conf.confInit()
  void model.initModel()
  chatOpen.value = appearanceConf.value.defaultShowChatBox
})

function tagOpen(url: string) {
  window.open(url)
}

const isDot = computed(() => {
  return (helper.netConf.value?.version ?? '0') > VITE_VERSION
})

const workflowState = computed(() => {
  const state = helper.workflow?.status.value ?? 'pending'
  if (state === 'running') {
    return { label: '投递中', color: 'success' as const, icon: 'i-lucide-loader-circle' }
  }
  if (state === 'stop') {
    return { label: '已暂停', color: 'warning' as const, icon: 'i-lucide-pause' }
  }
  if (state === 'error') {
    return { label: '异常', color: 'error' as const, icon: 'i-lucide-circle-alert' }
  }
  return { label: '待命', color: 'neutral' as const, icon: 'i-lucide-circle-dot' }
})

const overlay = useOverlay()

function openStore() {
  overlay
    .create(Version, {
      destroyOnClose: true,
    })
    .open()
}

function onPointerMove(ev: PointerEvent) {
  if (!helpVisible.value) {
    return
  }
  anchor.value.x = ev.clientX
  anchor.value.y = ev.clientY
}
</script>

<template>
  <div
    class="shadow-wrapper my-8 mx-auto w-[min(1120px,calc(100vw-32px))] min-w-0 max-w-[1120px]"
    :style="{
      marginRight:
        appearanceConf.leftChat && appearanceConf.contentOffset != 25
          ? `${appearanceConf.contentOffset}%`
          : undefined,
      marginLeft:
        !appearanceConf.leftChat && appearanceConf.contentOffset != 25
          ? `${appearanceConf.contentOffset}%`
          : undefined,
    }"
    ref="container"
  >
    <UApp :portal="container" :toaster="{ position: 'top-right', ui: { viewport: 'z-100000' } }">
      <div class="overlay-box" :style="boxStyles" />
      <UTooltip
        :open="helpVisible"
        :reference="reference"
        :content="{
          side: 'top',
          sideOffset: 20,
          updatePositionStrategy: 'always',
        }"
        :text="helpContent"
        :ui="{
          content:
            'z-1000 flex items-center gap-1 bg-default text-highlighte shadow-xl rounded-md ring-1 ring-default h-auto px-3 py-2 text-[17px] leading-snug select-none pointer-events-auto backdrop-blur-none opacity-100 wrap-break-word',
          text: 'whitespace-normal',
        }"
      />
      <div
        @pointermove.passive="onPointerMove"
        @mouseenter="isHovering = true"
        @mouseleave="isHovering = false"
      >
        <section class="overflow-hidden rounded-lg border border-default bg-default shadow-sm">
          <header
            class="flex min-h-18 flex-wrap items-center justify-between gap-3 border-b border-muted px-5 py-3"
          >
            <div class="flex min-w-0 items-center gap-3">
              <div
                class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
              >
                <UIcon name="i-lucide-briefcase-business" class="size-5" />
              </div>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h1 class="truncate text-base font-semibold text-highlighted">
                    {{ !appearanceConf.hideHeader ? 'BossFlow' : 'BF' }}
                  </h1>
                  <UBadge
                    :color="workflowState.color"
                    variant="subtle"
                    size="sm"
                    :icon="workflowState.icon"
                    :class="
                      workflowState.color === 'success'
                        ? '[&_[data-slot=leadingIcon]]:animate-spin'
                        : ''
                    "
                  >
                    {{ workflowState.label }}
                  </UBadge>
                </div>
                <p class="mt-0.5 truncate text-xs text-muted">
                  今日投递 {{ todayData.success }} / {{ conf.formData.deliveryLimit.value }}
                  <span v-if="helper.workflow && helper.workflow.total.value > 0">
                    · 当前页面 {{ helper.workflow.current.value }}/{{ helper.workflow.total.value }}
                  </span>
                </p>
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              <UChip :show="isDot">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-package-check"
                  :label="`v${VITE_VERSION}`"
                  title="版本信息"
                  @click="openStore"
                />
              </UChip>
              <UTooltip text="对话助手">
                <UButton
                  square
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-message-square-text"
                  aria-label="打开对话助手"
                  @click="chatOpen = !chatOpen"
                />
              </UTooltip>
              <UTooltip v-if="helper.netConf.value?.feedback" text="提交反馈">
                <UButton
                  square
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-message-circle-warning"
                  aria-label="提交反馈"
                  @click="tagOpen(helper.netConf.value.feedback)"
                />
              </UTooltip>
              <UTooltip text="帮助模式">
                <UButton
                  square
                  size="sm"
                  :color="isFeatureEnabled ? 'primary' : 'neutral'"
                  :variant="isFeatureEnabled ? 'soft' : 'ghost'"
                  icon="i-lucide-circle-help"
                  aria-label="切换帮助模式"
                  @click="isFeatureEnabled = !isFeatureEnabled"
                />
              </UTooltip>
            </div>
          </header>

          <div
            v-if="helper.netConf.value && helper.netConf.value.notification"
            class="netAlerts px-5 pt-3"
          >
            <template
              v-for="item in helper.netConf.value.notification.filter(
                (item) => item.type === 'alert',
              )"
              :key="item.key ?? item.data.title"
            >
              <Alert :id="`netConf-${item.key}`" v-bind="item.data" />
            </template>
          </div>
          <UTabs
            data-help="no-help"
            :items="items"
            variant="link"
            size="md"
            class="gap-0"
            :ui="{
              list: 'items-center px-4 overflow-x-auto',
              trigger: 'min-w-fit',
              content: 'px-5 py-4',
            }"
            :unmount-on-hide="false"
          >
            <template #statistics>
              <Statistics />
            </template>
            <template #filter>
              <Filter />
            </template>
            <template #config><Config /></template>
            <template #ai><Ai /></template>
            <template #logs><Logs /></template>
          </UTabs>
        </section>
      </div>
      <JobCards />
      <ChatBox v-model:open="chatOpen" />
    </UApp>
  </div>
</template>
