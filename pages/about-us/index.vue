<script setup lang="ts">
const systemStore = useSystemStore()
const store = useOnboardingStore()
const bannerStore = useBannerStore()

const { getBannerInfo: banner } = storeToRefs(bannerStore)
const imageForMainSection = useSearchItemJson('[4].image', banner.value)
  ? useSearchItemJson('[4].image', banner.value)
  : '/img/who/bg_who_are_we.webp'

const bannerLink = useSearchItemJson('[4].link', banner.value) ?? ''
const userData = store.getLoginUser

const { isMovil } = storeToRefs(systemStore)

const hovered1 = ref(false)
const hovered2 = ref(false)
const hovered3 = ref(false)
const goToBannerLink = () => {
  if (bannerLink) {
    window.open(bannerLink, '_blank')
  }
}
</script>
<template>
  <div>
    <article class="content-page-who" :class="userData ? '' : ' tw-pt-10'">
      <section class="main-section" @click="goToBannerLink">
        <div
          class="main-section-container"
          :style="{ backgroundImage: `url(${imageForMainSection})` }"
        >
          <h1 class="title white max-lg:!tw-text-[26px]">
            {{ $t('who.firstSection.title') }}
          </h1>
        </div>
      </section>
      <section class="who-are-we">
        <div class="header">
          <h2
            class="title primary1 lg:!tw-text-[52px] max-lg:!tw-text-[28px] tw-text-center tw-mb-5"
          >
            {{ $t('who.whoAreWe.header.title') }}
          </h2>
          <span class="general-subtitle">
            {{ $t('who.whoAreWe.header.subtitle') }}
          </span>
          <p>
            {{ $t('who.whoAreWe.header.content') }}
          </p>
        </div>
        <div
          class="section-2"
          @mouseover="!isMovil ? (hovered1 = true) : ''"
          @mouseleave="!isMovil ? (hovered1 = false) : ''"
        >
          <div
            class="tw-flex tw-items-center max-lg:tw-flex-col tw-relative lg:tw-h-[299px] lg:col-12 tw-gap-2"
          >
            <div class="background" :class="{ expandedRight: hovered1 }"></div>
            <div class="lg:col-6">
              <img
                :src="
                  hovered1 === true
                    ? '/img/who/img_section2_1.webp'
                    : '/img/who/img_section2_2.webp'
                "
                class="image-transition"
                @click="isMovil ? (hovered1 = !hovered1) : ''"
                alt="Section Image"
                height="327px"
                width="505px"
              />
            </div>
            <div class="lg:col-6 tw-flex tw-flex-col max-lg:tw-py-10">
              <h3 class="title primary1">
                {{ $t('who.whoAreWe.1.title1') }}
              </h3>
              <strong class="title">
                {{ $t('who.whoAreWe.1.title2') }}
              </strong>
              <p class="tw-mt-5">{{ $t('who.whoAreWe.1.content') }}</p>
            </div>
          </div>
        </div>
        <div
          class="section-3"
          @mouseover="!isMovil ? (hovered2 = true) : ''"
          @mouseleave="!isMovil ? (hovered2 = false) : ''"
        >
          <div
            class="tw-flex tw-items-center max-lg:tw-flex-col-reverse tw-relative lg:tw-h-[299px] lg:col-12 tw-gap-2"
          >
            <div
              class="background startRight"
              :class="{ expandedRight: hovered2 }"
            ></div>
            <div class="lg:col-6 tw-flex tw-flex-col max-xl:tw-py-10">
              <h3 class="title primary1">
                {{ $t('who.whoAreWe.2.title') }}
              </h3>
              <p class="tw-mt-5">{{ $t('who.whoAreWe.2.content') }}</p>
            </div>
            <div class="lg:col-6">
              <img
                :src="
                  hovered2 === true
                    ? '/img/who/img_section3_1.webp'
                    : '/img/who/img_section3_2.webp'
                "
                @click="isMovil ? (hovered2 = !hovered2) : ''"
                class="image-transition"
                alt="Section Image"
                height="374px"
                width="382px"
              />
            </div>
          </div>
        </div>
        <div
          class="section-2 lg:tw-py-16"
          @mouseover="!isMovil ? (hovered3 = true) : ''"
          @mouseleave="!isMovil ? (hovered3 = false) : ''"
        >
          <div
            class="tw-flex tw-items-center max-lg:tw-flex-col tw-relative lg:tw-h-[299px] lg:col-12 tw-gap-2"
          >
            <div class="background" :class="{ expandedRight: hovered3 }"></div>
            <div class="lg:col-6">
              <img
                :src="
                  hovered3 === true
                    ? '/img/who/img_section4_1.webp'
                    : '/img/who/img_section4_2.webp'
                "
                @click="isMovil ? (hovered3 = !hovered3) : ''"
                class="image-transition"
                alt="Section Image"
                height="399px"
                width="460px"
              />
            </div>
            <div class="lg:col-6 tw-flex tw-flex-col max-xl:tw-py-10">
              <h3 class="title primary1">
                {{ $t('who.whoAreWe.3.title') }}
              </h3>
              <p class="tw-mt-5 tw-whitespace-pre-line">
                {{ $t('who.whoAreWe.3.content') }}
              </p>
            </div>
          </div>
        </div>
      </section>
      <section class="values">
        <div>
          <h4 class="title primary1 tw-text-center lg:tw-py-10">
            {{ $t('who.values.title') }}
          </h4>
        </div>
        <div class="card-container">
          <div v-for="index in 4" :key="index" class="card">
            <div class="tw-flex lg:tw-items-center tw-justify-between tw-mb-10">
              <span>
                {{ $t(`who.values.${index}.title`) }}
              </span>
              <img
                :src="`/icons/who/ic_who_${index}.svg`"
                alt="icons"
                height="48px"
                width="62px"
              />
            </div>
            <p>
              {{ $t(`who.values.${index}.content`) }}
            </p>
          </div>
        </div>
      </section>
    </article>
  </div>
</template>
<style scoped lang="scss">
.content-page-who {
  .main-section {
    @apply lg:tw-h-[70vh] xl:tw-min-h-[75vh] 2xl:tw-min-h-[80vh] max-md:tw-min-h-[23vh];
    z-index: 1;
    position: relative;
    .main-section-container {
      @apply lg:tw-fixed lg:tw-w-full tw-mt-3 lg:tw-min-h-[70vh] xl:tw-min-h-[75vh] 2xl:tw-min-h-[80vh] max-md:tw-min-h-[23vh] tw-bg-cover tw-bg-center;
      @apply tw-flex tw-flex-col-reverse tw-justify-center;
      content: '';
      background-repeat: no-repeat;
      h1 {
        @apply lg:tw-w-[750px] tw-pl-[8%] tw-pt-[20%];
        @apply max-lg:tw-w-full max-lg:tw-px-[4%] max-lg:tw-pt-[16%];
      }
    }
  }
  .who-are-we {
    @apply tw-px-[10%] lg:tw-pb-20;
    background-color: #ffffff;
    position: relative;
    z-index: 2;
    .header {
      @apply lg:tw-w-3/4 tw-mx-auto tw-pt-14;
      p {
        @apply lg:tw-text-[14px] tw-mt-5 max-lg:tw-text-[12px];
      }
    }
    .background {
      @apply tw-absolute lg:tw-bottom-0 xl:tw-left-[4%] 2xl:tw-left-[2%] tw-rounded-[27px] tw-h-[51%] tw-w-[45%];
      @apply max-lg:tw-h-[118px] max-lg:tw-w-[100%] max-lg:tw-top-[68px];
      background-color: #ededf1;
      z-index: -1;
      transition: all 0.5s ease-in-out;
      &.startRight {
        @apply tw-absolute lg:tw-bottom-0  tw-left-auto lg:tw-right-[4%] 2xl:tw-right-[2%] tw-rounded-[27px] lg:tw-h-[51%] lg:tw-w-[45%];
        @apply max-lg:tw-h-[118px] max-lg:tw-w-[100%] max-lg:tw-top-[68px];
      }
    }

    .background.expandedRight {
      @apply lg:tw-h-full lg:tw-w-full lg:tw-rounded-[27px];
    }
    .section-2 {
      @apply lg:tw-my-[70px] max-lg:tw-mb-[70px] tw-relative tw-h-[400px];
      h3 {
        @apply lg:tw-text-[40px] max-lg:tw-text-[28px];
      }
      strong {
        @apply lg:tw-text-[32px] max-lg:tw-text-[20px];
      }
      .image-transition {
        @apply lg:tw-absolute tw-left-[2%] tw-bottom-0;
        @apply max-lg:tw-h-[184px] max-lg:tw-w-[237px];
        transition:
          opacity 1.5s ease-in-out,
          transform 1.5s ease-in-out;
        opacity: 1;
        &:hover {
          transform: scale(1.02);
        }
      }
    }
    .section-3 {
      @apply tw-relative tw-min-h-[342px];
      h3 {
        @apply lg:tw-text-[40px] max-lg:tw-text-[28px];
      }
      .image-transition {
        @apply lg:tw-absolute tw-right-[5%] tw-bottom-0;
        @apply max-lg:tw-h-[184px] max-lg:tw-w-[220px];
        transition:
          opacity 1.5s ease-in-out,
          transform 1.5s ease-in-out;
        opacity: 1;
        &:hover {
          transform: scale(1.02);
        }
      }
    }
  }
  .values {
    @apply tw-pt-10 tw-relative;
    z-index: 2;
    background-color: #f5f6fa;
    .card-container {
      @apply tw-w-full tw-flex tw-mx-auto tw-justify-around tw-gap-8 tw-px-10 tw-py-10 max-lg:tw-flex-col;
      .card {
        @apply tw-p-[20px] tw-w-[100%] tw-rounded-2xl;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        background-color: #ffffff;
        span {
          @apply tw-text-[22px];
          font-family: 'heading-pro-treble-bold';
        }
      }
    }
  }
}
</style>
