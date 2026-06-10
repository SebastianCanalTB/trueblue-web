<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <section class="introduction">
    <div class="lg:tw-flex tw-w-full">
      <img
        src="/img/recipes/img-dog-rec.webp"
        alt="img-dog-rec"
        class="tw-mr-5 max-lg:tw-hidden tw-max-h-[431px] tw-bottom-0 tw-mt-auto"
        width="425px"
        height="431"
      />
      <div class="tw-flex tw-flex-col tw-justify-center">
        <h2 class="title primary1 tw-mb-4">
          {{ t('recipes.introduction.title') }}
        </h2>
        <i18n-t
          tag="p"
          keypath="recipes.introduction.description"
          class="tw-whitespace-pre-line"
        >
          <template #strong1>
            <strong class="strong-texts">
              {{ t('recipes.introduction.strongs.1') }}
            </strong>
          </template>
          <template #strong2>
            <strong class="strong-texts">
              {{ t('recipes.introduction.strongs.2') }}
            </strong>
          </template>
          <template #strong3>
            <strong class="strong-texts">
              {{ t('recipes.introduction.strongs.3') }}
            </strong>
          </template>
        </i18n-t>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.introduction {
  @apply lg:tw-px-[10%] max-lg:tw-px-5 tw-pt-10;
  background-color: #ffffff;
  position: relative;
  z-index: 2;
}

.strong-texts {
  @apply tw-font-treble-bold lg:!tw-text-[14px] tw-w-auto tw-text-[#575E6B];
  @apply max-lg:!tw-text-[12px];
}
</style>
