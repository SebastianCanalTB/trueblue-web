<script setup lang="ts">
import { Carousel, Slide, Pagination, Navigation } from 'vue3-carousel'
import 'vue3-carousel/dist/carousel.css'
const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const systemStore = useSystemStore()
const store = useOnboardingStore()
const { isMovil } = storeToRefs(systemStore)
const { canSeePlanButton } = storeToRefs(store)
const userData = store.getLoginUser
const isLoading = ref(true)
const carouselConfig = {
  itemsToShow: isMovil.value ? 1.2 : 1.5,
  snapAlign: 'center',
  wrapAround: true,
  autoplay: 10000,
  pauseAutoplayOnHover: true,
  breakpointMode: 'carousel',
}

const vets = ref([
  {
    img: '/img/ic_vet-3.webp',
    text: t('home.vetsSection.second.1.content'),
    vetsName: t('home.vetsSection.second.1.doctor'),
    profession: t('home.vetsSection.second.1.profession'),
  },
  {
    img: '/img/ic_vet_2.webp',
    text: t('home.vetsSection.second.2.content'),
    vetsName: t('home.vetsSection.second.2.doctor'),
    profession: t('home.vetsSection.second.2.profession'),
  },
  {
    img: '/img/ic_vet.webp',
    text: t('home.vetsSection.second.3.content'),
    vetsName: t('home.vetsSection.second.3.doctor'),
    profession: t('home.vetsSection.second.3.profession'),
  },
  {
    img: '/img/ic_vet-2.webp',
    text: t('home.vetsSection.second.4.content'),
    vetsName: t('home.vetsSection.second.4.doctor'),
    profession: t('home.vetsSection.second.4.profession'),
  },
])
onMounted(() => {
  nextTick(() => {
    isLoading.value = false
    carouselConfig.itemsToShow = isMovil.value ? 1.2 : 1.5
  })
})
</script>

<template>
  <section v-if="!isLoading" class="vets">
    <div>
      <div class="vets-content-first">
        <div class="title-vets">
          <h6>
            {{ $t('home.vetsSection.first.title.first') }}
          </h6>
          <p class="tw-mx-auto lg:tw-w-3/5">
            {{ $t('home.vetsSection.first.content') }}
            <br />
            <br />
            {{ $t('home.vetsSection.first.content2') }}
          </p>
        </div>
        <div
          class="tw-w-full tw-flex tw-justify-center max-lg:tw-flex-row-reverse max-lg:tw-bottom-4 max-lg:tw-relative lg:tw-mt-4"
        >
          <Button
            v-if="!userData?.id"
            class="app-general-button btn-300px primary-1 max-lg:!tw-w-3/4 max-lg:!tw-h-[38px]"
            @click="router.push(localePath({ name: 'registry' }))"
          >
            {{ $t('home.create') }}
          </Button>
          <Button
            v-if="userData?.id && canSeePlanButton"
            class="app-general-button btn-300px primary-1 max-lg:!tw-w-3/4 max-lg:!tw-h-[38px]"
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
        <div class="checks-container">
          <div class="checks" v-for="index in 4" :key="index">
            <img
              src="/icons/ic_checks_home.svg"
              class="max-lg:tw-w-[18px] max-lg:tw-h-[18px] lg:tw-w-6 lg:tw-h-6"
              alt="check"
            />
            <strong>
              {{ $t(`home.vetsSection.first.${index}`) }}
            </strong>
          </div>
        </div>
      </div>
      <div class="general-carousel">
        <Carousel v-bind="carouselConfig">
          <Slide v-for="(vet, index) in vets" :key="index">
            <div class="vets-container">
              <div class="vets-content-second">
                <div class="vets-img-container">
                  <img
                    :src="vet?.img"
                    alt="veterinary"
                    class="lg:tw-h-[285px] max-lg:tw-h-[112px] max-lg:tw-w-[112px]"
                  />
                </div>
                <div class="content">
                  <div>
                    <p class="!tw-leading-4">{{ vet.text }}</p>
                    <div class="vets-testimonial">
                      <span>{{ vet.vetsName }}</span>
                      <small>{{ vet.profession }}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Slide>
          <template #addons>
            <Navigation>
              <template #next>
                <div class="circle-tab xl:tw-relative">
                  <img
                    class="tw-size-6 tw-max-w-none"
                    src="/icons/ic_arrowBack.svg"
                    alt="next"
                  />
                </div>
              </template>
              <template #prev>
                <div class="circle-tab xl:tw-relative">
                  <img
                    class="tw-size-6 tw-max-w-none"
                    src="/icons/ic_arrowStraight.svg"
                    alt="prev"
                  />
                </div>
              </template>
            </Navigation>
            <Pagination />
          </template>
        </Carousel>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.vets {
  @apply tw-h-auto tw-bg-no-repeat tw-bg-[#f5f6fa] lg:tw-pb-20 max-lg:tw-pb-4 max-lg:tw-relative;
  .vets-content-first {
    @apply lg:tw-min-h-[370px] tw-relative;

    .title-vets {
      @apply tw-pb-9 lg:tw-pt-[70px] lg:tw-w-10/12 max-lg:tw-w-11/12 tw-mx-auto tw-text-center;
      font-family: 'heading-pro-treble-bold';

      h6 {
        @apply tw-mb-6 lg:tw-text-[48px] tw-my-0;
        @apply lg:tw-text-[48px] max-lg:tw-text-[28px];
        color: $primary-1;
        font-family: 'heading-pro-medium-heavy';
      }

      .img-bg-container {
        position: absolute;

        &.corner-1 {
          @apply lg:tw-bottom-[42%] tw-left-0;
          @apply max-lg:tw-top-[5%] max-lg:tw-h-[64px] max-lg:tw-w-[64px];
        }

        &.corner-2 {
          @apply tw-bottom-[42%] tw-right-0;
          @apply max-lg:tw-top-[5%] max-lg:tw-h-[80px] max-lg:tw-w-[80px];
        }
      }
    }

    .checks-container {
      @apply lg:tw-flex lg:tw-justify-center lg:tw-gap-[25px] lg:tw-w-4/5 tw-px-[30px] tw-mx-auto tw-my-10;
      @apply max-lg:tw-grid max-lg:tw-grid-cols-2;
      .checks {
        @apply tw-flex tw-gap-5 max-lg:tw-mt-5;
        strong {
          @apply max-lg:tw-text-[13px];
          font-family: 'heading-pro-treble-bold';
          color: #25282b;
        }
      }
    }
  }
  .vets-container {
    @apply lg:tw-h-[350px] tw-mx-auto lg:tw-bottom-[57px] tw-relative lg:tw-w-[934px] tw-px-[8px];
    @apply max-lg:tw-flex max-lg:tw-flex-col max-lg:tw-items-center max-lg:tw-mt-[137px];
    .vets-content-second {
      @apply tw-max-h-[250px] tw-bg-white lg:tw-w-full tw-relative lg:tw-rounded-[40px] tw-flex tw-items-center tw-bottom-[-30%];
      @apply max-lg:tw-h-[208px] max-lg:tw-w-[320px] max-lg:tw-rounded-[17px];
      .vets-img-container {
        @apply max-lg:tw-w-[112px] max-lg:tw-h-[112px] max-lg:tw-overflow-hidden max-lg:tw-rounded-full  lg:tw-w-full max-lg:tw-absolute max-lg:tw-top-[-127px] max-lg:tw-left-[33%];
        img {
          @apply lg:tw-relative max-lg:tw-bottom-0 lg:tw-bottom-[18px] lg:tw-object-cover;
          @apply max-lg:tw-absolute  max-lg:tw-object-cover max-lg:tw-object-center max-lg:!tw-rounded-full;
        }
      }
      .content {
        @apply lg:tw-pr-[50px];
        @apply max-lg:tw-pr-3 max-lg:tw-pl-5 max-lg:tw-h-[230px] max-lg:tw-flex max-lg:tw-flex-col max-lg:tw-justify-center;
        h6 {
          @apply lg:!tw-mt-5 max-lg:!tw-mt-1 !tw-mb-1 tw-justify-start max-lg:!tw-text-[20px] max-lg:tw-text-center;
        }
        p {
          @apply max-lg:tw-text-[12px] max-lg:!tw-mt-2 !tw-leading-6 max-lg:!tw-leading-4;
        }
        .vets-testimonial {
          @apply tw-flex tw-flex-col tw-py-4;
          span {
            @apply lg:tw-text-[18px] tw-text-[#575E6B] max-lg:tw-text-[12px];
            font-family: 'heading-pro-treble-bold';
            color: #575e6b;
          }

          small {
            @apply lg:tw-text-[12px] max-lg:tw-text-[11px] lg:tw-mt-2;
            color: #1a1a29;
            font-family: 'heading-pro-treble-bold';
          }
        }
      }
    }
  }
}
</style>
