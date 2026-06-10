<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <section class="plate">
    <div class="tw-w-full">
      <h4 class="title primary1 tw-text-center">
        {{ t('recipes.plate.title') }}
      </h4>
      <p class="description">
        {{ t('recipes.plate.description') }}
      </p>
    </div>
    <div class="plate-data lg:tw-w-[1050px] lg:tw-mx-auto lg:tw-p-6">
      <div class="plate-data-container">
        <div class="tw-col-span-5 tw-relative">
          <div class="tw-relative tw-w-full tw-max-w-sm tw-mx-auto">
            <div class="tw-overflow-hidden">
              <img src="/img/fresh/dish2.webp" alt="plate" class="img-plate" />
            </div>

            <div
              class="tw-absolute tw-top-[15%] tw-left-[65%] tw-w-4/5 max-lg:tw-hidden"
            >
              <img src="/icons/recipes/ic_line.svg" alt="line" />
            </div>

            <div
              class="tw-absolute tw-top-[42%] tw-left-[65%] tw-w-4/5 max-lg:tw-hidden"
            >
              <img src="/icons/recipes/ic_line.svg" alt="line" />
            </div>

            <div
              class="tw-absolute tw-top-[62%] tw-left-[65%] tw-w-4/5 max-lg:tw-hidden"
            >
              <img src="/icons/recipes/ic_line.svg" alt="line" />
            </div>
          </div>
        </div>

        <div class="text-plate-items">
          <i18n-t tag="p" keypath="recipes.plate.text.1" class="item-plate">
            <template #strong>
              <strong class="strong-texts">
                {{ t('recipes.plate.text.strongs.1') }}
              </strong>
            </template>
          </i18n-t>

          <i18n-t tag="p" class="item-plate" keypath="recipes.plate.text.2">
            <template #strong>
              <strong class="strong-texts">
                {{ t('recipes.plate.text.strongs.2') }}
              </strong>
            </template>
          </i18n-t>

          <i18n-t tag="p" keypath="recipes.plate.text.3" class="item-plate">
            <template #strong>
              <strong class="strong-texts">
                {{ t('recipes.plate.text.strongs.3') }}
              </strong>
            </template>
          </i18n-t>
          <div class="result-card">
            <p>
              <strong class="strong-texts">{{
                t('recipes.plate.text.strongs.4')
              }}</strong>
              {{ t('recipes.plate.text.extra') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.plate {
  @apply tw-relative tw-w-full tw-bg-white max-lg:tw-px-5 tw-py-10;
  z-index: 2;
  .description {
    @apply lg:tw-text-[20px] tw-text-[#575E6B] tw-font-treble-bold tw-text-center tw-my-3 lg:lg:tw-px-[15%] max-lg:tw-px-5;
    @apply max-lg:tw-text-[14px];
  }
  .plate-data {
    @apply lg:tw-w-[1050px] lg:tw-mx-auto lg:tw-p-6;
    .plate-data-container {
      @apply lg:tw-grid lg:tw-grid-cols-12 tw-gap-4 tw-items-center;
      @apply max-lg:tw-flex max-lg:tw-flex-col;

      .text-plate-items {
        @apply lg:tw-col-span-7 lg:tw-space-y-8 tw-flex tw-flex-col lg:tw-ml-44 lg:tw-min-w-[460px] lg:tw-translate-y-10;
        @apply max-lg:tw-gap-4;
        .item-plate {
          @apply max-lg:tw-ml-6 max-lg:tw-relative;
          &::before {
            @apply lg:tw-hidden tw-translate-y-1;
            content: '';
            left: -58px;

            width: 52px;
            height: 16px;
            position: absolute;
            background-image: url('/icons/recipes/ic_line_mobile.svg');
          }
        }
      }
      .result-card {
        @apply tw-bg-[#575E6B] tw-bg-opacity-10 tw-p-4 lg:tw-max-w-[460px] tw-mb-3;
        border-radius: 12px;
      }
      .img-plate {
        @apply lg:tw-w-[379px] lg:tw-h-[379px];
        @apply max-lg:tw-w-[280px] max-lg:tw-h-[280px];
      }
    }
  }
}

.strong-texts {
  @apply tw-font-treble-bold lg:!tw-text-[14px] tw-w-auto tw-text-[#575E6B];
  @apply max-lg:!tw-text-[12px];
}
</style>
