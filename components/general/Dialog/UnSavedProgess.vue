<script setup lang="ts">
const emit = defineEmits(['update:show', 'continueWithoutSaving'])
const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})
const showUpdateDialog = ref(props.show)
const { t } = useI18n()
const continueWithoutSaving = () => {
  emit('continueWithoutSaving')
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
  <GeneralDialog :show="showUpdateDialog">
    <div class="lg:tw-p-5 max-lg:tw-p-3">
      <span class="tw-text-[#003B71] tw-text-[20px] tw-font-treble-bold">{{
        $t('profile.myPlan.unSavedDialog.title')
      }}</span>
      <div class="tw-mt-2">
        <p class="tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book">
          {{ $t('profile.myPlan.unSavedDialog.content') }}
        </p>
        <div class="tw-flex tw-mt-11 tw-w-full tw-justify-end tw-gap-2">
          <Button
            class="app-general-button app-btn-transparent"
            :label="$t('profile.myPlan.unSavedDialog.leave')"
            @click="continueWithoutSaving()"
          />
          <Button
            class="app-general-button btn-solo-create"
            :label="$t('profile.myPlan.unSavedDialog.contine')"
            autofocus
            @click="showUpdateDialog = false"
          />
        </div>
      </div>
    </div>
  </GeneralDialog>
</template>
