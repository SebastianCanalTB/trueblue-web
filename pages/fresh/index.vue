<script setup lang="ts">
const systemStore = useSystemStore()
const bannerStore = useBannerStore()

const { getBannerInfo: banner } = storeToRefs(bannerStore)
const imageForMainSection = useSearchItemJson('[3].image', banner.value)
  ? useSearchItemJson('[3].image', banner.value)
  : '/img/fresh/background.webp'
const bannerLink = useSearchItemJson('[3].link', banner.value) ?? ''
const { isMovil } = storeToRefs(systemStore)

const goToBannerLink = () => {
  if (bannerLink) {
    window.open(bannerLink, '_blank')
  }
}
onMounted(() => {
  const container = document.querySelector('.imgs-container') as HTMLElement
  const sliderBar = document.querySelector('.slider-bar') as HTMLElement
  const imgLeft = document.querySelector('.img-left') as HTMLElement
  const imgRight = document.querySelector('.img-right') as HTMLElement
  let isDragging = false

  const handleMove = (clientX: number) => {
    if (isDragging && container) {
      const containerRect = container.getBoundingClientRect()
      let offsetX = clientX - containerRect.left

      if (offsetX < 0) offsetX = 0
      if (offsetX > containerRect.width) offsetX = containerRect.width

      sliderBar.style.left = `${offsetX}px`

      const percentage = (offsetX / containerRect.width) * 100
      imgLeft.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`
      imgRight.style.clipPath = `inset(0 0 0 ${percentage}%)`
    }
  }

  sliderBar.addEventListener('mousedown', (e: MouseEvent) => {
    isDragging = true
  })

  document.addEventListener('mousemove', (e: MouseEvent) => {
    handleMove(e.clientX)
  })

  document.addEventListener('mouseup', () => {
    isDragging = false
  })

  sliderBar.addEventListener('touchstart', (e: TouchEvent) => {
    e.preventDefault()
    isDragging = true
  })

  document.addEventListener('touchmove', (e: TouchEvent) => {
    if (isDragging && e.touches.length > 0) {
      handleMove(e.touches[0].clientX)
    }
  })

  document.addEventListener('touchend', () => {
    isDragging = false
  })
})
</script>

<template>
  <div class="tw-h-full">
    <article class="content-page-fresh">
      <section class="main-section" @click="goToBannerLink">
        <div
          class="main-section-container"
          :style="{ backgroundImage: `url(${imageForMainSection})` }"
        >
          <h1 class="title white max-lg:!tw-text-[26px]">
            {{ $t('fresh.header.title') }}
            <br />
            {{ $t('fresh.header.subtitle') }}
          </h1>
        </div>
      </section>
      <section class="section">
        <div class="content">
          <div v-if="!isMovil" class="first">
            <div class="first-content">
              <span class="tw-text-[#25282B] tw-text-[14px]">
                {{ $t('fresh.content.1.title') }}
              </span>
              <p class="tw-text-[#575E6B] tw-text-[12px] tw-pt-3">
                {{ $t('fresh.content.1.content') }}
              </p>
            </div>
            <div class="second-content">
              <span class="tw-text-[#25282B] tw-text-[14px]">
                {{ $t('fresh.content.2.title') }}
              </span>
              <p class="tw-text-[#575E6B] tw-text-[12px] tw-pt-3">
                {{ $t('fresh.content.2.content') }}
              </p>
            </div>
          </div>

          <img
            src="/icons/fresh/leftUp.svg"
            alt="line-Left-Up"
            class="max-lg:tw-hidden tw-top-[-70px] tw-relative tw-right-[-50px]"
          />
          <img
            src="/icons/fresh/leftDown.svg"
            alt="line-Left-Up"
            class="max-lg:tw-hidden img-left-down"
          />
          <div class="imgs-container tw-z-20">
            <div class="img-wrapper">
              <img
                src="/img/fresh/dish2.webp"
                alt="human_dish"
                class="img img-left"
              />
              <img
                src="/img/fresh/dish1.webp"
                alt="human_dish"
                class="img img-right"
              />
            </div>
            <div class="slider-bar">
              <img
                src="/icons/fresh/ic_arrows.svg"
                alt="sign-arrows"
                class="arrows"
              />
            </div>
          </div>
          <img
            src="/icons/fresh/rightUp.svg"
            alt="line-Left-Up"
            class="max-lg:tw-hidden tw-top-[-70px] tw-relative tw-z-10 tw-right-[50px]"
          />
          <img
            src="/icons/fresh/rightDown.svg"
            alt="line-Left-Up"
            class="max-lg:tw-hidden img-right-down tw-z-10"
          />
          <div v-if="isMovil" class="first">
            <div class="first-content">
              <span class="tw-text-[#25282B] tw-text-[14px]">
                {{ $t('fresh.content.1.title') }}
              </span>
              <p class="tw-text-[#575E6B] tw-text-[12px] tw-pt-3">
                {{ $t('fresh.content.1.content') }}
              </p>
            </div>
            <div class="second-content">
              <span class="tw-text-[#25282B] tw-text-[14px]">
                {{ $t('fresh.content.2.title') }}
              </span>
              <p class="tw-text-[#575E6B] tw-text-[12px] tw-pt-3">
                {{ $t('fresh.content.2.content') }}
              </p>
            </div>
          </div>
          <div class="second">
            <div class="first-content">
              <span class="tw-text-[#25282B] tw-text-[14px]">
                {{ $t('fresh.content.3.title') }}
              </span>
              <p class="tw-text-[#575E6B] tw-text-[12px] tw-pt-3">
                {{ $t('fresh.content.3.content') }}
              </p>
            </div>
            <div class="second-content">
              <span class="tw-text-[#25282B] tw-text-[14px]">
                {{ $t('fresh.content.4.title') }}
              </span>
              <p class="tw-text-[#575E6B] tw-text-[12px] tw-pt-3">
                {{ $t('fresh.content.4.content') }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </article>
  </div>
</template>
<style scoped lang="scss">
.content-page-fresh {
  @apply max-lg:tw-pb-10;
  background-color: #f5f6fa;
  .main-section {
    @apply lg:tw-h-[60vh] xl:tw-min-h-[65vh] 2xl:tw-min-h-[70vh] max-md:tw-min-h-[23vh];
    z-index: 1;
    position: relative;
    .main-section-container {
      @apply lg:tw-w-full lg:tw-mt-3 max-lg:tw-mt-8 lg:tw-min-h-[60vh] xl:tw-min-h-[65vh] 2xl:tw-min-h-[70vh] max-md:tw-min-h-[23vh] tw-bg-cover tw-bg-center;
      @apply tw-flex tw-flex-col-reverse tw-justify-center;
      content: '';
      background-repeat: no-repeat;
      h1 {
        @apply lg:tw-w-[750px] tw-pl-[8%] tw-pt-[20%];
        @apply max-lg:tw-w-full max-lg:tw-px-[4%] max-lg:tw-pt-[16%];
      }
    }
  }
  .section {
    @apply max-lg:tw-h-3/4 lg:tw-min-h-[560px];

    .content {
      @apply tw-flex tw-justify-center tw-relative tw-my-20;
      @apply max-lg:tw-h-auto max-lg:tw-flex-col max-lg:tw-items-center;
      .first {
        @apply tw-flex lg:tw-absolute tw-w-full lg:tw-flex lg:tw-justify-center lg:tw-gap-[600px] tw-px-5 tw-mb-5;
        @apply max-lg:tw-items-center max-lg:tw-h-auto max-lg:tw-bottom-0 max-lg:tw-justify-center max-lg:tw-flex-col max-lg:tw-relative max-lg:tw-mt-8;
        .first-content {
          @apply lg:tw-w-[340px];
          @apply max-lg:tw-w-[90%] max-lg:tw-pb-5;
          span {
            font-family: 'heading-pro-treble-bold';
            &::before {
              @apply lg:tw-hidden tw-left-[-24px] tw-absolute tw-translate-y-[5px];
              content: '';
              position: absolute;
              width: 57.4px;
              height: 13px;
              background-image: url('/icons/fresh/left.svg');
            }
          }
        }
        .second-content {
          @apply tw-w-[340px];
          @apply max-lg:tw-w-[90%];
          span {
            font-family: 'heading-pro-treble-bold';
            &::before {
              @apply lg:tw-hidden tw-left-[-24px] tw-absolute tw-translate-y-[5px];
              content: '';
              position: absolute;
              width: 57.4px;
              height: 13px;
              background-image: url('/icons/fresh/left.svg');
            }
          }
        }
      }
      .second {
        @apply tw-flex lg:tw-justify-center lg:tw-gap-[600px] lg:tw-absolute tw-w-full  lg:tw-bottom-[-96px] xl:tw-bottom-[-30px] tw-px-5 lg:tw-my-5;
        @apply max-lg:tw-items-center sm:lg:tw-h-[27%] md:tw-h-[33%] lg:tw-h-auto max-lg:tw-bottom-0 max-lg:tw-justify-center max-lg:tw-flex-col max-lg:tw-relative;
        .first-content {
          @apply tw-w-[340px];
          @apply max-lg:tw-w-[90%] max-lg:tw-pb-5;
          span {
            font-family: 'heading-pro-treble-bold';
            &::before {
              @apply lg:tw-hidden tw-left-[-24px] tw-absolute tw-translate-y-[5px];
              content: '';
              position: absolute;
              width: 57.4px;
              height: 13px;
              background-image: url('/icons/fresh/left.svg');
            }
          }
        }
        .second-content {
          @apply tw-w-[340px];
          @apply max-lg:tw-w-[90%];
          span {
            font-family: 'heading-pro-treble-bold';
            &::before {
              @apply lg:tw-hidden tw-left-[-24px] tw-absolute tw-translate-y-[5px];
              content: '';
              position: absolute;
              width: 57.4px;
              height: 13px;
              background-image: url('/icons/fresh/left.svg');
            }
          }
        }
      }
      .img-right-down {
        @apply tw-absolute tw-bottom-0;
        transform: translate(204px, -65px);
      }
      .img-left-down {
        @apply tw-absolute tw-bottom-0;
        transform: translate(-198px, -65px);
      }

      .imgs-container {
        position: relative;
        width: 339px;
        height: 348px;
        overflow: hidden;
        user-select: none;

        .img-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          user-select: none;

          .img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            user-select: none;
            -webkit-user-drag: none;
            user-select: none;
            -moz-user-select: none;
            -webkit-user-select: none;
            -ms-user-select: none;
            pointer-events: none;
          }

          .img-left {
            clip-path: inset(0 50% 0 0);
            user-select: none;
          }

          .img-right {
            clip-path: inset(0 0 0 50%);
            user-select: none;
          }
        }

        .slider-bar {
          position: absolute;
          top: 0;
          left: 50%;
          width: 40px;
          height: 100%;
          cursor: ew-resize;
          transform: translateX(-50%);
          user-select: none;
          display: flex;
          align-items: center;
          justify-content: center;
          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 50%;
            width: 4px;
            height: 100%;
            background-color: white;
            transform: translateX(-50%);
            z-index: -1;
          }

          .arrows {
            width: 32px;
            height: 32px;
            pointer-events: none;
            z-index: 1;
          }
        }
      }
    }
  }
}
</style>
