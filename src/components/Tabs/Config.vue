<script lang="ts" setup>
import { computed, onBeforeUnmount, ref } from 'vue'

import Alert from '@/components/Alert.vue'
import { formInfoData, useConf } from '@/composables/conf'
import { getCacheManager } from '@/composables/useApplying'
import { useHelper } from '@/composables/useHelper'

import ConfigItem from './ConfigItem/ConfigItem.vue'

const helper = useHelper()
const conf = useConf()
const configItems = helper.getConfigItems()
const configView = ref<'basic' | 'advanced'>('basic')

const visibleConfigItems = computed(() => {
  const items = configItems.value[1].filter((item) => !!item)
  return items.filter((item) => {
    const isAdvanced = item.value === 'address' || item.value === 'delay'
    return configView.value === 'advanced' ? isAdvanced : !isAdvanced
  })
})

// 手风琴分组没有元信息，这里按 value 补图标和一句话说明
const groupMeta: Record<string, { icon: string; description: string }> = {
  filter: { icon: 'i-lucide-filter', description: '只投递符合以下条件的岗位' },
  greetings: { icon: 'i-lucide-message-square-text', description: '自定义打招呼的文本与图片消息' },
  appearance: { icon: 'i-lucide-palette', description: '调整面板与岗位卡片的显示样式' },
  address: { icon: 'i-lucide-map-pin', description: '按通勤距离过滤岗位' },
  delay: { icon: 'i-lucide-timer', description: '控制投递节奏，太快容易触发风控' },
}

const accordionItems = computed(() =>
  visibleConfigItems.value.map((item) => ({
    ...item,
    icon: item.value != null ? groupMeta[item.value]?.icon : undefined,
  })),
)

// 保存按钮状态机：点击后按钮本身给出结果反馈，toast 只作双保险
type SaveState = 'idle' | 'saving' | 'success' | 'error'
const saveState = ref<SaveState>('idle')
let saveStateTimer: ReturnType<typeof setTimeout> | undefined

const saveButton = computed(() => {
  switch (saveState.value) {
    case 'saving':
      return { label: '保存中…', icon: undefined, loading: true, disabled: true }
    case 'success':
      return { label: '已保存', icon: 'i-lucide-check', loading: false, disabled: false }
    case 'error':
      return { label: '保存失败', icon: 'i-lucide-circle-alert', loading: false, disabled: false }
    default:
      return { label: '保存配置', icon: 'i-lucide-save', loading: false, disabled: false }
  }
})

async function handleSave() {
  if (saveState.value === 'saving') return
  clearTimeout(saveStateTimer)
  saveState.value = 'saving'
  let ok = false
  try {
    await conf.confSaving()
    ok = true
  } catch {
    // 具体错误已由 confSaving 内的 toast 提示
  }
  saveState.value = ok ? 'success' : 'error'
  saveStateTimer = setTimeout(
    () => {
      saveState.value = 'idle'
    },
    ok ? 2000 : 3000,
  )
}

onBeforeUnmount(() => clearTimeout(saveStateTimer))
</script>

<template>
  <UTheme
    :ui="{
      formField: {
        root: 'flex max-sm:flex-col justify-between gap-4 items-center',
        container: 'flex-1',
      },
      input: {
        root: 'w-full',
      },
      inputMenu: {
        root: 'w-full',
      },
      inputTags: {
        root: 'w-full',
      },
    }"
  >
    <div class="flex max-h-[75vh] min-h-0 flex-col gap-3">
      <div
        class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-muted bg-elevated/40 p-2 pl-3"
      >
        <UTabs
          v-model="configView"
          :items="[
            { label: '基础设置', value: 'basic', icon: 'i-lucide-sliders-horizontal' },
            { label: '高级设置', value: 'advanced', icon: 'i-lucide-settings-2' },
          ]"
          size="sm"
          :content="false"
        />
        <div class="flex items-center gap-2">
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-download"
            label="导出配置"
            data-help="将当前预设导出为 JSON 文件"
            @click="conf.confExport"
          />
          <UButton
            color="primary"
            variant="soft"
            size="sm"
            icon="i-lucide-upload"
            label="导入配置"
            data-help="从 JSON 文件导入配置，导入后请手动保存"
            @click="conf.confImport"
          />
        </div>
      </div>

      <UForm
        class="min-h-0 overflow-y-auto"
        :disabled="helper.workflowRunning.value || conf.isLoading.value"
      >
        <div class="pr-1">
          <Alert v-for="(items, index) in configItems[0]" :key="index" v-bind="items" />
          <UAccordion
            type="single"
            collapsible
            :items="accordionItems"
            :unmount-on-hide="false"
            default-value="filter"
            :ui="{
              root: 'my-0 mt-3 flex flex-col gap-2',
              item: 'rounded-lg border border-muted bg-default px-4',
              trigger: 'cursor-pointer text-sm',
              content: 'data-[state=open]:pt-1 data-[state=open]:pb-3 px-2 gap-3',
            }"
          >
            <template #default="{ item }">
              <span class="flex flex-col gap-1 text-left">
                <span>{{ item.label }}</span>
                <span class="text-xs font-normal text-muted">{{
                  groupMeta[item.value as string]?.description
                }}</span>
              </span>
            </template>
            <template #body="{ item }">
              <template v-for="(v, i) in item.items" :key="i">
                <ConfigItem v-if="v" :item="v" />
              </template>
            </template>
          </UAccordion>
          <div
            class="mt-3 flex flex-row flex-wrap gap-5 items-center rounded-lg border border-muted bg-elevated/40 p-3"
          >
            <UFormField label="配置级别" :data-help="formInfoData.configLevel['data-help']">
              <USelectMenu
                v-model="conf.formData.configLevel"
                :items="formInfoData.configLevel.options"
                value-key="value"
                label-key="label"
                :search-input="false"
              />
            </UFormField>
            <span data-help="可以在网站管理中打开通知权限,当停止时会自动发送桌面端通知提醒。">
              <UCheckbox label="发送通知" v-model="conf.formData.notification.value" />
            </span>
            <span
              v-if="conf.configLevel.expert || conf.formData.useCache.value"
              data-help="开启后会缓存投递记录，避免重复投递，提高效率。但是缓存功能并不积极维护。可能会有bug，或者意外情况，如遇到可尝试清空缓存或者禁用"
            >
              <UCheckbox label="启用缓存" v-model="conf.formData.useCache.value" />
            </span>
            <UButton
              v-if="conf.formData.useCache.value"
              color="warning"
              @click="() => getCacheManager().clearCache()"
            >
              清空缓存
            </UButton>
            <UFormField v-if="conf.configLevel.intermediate" label="投递数量">
              <UInputNumber
                label="投递数量"
                data-help="达到上限后会自动暂停，默认100次, 当前boss上限为150"
                v-model="conf.formData.deliveryLimit.value"
                :min="1"
                :max="155"
                :step="10"
              />
            </UFormField>
          </div>
        </div>
      </UForm>

      <div
        class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-muted bg-elevated/60 p-3"
      >
        <div class="flex flex-wrap items-center gap-2">
          <UButton
            :color="
              saveState === 'error' ? 'error' : saveState === 'success' ? 'success' : 'primary'
            "
            :icon="saveButton.icon"
            :label="saveButton.label"
            :loading="saveButton.loading"
            :disabled="saveButton.disabled"
            data-help="将当前配置保存到本地，不会自动刷新页面。"
            @click="handleSave"
          />
          <UButton
            color="warning"
            variant="soft"
            data-help="重新加载本地配置"
            @click="conf.confReload"
          >
            重载配置
          </UButton>
          <UButton
            color="primary"
            variant="soft"
            data-help="不同版本的参数可能会调整, 更新之后一键应用, 不会覆盖主要筛选条件"
            @click="conf.confRecommend"
          >
            使用推荐配置
          </UButton>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <UFormField
            label="预设:"
            data-help="虽然不维护多账号了, 但是预设还是要有的, 这样使用隐身/第三方扩展依旧能多账号使用. 多账号是一件多助人为乐的事呀"
          >
            <UInputMenu
              v-model="conf.formDataPreset.value"
              :items="conf.formDataPresets.value"
              value-key="value"
              create-item
              @create="conf.createPreset"
            />
          </UFormField>
          <UButton
            v-if="conf.configLevel.advanced"
            color="error"
            variant="soft"
            data-help="清空配置,不会帮你保存,可以重载恢复"
            @click="conf.confDelete"
          >
            清空配置
          </UButton>
        </div>
      </div>
    </div>
  </UTheme>
</template>
