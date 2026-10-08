<script setup lang="ts">
import { useConf } from '@/composables/conf'
const conf = useConf()
const modes = [
  { label: '固定间隔', value: 'fixed' },
  { label: '随机间隔', value: 'random' },
]
</script>

<template>
  <div class="col-span-2 space-y-3 rounded-lg border border-muted p-3">
    <UFormField
      label="岗位投递间隔"
      description="每个岗位处理完成后等待，再处理下一个岗位；单位为秒。"
    >
      <USelect v-model="conf.formData.delayDeliveryIntervalMode" :items="modes" class="w-full" />
    </UFormField>
    <UFormField v-if="conf.formData.delayDeliveryIntervalMode !== 'random'" label="固定秒数">
      <UInputNumber v-model="conf.formData.delayDeliveryInterval" :min="1" :max="99999" />
    </UFormField>
    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <UFormField label="最短间隔（秒）">
        <UInputNumber v-model="conf.formData.delayDeliveryIntervalMin" :min="1" :max="99999" />
      </UFormField>
      <UFormField label="最长间隔（秒）">
        <UInputNumber v-model="conf.formData.delayDeliveryIntervalMax" :min="1" :max="99999" />
      </UFormField>
      <p class="sm:col-span-2 text-xs text-muted">
        每次在范围内随机等待；上下限填反时自动按较小值到较大值处理。修改后点击保存配置。
      </p>
    </div>
  </div>
</template>
