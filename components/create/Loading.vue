<script setup lang="ts">
import { Carousel, Slide, Pagination, Navigation } from 'vue3-carousel'
import { ref, onMounted } from 'vue' // Importa onMounted

const props = defineProps({
  grammage: {
    type: Number,
    default: 0,
  },
  customHeight: {
    type: String,
    default: 'calc(100vh - 50px)',
  },
  customTop: {
    type: String,
    default: '50px',
  },
  customZIndex: {
    type: [Number, String],
    default: 1500,
  },
  customLeft: {
    type: [Number, String],
    default: '0',
  },
})

const emit = defineEmits(['next-step'])

const systemStore = useSystemStore()
const { isMovil } = storeToRefs(systemStore)
const showWords = ref(false)
const route = useRoute()
onMounted(() => {
  setTimeout(() => {
    showWords.value = true
  }, 8000)
})

const nextStep = () => {
  emit('next-step')
}
const slites = ref([
  {
    title: 'Digestión saludable',
    text: 'Fibras naturales que mejoran la digestión y reducen gases.',
  },
  {
    title: 'Pelaje brillante y piel sana',
    text: 'Ácidos grasos y nutrientes que fortalecen el pelaje y cuidan la piel.',
  },
  {
    title: 'Energía y vitalidad diaria',
    text: 'Proteínas de alta calidad que mantienen su energía y bienestar.',
  },
])
const loadingStyles = computed(() => {
  return {
    height: props.customHeight,
    top: props.customTop,
    zIndex: props.customZIndex,
    left: props.customLeft,
  }
})
</script>

<template>
  <div class="viewLoading" :style="loadingStyles">
    <div class="loading-header">
      <h1 v-if="!showWords">Ya casi está listo tu plan</h1>
      <h1 v-else>¡Tu plan está listo!</h1>
      <img
        src="/icons/loading/ic_chicken_op.svg"
        alt="chicken_icon"
        class="tw-absolute tw-top-1/4 tw-right-[7%] max-lg:tw-hidden"
      />
    </div>
    <div class="loading-container">
      <Vue3Lottie
        v-if="!showWords"
        animationLink="/loading.json"
        :height="390"
        :width="390"
        class="loading-animation"
      />
      <img
        v-if="showWords"
        src="/icons/ic_complete_check.svg"
        alt="completed_icon"
        class="tw-absolute tw-ml-[112px] tw-z-20"
      />
      <div class="loading-video">
        <video autoplay loop muted playsinline>
          <source src="/videos/video_perro_loading.mp4" type="video/mp4" />
          Tu navegador no soporta el elemento de video.
        </video>
      </div>
    </div>
    <img
      src="/icons/loading/ic_carrot.svg"
      alt="chicken_icon"
      class="tw-absolute tw-bottom-1/4 tw-left-[7%] max-lg:tw-hidden"
    />
    <div class="loading-footer">
      <div v-if="!showWords" class="loading-carousel">
        <GeneralCarusel
          :pauseOnHover="true"
          :slides="slites"
          :slideWidth="isMovil ? 300 : 700"
        />
      </div>
      <Button
        v-if="showWords"
        @click="nextStep"
        class="app-general-button btn-solo-create !tw-w-[343px] !tw-h-[46px]"
      >
        Ver resultado
      </Button>
    </div>
  </div>
</template>

<style lang="scss">
.viewLoading {
  @apply lg:tw-w-screen max-lg:tw-w-full tw-overflow-hidden;
  position: absolute;
  left: 0;
  background-color: #f5f6fa;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  .loading-header {
    @apply max-lg:tw-mb-[200px] lg:tw-mb-[140px];
    font-size: 24px;
    font-family: 'heading-pro-treble-regular';
    color: $primary-1;
    &::before {
      @apply lg:tw-right-[10%] lg:tw-top-[10%];
      @apply max-lg:tw-right-[10%] max-lg:tw-top-[35%];
      content: '';
      background-image: url('/icons/FAQ/ic_carrot.svg');
      position: absolute;
      height: 50px;
      width: 50px;
      background-repeat: no-repeat;
    }
    &::after {
      @apply tw-left-[13%] tw-top-[30%];
      content: '';
      background-image: url('/icons/FAQ/ic_fish.svg');
      position: absolute;
      height: 50px;
      width: 50px;
      background-repeat: no-repeat;
    }
    h1 {
      &::after {
        @apply lg:tw-left-[24%] lg:tw-top-[10%];
        @apply max-lg:tw-left-[55%] max-lg:tw-top-[28%];
        content: '';
        background-image: url('/icons/loading/ic_steak_op.svg');
        position: absolute;
        height: 50px;
        width: 50px;
        background-repeat: no-repeat;
      }
      &::before {
        @apply lg:tw-left-[28%] lg:tw-top-[50%];
        @apply max-lg:tw-left-[10%] max-lg:tw-bottom-[35%];
        content: '';
        background-image: url('/icons/loading/ic_apple.svg');
        position: absolute;
        height: 50px;
        width: 50px;
        background-repeat: no-repeat;
      }
    }
  }

  .loading-container {
    @apply tw-flex tw-justify-center;
    position: relative;
    height: 250px;
    width: 100%;
    &::before {
      @apply tw-right-[20%] max-lg:tw-hidden;
      content: '';
      background-image: url('/icons/FAQ/ic_steak.svg');
      position: absolute;
      height: 50px;
      width: 50px;
      background-repeat: no-repeat;
    }
  }

  .loading-animation {
    @apply tw-mx-auto tw-absolute tw-top-[-143px];
  }

  .loading-video {
    @apply tw-mx-auto tw-z-10;
    position: relative;
    width: 106px;
    height: 106px;
    border-radius: 50%;
    overflow: hidden;

    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  .loading-footer {
    @apply tw-w-full;
    .loading-carousel {
      @apply tw-w-full;
      h2 {
        @apply tw-text-[#25282B] tw-text-[14px];
        font-family: 'heading-pro-treble-bold';
      }
      p {
        @apply tw-text-[14px] tw-text-[#575E6B];
      }
    }
    &::before {
      @apply lg:tw-left-[20%] lg:tw-bottom-[10%];
      @apply max-lg:tw-right-[20%] max-lg:tw-bottom-[28%];
      content: '';
      background-image: url('/icons/loading/ic_chicken.svg');
      position: absolute;
      height: 50px;
      width: 50px;
      background-repeat: no-repeat;
    }
    &::after {
      @apply lg:tw-right-[10%] lg:tw-bottom-[10%];
      @apply max-lg:tw-right-[50%] max-lg:tw-bottom-[20px];
      content: '';
      background-image: url('/icons/loading/ic_strawberry.svg');
      position: absolute;
      height: 50px;
      width: 50px;
      background-repeat: no-repeat;
    }
  }
}
</style>
