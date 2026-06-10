<script setup lang="ts">
import { Carousel, Slide, Pagination } from 'vue3-carousel'
import 'vue3-carousel/dist/carousel.css'

const systemStore = useSystemStore()
const store = useOnboardingStore()
const { isMovil } = storeToRefs(systemStore)
const { t } = useI18n()
const carouselData = ref([
  {
    url: '/icons/ic_aafco.svg',
    content: 'home.sectionOne.carousel.1.text',
    strong: 'home.sectionOne.carousel.1.strong',
  },
  {
    url: '/icons/ic_tbs.svg',
    content: '',
    strong: '',
  },
  {
    url: '/icons/ic_fediaf.svg',
    content: 'home.sectionOne.carousel.2.text',
    strong: 'home.sectionOne.carousel.2.strong',
  },
])
</script>

<template>
  <div class="tb-infor-cards">
    <div v-if="isMovil" class="general-carousel">
      <Carousel
        :itemsToShow="1"
        :wrapAround="true"
        :autoplay="7000"
        :pauseAutoplayOnHover="true"
      >
        <Slide v-for="(item, index) in carouselData" :key="index">
          <div class="tb-infor-card">
            <img :src="item.url" alt="" />
            <i18n-t tag="p" :keypath="item.content">
              <template #strong>
                <strong class="strong-texts">
                  {{ t(item.strong) }}
                </strong>
              </template>
            </i18n-t>
          </div>
        </Slide>
        <template #addons>
          <Pagination />
        </template>
      </Carousel>
    </div>
    <div
      v-else
      class="tw-flex tw-justify-evenly tw-items-center tw-gap-4 tw-w-full"
    >
      <div
        v-for="(item, index) in carouselData"
        :key="index"
        class="tb-infor-card"
      >
        <img :src="item.url" alt="" />
        <i18n-t v-if="item.content" tag="p" :keypath="item.content">
          <template #strong>
            <strong class="strong-texts">
              {{ t(item.strong) }}
            </strong>
          </template>
        </i18n-t>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.tb-infor-cards {
  @apply tw-flex tw-flex-col tw-items-center tw-gap-4 lg:tw-p-6 max-lg:tw-py-7;
  @apply max-lg:tw-max-h-[157px];
  width: 100%;
  background-color: #ededf1;
  .tb-infor-card {
    @apply tw-flex tw-flex-col tw-items-center tw-gap-2 tw-text-center;
    @apply lg:tw-max-w-[293px];
    p {
      @apply tw-text-[#8BA0C9] tw-text-[11px];
    }
    .strong-texts {
      @apply tw-text-[#8BA0C9] tw-text-[11px] tw-font-treble-bold;
    }
  }
}
</style>
