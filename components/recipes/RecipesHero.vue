<script setup lang="ts">
const props = defineProps<{
  imageForMainSection: string
  bannerLink: string
  userData: any
  title?: string
}>()

const emit = defineEmits<{
  (e: 'banner-click'): void
}>()

const { t } = useI18n()

const handleBannerClick = () => {
  emit('banner-click')
}
</script>

<template>
  <section class="main-section" @click="handleBannerClick">
    <div
      class="main-section-container"
      :style="{ backgroundImage: `url(${imageForMainSection})` }"
    >
      <h1 class="title white max-lg:!tw-text-[26px]">
        {{ title ? title : t('recipes.title') }}
      </h1>
    </div>
  </section>
</template>

<style scoped lang="scss">
.main-section {
  @apply lg:tw-h-[45vh] xl:tw-min-h-[50vh] 2xl:tw-min-h-[55vh] max-md:tw-min-h-[23vh];
  z-index: 1;
  position: relative;
  .main-section-container {
    @apply lg:tw-fixed lg:tw-w-full tw-mt-3 lg:tw-min-h-[45vh] xl:tw-min-h-[50vh] 2xl:tw-min-h-[55vh] max-md:tw-min-h-[23vh] tw-bg-cover tw-bg-center;
    @apply tw-flex tw-flex-col-reverse tw-justify-center;
    content: '';
    background-repeat: no-repeat;
    h1 {
      @apply lg:tw-w-[750px] tw-pl-[8%] tw-pt-[20%];
      @apply max-lg:tw-w-full max-lg:tw-px-[4%] max-lg:tw-pt-[16%];
    }
  }
}
</style>
