<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <section class="characteristics">
    <h3 class="title primary1 tw-text-center">
      {{ t('recipes.characteristics.title') }}
      <strong>{{ t('recipes.characteristics.strong.1') }}</strong>
    </h3>
    <div
      class="lg:tw-grid lg:tw-grid-cols-2 tw-gap-4 max-lg:tw-flex max-lg:tw-flex-col lg:tw-mt-10 max-lg:tw-mt-5"
    >
      <div v-for="i in 7" :key="i" class="tw-flex tw-items-center tw-gap-2">
        <img
          src="/icons/recipes/ic_check.svg"
          alt="check"
          width="26px"
          height="26px"
        />
        <i18n-t tag="p" :keypath="`recipes.characteristics.text.${i}`">
          <template #strong>
            <strong class="strong-texts">
              {{ t('recipes.characteristics.strong.2') }}
            </strong>
          </template>
        </i18n-t>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.characteristics {
  @apply tw-relative tw-w-full tw-bg-[#F5F6FA] lg:tw-px-[10%] max-lg:tw-px-5 tw-py-10;
  z-index: 2;
}

.strong-texts {
  @apply tw-font-treble-bold lg:!tw-text-[14px] tw-w-auto tw-text-[#575E6B];
  @apply max-lg:!tw-text-[12px];
}
</style>
