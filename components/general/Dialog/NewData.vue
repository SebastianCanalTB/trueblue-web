<script setup lang="ts">
const emit = defineEmits(['update:show', 'onlyThis', 'allPlan'])
const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})
const showUpdateDialog = ref(props.show)
const { t } = useI18n()
const onlyThis = () => {
  emit('onlyThis')
  showUpdateDialog.value = false
}
const allPlan = () => {
  emit('allPlan')
  showUpdateDialog.value = false
}
watch(
  () => props.show,
  (newValue) => {
    showUpdateDialog.value = newValue
  },
)
watch(showUpdateDialog, (newValue) => {
  emit('update:show', newValue)
})
</script>

<template>
  <GeneralDialog :show="showUpdateDialog" width="600px">
    <div class="tw-p-5">
      <span class="tw-text-[#003B71] tw-text-[20px] tw-font-treble-bold">{{
        $t('generalDialogs.newData.title')
      }}</span>
      <div class="tw-mt-2">
        <p class="tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book">
          {{ $t('generalDialogs.newData.message') }}
        </p>

        <div class="tw-flex tw-mt-8 tw-w-full tw-justify-end tw-gap-3">
          <Button
            class="app-general-button app-btn-transparent !tw-w-1/2 !tw-border-[#043B71]"
            :label="t('generalDialogs.newData.allPlan')"
            @click="allPlan"
          />
          <Button
            class="app-general-button btn-solo-create !tw-w-1/2"
            :label="t('generalDialogs.newData.onlyThisPlan')"
            autofocus
            @click="onlyThis"
          />
        </div>
      </div>
    </div>
  </GeneralDialog>
</template>
