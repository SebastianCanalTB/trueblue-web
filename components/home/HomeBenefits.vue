<script setup lang="ts">
import { Carousel, Slide, Pagination } from 'vue3-carousel'
import 'vue3-carousel/dist/carousel.css'
const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const systemStore = useSystemStore()
const store = useOnboardingStore()
const { isMovil } = storeToRefs(systemStore)
const { canSeePlanButton } = storeToRefs(store)
const userData = store.getLoginUser

const carouselConfigHomecard = {
  itemsToShow: 1.1,
  snapAlign: 'center',
  wrapAround: true,
  autoplay: 10000,
  pauseAutoplayOnHover: true,
}

const homeBenefitsCard = ref([
  {
    url: '/icons/ic_home_heart.svg',
    title: t('home.sectionBenefits.cards.first.title'),
    content: t('home.sectionBenefits.cards.first.content'),
  },
  {
    url: '/icons/ic_stomach.svg',
    title: t('home.sectionBenefits.cards.second.title'),
    content: t('home.sectionBenefits.cards.second.content'),
  },
  {
    url: '/icons/ic_water.svg',
    title: t('home.sectionBenefits.cards.third.title'),
    content: t('home.sectionBenefits.cards.third.content'),
  },
  {
    url: '/icons/ic_lightning.svg',
    title: t('home.sectionBenefits.cards.fourth.title'),
    content: t('home.sectionBenefits.cards.fourth.content'),
  },
  {
    url: '/icons/ic_defense.svg',
    title: t('home.sectionBenefits.cards.fifth.title'),
    content: t('home.sectionBenefits.cards.fifth.content'),
  },
])
</script>

<template>
  <section class="benefits">
    <div v-if="!isMovil" class="image-container">
      <img src="/img/img_dog.webp" alt="dog" />
    </div>
    <div class="content-text">
      <h5>
        {{ $t('home.sectionBenefits.title') }}
      </h5>
      <p class="tw-mb-4 tw-mr-3">
        {{ $t('home.sectionBenefits.content') }}
      </p>
      <Button
        v-if="!userData?.id"
        class="app-general-button btn-solo-create"
        @click="router.push(localePath({ name: 'registry' }))"
      >
        {{ $t('home.create') }}
      </Button>
      <Button
        v-if="userData?.id && canSeePlanButton"
        class="app-general-button btn-solo-create"
        @click="
          router.push(
            localePath({
              name: 'profile-my-profile',
            }),
          )
        "
      >
        {{ $t('home.plan') }}
      </Button>
    </div>
    <div v-if="isMovil" class="general-carousel">
      <Carousel v-bind="carouselConfigHomecard">
        <Slide v-for="(slotProps, index) in homeBenefitsCard" :key="index">
          <div class="home-card">
            <div class="header">
              <img :src="useSearchItemJson('url', slotProps)" alt="icon" />
              <h1>
                {{ useSearchItemJson('title', slotProps) }}
              </h1>
            </div>
            <p>
              {{ useSearchItemJson('content', slotProps) }}
            </p>
          </div>
        </Slide>
        <template #addons>
          <Pagination />
        </template>
      </Carousel>
    </div>
    <GeneralHomeCard
      v-if="!isMovil"
      :info="homeBenefitsCard"
      class="component-container"
    />
  </section>
</template>

<style lang="scss" scoped>
.benefits {
  @apply tw-relative tw-bg-[#F5F6FA] tw-z-20 tw-grid;
  grid-template-columns: repeat(3, 1fr);
  // grid-template-rows: 238px 185px 173px;
  @apply max-lg:tw-grid-cols-none max-lg:tw-flex max-lg:tw-flex-col;

  .content-text {
    @apply tw-flex tw-flex-col tw-justify-center tw-pl-5 lg:tw-pr-[10%];
    @apply max-lg:tw-pl-[10%] max-lg:tw-pb-[30px];
    grid-column: span 2;

    h5 {
      @apply lg:tw-text-[36px] tw-mb-0  max-lg:tw-mt-6;
      color: $primary-1;
      line-height: 1.3;
      font-family: 'heading-pro-medium-heavy';
      @apply max-lg:tw-text-[28px];
    }
  }

  .image-container {
    @apply tw-relative tw-max-h-[400px] tw-min-w-[410px];
    grid-row: span 2;

    img {
      @apply tw-w-[430px] tw-h-[124%];
      transform: translateY(-50px);
    }
  }
}
</style>
