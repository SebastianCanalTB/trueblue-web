<script setup lang="ts">
import { watch } from 'vue'
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  show: boolean
}>()
const plansStore = usePlanStore()
const { getAllReasonsToInactive: reasons } = storeToRefs(plansStore)
const emit = defineEmits(['close', 'confirm', 'update:reasonId'])

const { t } = useI18n()

const { handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(
    z.object({
      reasonId: z
        .number({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.require') }),
      cancelReason: z
        .string({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.require') }),
    }),
  ),
})

const { value: reasonId } = useField<number | null>('reasonId')
const { value: localCancelReason } = useField<string>('cancelReason')

const onConfirm = handleSubmit((values) => {
  emit('confirm', values)
})
onMounted(() => {
  nextTick(async () => {
    await plansStore.getReasonsToRefund()
  })
})
</script>

<template>
  <GeneralDialog :show="show" @close="emit('close')">
    <div class="tw-p-5">
      <span class="tw-text-[#003B71] tw-text-[20px] tw-font-treble-bold">{{
        $t('profile.myPlan.dialog.title')
      }}</span>
      <div class="tw-mt-2">
        <p class="tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book">
          {{ $t('profile.myPlan.dialog.message') }}
        </p>
        <p class="tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book tw-mt-5">
          {{ $t('profile.myPlan.dialog.messageSecond') }}
        </p>
        <span class="general-dropdown text-left tw-mt-4 tw-text-left">
          <label for="cancelReason">{{
            $t('forms.selectCancelReason.label')
          }}</label>
          <Select
            v-model="reasonId"
            :placeholder="$t('forms.selectCancelReason.placeholder')"
            :options="reasons"
            optionValue="id"
            optionLabel="name"
            :class="{ 'p-invalid': errors.reasonId }"
          ></Select>
          <GeneralInputError :error="errors['reasonId']" />
        </span>
        <span class="general-input textarea tw-mt-4">
          <label for="cancelReason">{{ $t('forms.cancelReason.label') }}</label>
          <textarea
            v-model="localCancelReason"
            :placeholder="$t('forms.cancelReason.placeholder')"
            style="resize: none; min-height: 75px"
            :class="{ '!tw-border-red-500': errors.cancelReason }"
          ></textarea>
          <GeneralInputError :error="errors['cancelReason']" />
        </span>
        <div class="tw-flex tw-mt-11 tw-w-full tw-justify-end">
          <Button
            class="app-general-button app-btn-transparent"
            :label="$t('button.cancel')"
            @click="emit('close')"
          />
          <Button
            class="app-general-button btn-solo-create"
            :label="$t('profile.myPlan.dialog.button')"
            autofocus
            @click="onConfirm"
          />
        </div>
      </div>
    </div>
  </GeneralDialog>
</template>
