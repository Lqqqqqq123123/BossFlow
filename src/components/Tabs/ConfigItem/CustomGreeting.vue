<script lang="ts" setup>
import { formInfoData, useConf } from '@/composables/conf'
import { useHelper } from '@/composables/useHelper'
import { counter } from '@/message'
import type { CustomGreetingItem } from '@/types/formData'
import { withTimeout } from '@/utils/withTimeout'

const saveError = ref('')
const conf = useConf()
const helper = useHelper()
const advancedGreetingValue = ref<CustomGreetingItem[]>([])

const advancedGreetingModelRef = useTemplateRef('advancedGreetingModel')

function removeMessage(item: CustomGreetingItem) {
  advancedGreetingValue.value = advancedGreetingValue.value.filter((v) => v !== item)
}

function addMessage(type: CustomGreetingItem['type'] = 'text', index?: number) {
  let item: CustomGreetingItem | undefined
  if (type === 'text') {
    item = { type, content: '' }
  } else if (type === 'image') {
    item = {
      type,
      // image: {
      //   [helper.key]: { url: '' },
      // },
      image: '',
    }
  }

  if (!item) {
    return
  }

  if (
    typeof index === 'number' &&
    Number.isInteger(index) &&
    index >= 0 &&
    index <= conf.formData.customGreeting.value.length
  ) {
    advancedGreetingValue.value.splice(index, 0, item)
  } else {
    advancedGreetingValue.value.push(item)
  }
}

function advancedGreetingEnter(open: boolean) {
  if (!open) {
    return
  }
  if (!Array.isArray(conf.formData.customGreeting.value)) {
    advancedGreetingValue.value = [
      {
        type: 'text',
        content: conf.formData.customGreeting.value,
      },
    ]
  } else {
    advancedGreetingValue.value = JSON.parse(
      JSON.stringify(conf.formData.customGreeting.value),
    ) as CustomGreetingItem[]
  }
  saveError.value = ''
  advancedGreetingValue.value.forEach(async (item) => {
    try {
      if (item.type === 'image' && item.image && !item.model) {
        const response = await withTimeout(
          () => counter.getImage(item.image),
          10000,
          '图片加载超时，请刷新页面后重试',
        )
        if (!response.success) {
          throw new Error('图片未上传或已过期')
        }
        const u8Array = new Uint8Array(response.buffer)
        item.model = new File([u8Array.buffer], response.name, { type: response.type })
      }
    } catch (error) {
      saveError.value = error instanceof Error ? error.message : String(error)
    }
  })
}

const advancedGreetinSaveLoading = ref(false)

async function advancedGreetinSave(close: () => void) {
  if (advancedGreetinSaveLoading.value) return
  saveError.value = ''
  advancedGreetinSaveLoading.value = true
  try {
    for (const index in advancedGreetingValue.value) {
      const item = advancedGreetingValue.value[index]
      if (item.type === 'image') {
        if (item.model instanceof File) {
          const file = item.model as File
          const buffer = Array.from(new Uint8Array(await file.arrayBuffer()))
          const uploadedImage = await withTimeout(
            () =>
              counter.setImage({
                name: file.name,
                type: file.type,
                buffer,
              }),
            10000,
            '图片保存超时，请刷新页面后重试',
          )
          if (!uploadedImage.success || !uploadedImage.key) throw new Error('图片保存失败')
          item.image = uploadedImage.key
        }
        if (!item.image) throw new Error('请先选择要发送的图片')
      }
    }
    conf.formData.customGreeting.value = JSON.parse(
      JSON.stringify(
        advancedGreetingValue.value.map((item) =>
          item.type === 'image' ? { type: item.type, image: item.image } : item,
        ),
      ),
    ) as CustomGreetingItem[]
    await conf.confSaving()
    close()
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : String(error)
  } finally {
    advancedGreetinSaveLoading.value = false
  }
}

// function openImg(val: CustomGreetingItemImage['image'][string]) {
//   window.open(val.url ?? val.base64, '_blank')
// }
</script>

<template>
  <div data-help="自定义招呼语配置" class="flex flex-col gap-2">
    <div class="flex flex-row gap-3">
      <UCheckbox
        v-bind="formInfoData.customGreeting"
        v-model="conf.formData.customGreeting.enable"
      />
      <UCheckbox
        v-if="conf.configLevel.expert"
        v-bind="formInfoData.greetingVariable"
        v-model="conf.formData.greetingVariable.value"
      />
    </div>
    <UTextarea
      v-if="Array.isArray(conf.formData.customGreeting.value)"
      :disabled="true"
      placeholder="请使用高级进行配置"
      :rows="3"
      autoresize
      :maxrows="7"
      class="w-full"
    />
    <UTextarea
      v-else
      v-model="conf.formData.customGreeting.value"
      :disabled="conf.formData.aiGreeting.enable"
      :title="conf.formData.aiGreeting.enable && 'AI招呼语已启用, 自定义招呼语不可用'"
      :rows="3"
      autoresize
      :maxrows="7"
      class="w-full"
    />
    <UModal
      title="高级招呼语配置"
      description="文本和图片按列表顺序发送；点击保存后会保存当前配置。"
      :ui="{ footer: 'justify-end', content: 'sm:max-w-[70%]' }"
      @update:open="advancedGreetingEnter"
      :dismissible="false"
      :close="false"
      scrollable
    >
      <UButton label="高级招呼语配置(支持图片)" color="neutral" variant="subtle" />

      <template #body>
        <UAlert
          v-if="saveError"
          color="error"
          title="招呼语配置保存或加载失败"
          :description="saveError"
          class="mb-3"
        />
        <div class="flex flex-row gap-3 mb-3">
          <UButton color="primary" @click="addMessage('text')"> 添加文字消息 </UButton>
          <UButton color="primary" @click="addMessage('image')"> 添加图片消息 </UButton>
        </div>
        <div class="demo-dynamic space-y-3" ref="advancedGreetingModel">
          <div
            v-for="(item, index) in advancedGreetingValue"
            :key="index"
            class="flex items-start gap-2"
          >
            <div class="flex flex-col gap-1.5 w-20">
              <UDropdownMenu
                :items="[
                  { label: '向上插入 文字', onClick: () => addMessage('text', index) },
                  {
                    label: '向下插入 文字',
                    onClick: () => addMessage('text', index + 1),
                  },
                  {
                    label: '向上插入 图片',
                    onClick: () => addMessage('image', index),
                  },
                  {
                    label: '向下插入 图片',
                    onClick: () => addMessage('image', index + 1),
                  },
                ]"
                :portal="advancedGreetingModelRef?.parentElement ?? false"
                :content="{
                  align: 'start',
                  side: 'bottom',
                  sideOffset: 8,
                }"
              >
                <UButton label="插入" color="neutral" variant="outline" />
              </UDropdownMenu>
              <UButton
                color="error"
                variant="outline"
                @click.prevent="removeMessage(item)"
                class="w-full"
              >
                删除
              </UButton>
            </div>
            <UTextarea
              v-if="item.type === 'text'"
              v-model="item.content"
              autoresize
              :rows="2"
              :maxrows="6"
              class="flex-1"
            />
            <div v-else-if="item.type === 'image'">
              <!-- <img
                          :src="
                            item.image?.[helper.key]?.url ?? item.image?.[helper.key]?.base64 ?? ''
                          "
                          class="size-10"
                          @click="openImg(item.image[helper.key])"
                        /> -->
              <UFileUpload
                class="flex-1"
                size="xl"
                variant="area"
                :label="`上传图片(${helper.label})`"
                accept="image/*"
                v-model="item.model"
              />
            </div>
          </div>
        </div>
      </template>

      <template #footer="{ close }">
        <UButton label="取消" color="neutral" variant="outline" @click="close" />
        <UButton
          label="保存"
          color="neutral"
          @click="advancedGreetinSave(close)"
          :loading="advancedGreetinSaveLoading"
        />
      </template>
    </UModal>
  </div>
</template>
