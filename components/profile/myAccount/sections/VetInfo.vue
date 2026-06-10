<script setup lang="ts">
const props = defineProps<{
  profile: any
}>()

const emit = defineEmits(['edit'])
</script>

<template>
  <div class="tw-mt-8">
    <div class="tw-flex tw-justify-end">
      <Button
        @click="emit('edit')"
        class="app-general-button app-btn-transparent label-primary max-lg:!tw-p-0 !tw-mr-0"
        :label="$t('button.editData')"
      >
        <template #icon>
          <img src="/icons/profile/ic_edit.svg" alt="edit" />
        </template>
      </Button>
    </div>
    <div class="my-account-card">
      <div class="account-content-card">
        <img
          class="tw-rounded-full tw-h-[78px] tw-w-[78px]"
          :src="
            useSearchItemJson('photoUrl', profile)
              ? useSearchItemJson('photoUrl', profile)
              : '/icons/profile/ic_my_account.svg'
          "
          alt="default_img"
          height="78px"
          width="78px"
        />
        <div class="max-lg:tw-text-center tw-flex tw-flex-col tw-gap-1">
          <h2>
            {{
              useTruncateText(useSearchItemJson('firstName', profile), 20) +
              ' ' +
              useTruncateText(useSearchItemJson('lastName', profile), 20)
            }}
          </h2>
          <p v-if="useSearchItemJson('document', profile)">
            {{ useSearchItemJson('document', profile) }}
          </p>
          <p v-if="useSearchItemJson('vetInfo.worksite', profile)">
            {{ useSearchItemJson('vetInfo.worksite', profile) }}
          </p>
          <p>{{ useSearchItemJson('email', profile) }}</p>
          <p>{{ useSearchItemJson('phone', profile) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.my-account-card {
  @apply tw-bg-[#FFFFFF] tw-w-full lg:tw-h-[140px] tw-rounded-2xl tw-flex tw-items-center;
  @apply max-lg:tw-pb-10 max-lg:tw-flex-col;
  .account-content-card {
    @apply tw-ml-5 tw-flex lg:tw-gap-10 tw-items-center;
    @apply max-lg:tw-flex max-lg:tw-flex-col  max-lg:tw-mt-5 max-lg:tw-gap-2;
    h2 {
      @apply tw-text-[#575E6B] tw-text-[18px];
      font-family: 'heading-pro-treble-bold';
    }
    p {
      @apply tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book;
    }
  }
}
</style>
