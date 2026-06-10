<script setup lang="ts">
const systemStore = useSystemStore()
const accountStore = useAccountStore()
const store = useOnboardingStore()
const bannerStore = useBannerStore()
const { getBannerInfo: banner } = storeToRefs(bannerStore)
const { isMovil } = storeToRefs(systemStore)
const { canSeePlanButton } = storeToRefs(store)
const { getInfoCupon: cupon } = storeToRefs(accountStore)
const userData = store.getLoginUser
const videoSrc = ref(
  useSearchItemJson('[0].image', banner.value)
    ? useSearchItemJson('[0].image', banner.value)
    : '/videos/video_portada_web.mp4',
)
const bannerLink = ref(
  useSearchItemJson('[0].link', banner.value)
    ? useSearchItemJson('[0].link', banner.value)
    : '',
)
const localePath = useLocalePath()
const router = useRouter()
const videoElement = ref<HTMLVideoElement | null>(null)

const goToBannerLink = () => {
  if (bannerLink.value) {
    window.open(bannerLink.value, '_blank')
  }
}

watch(videoSrc, () => {
  setTimeout(() => {
    if (videoElement.value) {
      videoElement.value.load()
      videoElement.value
        .play()
        .catch((err) => console.error('Error al reproducir:', err))
    }
  }, 0)
})
</script>

<template>
  <section class="principal">
    <div class="video-container">
      <video
        ref="videoElement"
        autoplay
        muted
        playsinline
        loop
        class="background-video"
        @click="goToBannerLink"
      >
        <source :src="videoSrc" type="video/mp4" />
        {{ $t('home.sectionOne.notSupported') }}
      </video>
      <div class="overlay-texts">
        <h1 class="title">
          {{ $t('home.sectionOne.title') }}
        </h1>
        <h2 class="description">
          {{ $t('home.sectionOne.description') }}
        </h2>
        <div class="pt-6 pb-2">
          <Button
            v-if="!userData?.id"
            class="app-general-button btn-300px primary-2"
            @click="router.push(localePath({ name: 'registry' }))"
          >
            {{ $t('home.create') }}
          </Button>
          <Button
            v-if="userData?.id && canSeePlanButton"
            class="app-general-button btn-300px primary-2"
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
        <div v-if="!userData?.id" class="info">
          <img
            src="/icons/ic_percantage_yellow.svg"
            alt="discount"
            height="23px"
            width="23px"
          />
          <p>
            {{
              $t('home.sectionOne.discount', {
                discount: useSearchItemJson('valueType', cupon),
              })
            }}
          </p>
        </div>
      </div>
      <GeneralTrueBlueMarks class="tb-infor-cards-container" />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.principal {
  .video-container {
    @apply tw-relative tw-w-full lg:tw-h-[80vh] max-lg:tw-h-[75vh] tw-overflow-hidden;

    .background-video {
      @apply tw-w-full tw-h-full;
      object-fit: cover;
    }

    .overlay-texts {
      @apply tw-absolute tw-top-[50%] tw-left-1/2 tw-text-center tw-text-white tw-w-full lg:tw-mt-11;
      transform: translate(-50%, -70%);
      z-index: 2;

      .title {
        @apply lg:tw-text-[40px] max-lg:tw-text-[33px];
        width: 100%;
        font-weight: bold;
        margin-bottom: 10px;
        font-family: 'heading-pro-medium-heavy';
      }

      .description {
        @apply tw-text-[18px] max-lg:tw-text-[15px];
      }

      .info {
        @apply tw-flex tw-justify-center tw-gap-3 tw-items-center;

        p {
          @apply lg:tw-text-[13px] max-lg:tw-text-[12px];
          color: $info-messages;
          font-family: 'heading-pro-treble-bold';
        }
      }
    }
    .tb-infor-cards-container {
      @apply -tw-translate-y-[119%];
    }
  }
}
</style>
