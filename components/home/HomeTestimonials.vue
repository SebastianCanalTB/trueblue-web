<script setup lang="ts">
import { Carousel, Slide, Pagination } from 'vue3-carousel'
import 'vue3-carousel/dist/carousel.css'
const { t } = useI18n()
const systemStore = useSystemStore()
const { isMovil } = storeToRefs(systemStore)
const isLoading = ref(true)
const testimonials = ref([]) as any

for (let index = 1; index <= 5; index++) {
  testimonials.value.push({
    img: `/img/ic_testimonial_customer_${index}.png`,
    comment: t(`home.testimonials.clients.${index}.comment`),
    name: t(`home.testimonials.clients.${index}.name`),
    race: t(`home.testimonials.clients.${index}.race`),
  })
}

const carouselTesimonials = {
  itemsToShow: isMovil.value ? 1.2 : 3.9,
  snapAlign: 'center',
  wrapAround: true,
  autoplay: 10000,
  pauseAutoplayOnHover: true,
}
onMounted(() => {
  nextTick(() => {
    isLoading.value = true
    carouselTesimonials.itemsToShow = isMovil.value ? 1.2 : 3.9
    isLoading.value = false
  })
})
</script>

<template>
  <section v-if="!isLoading" class="general-testimonials">
    <h6 class="title primary1 mb-4">
      <strong class="pr-3">{{ $t('home.testimonials.metrics.value') }}</strong>
      {{ $t('home.testimonials.metrics.desc') }}
    </h6>
    <div class="score-container">
      <div class="score">
        <img
          src="/icons/ic_stars_score.svg"
          alt="score"
          width="106px"
          height="20px"
        />
        <p class="tw-text-[#2B7EE2] max-lg:tw-text-[12px]">
          {{ $t('home.testimonials.metrics.score') }}
        </p>
      </div>
    </div>

    <div class="tw-flex tw-flex-col lg:tw-w-full xl:tw-mx-auto">
      <h5 class="testimonial-title mb-2">
        {{ $t('home.testimonials.clients.title') }}
      </h5>

      <div class="general-carousel testimonials">
        <Carousel v-bind="carouselTesimonials">
          <Slide v-for="(slotProps, index) in testimonials" :key="index">
            <div class="testimonial">
              <p>
                {{ slotProps.comment }}
              </p>
              <img :src="slotProps.img" alt="testimonials" />
              <span>{{ slotProps.name }}</span>
              <small>{{ slotProps.race }}</small>
            </div>
          </Slide>
          <template #addons>
            <Pagination />
          </template>
        </Carousel>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.general-testimonials {
  @apply tw-relative tw-inline-block tw-w-full tw-text-center tw-overflow-hidden tw-mt-16;
  transition: transform 0.5s ease-in-out;
  opacity: 1;

  .score-container {
    .score {
      @apply tw-flex tw-items-center lg:tw-gap-5 tw-w-4/5 tw-mx-auto tw-max-w-[743px] tw-bg-[#d4e5f9] tw-pl-5 tw-rounded-md;
      @apply max-lg:tw-flex-col max-lg:tw-pt-2 max-lg:tw-gap-2 max-lg:tw-pr-6;
    }
  }

  .testimonial-title {
    @apply tw-justify-center tw-flex tw-w-full tw-mb-6 lg:tw-text-[32px] lg:tw-mt-11;
    color: #8ba0c9;
    font-family: 'heading-pro-medium-heavy';
    @apply max-lg:tw-text-[24px] max-lg:tw-mt-8;
  }
  .testimonial {
    @apply tw-flex tw-flex-col lg:tw-my-5 max-lg:tw-my-2 lg:tw-py-5 max-lg:tw-py-2 tw-items-center tw-w-[324px] tw-h-[352px] tw-mx-auto;
    border: 1px solid #8ba0c933;
    box-shadow: 2px 2px 8px #07112e14;
    border-radius: 40px;
    p {
      @apply tw-text-[#575E6B] tw-text-[13px] lg:tw-mt-5 max-lg:tw-mt-5 tw-mb-auto lg:tw-w-11/12 tw-text-center lg:tw-text-[14px];
      font-family: 'heading-pro-treble-book';
      line-height: 28px;
      @apply max-lg:tw-w-11/12;
    }
    span {
      @apply tw-text-[#575E6B] tw-text-[18px];
      font-family: 'heading-pro-treble-bold';
    }
    small {
      @apply tw-text-[#1A1A29] tw-text-[12px] tw-pb-5;
      font-family: 'heading-pro-treble-bold';
    }
  }
}
</style>
