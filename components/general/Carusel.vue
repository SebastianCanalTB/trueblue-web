<template>
  <div
    class="slider"
    :style="sliderStyle"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="slide-track" :style="trackStyle">
      <div
        v-for="(slide, index) in combinedSlides"
        :key="index"
        class="slide"
        :style="slideStyle"
      >
        <div class="flex flex-column">
          <h2>
            {{ slide.title }}
          </h2>
          <p class="px-5">
            {{ slide.text }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
const systemStore = useSystemStore()
interface Slide {
  text?: string
  title?: string
}

interface Props {
  slides?: Slide[]
  slideWidth?: number
  slideHeight?: number
  animationSpeed?: number
  pauseOnHover?: boolean
  background?: string
  position?: string
}

const props = withDefaults(defineProps<Props>(), {
  slides: () => [
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
  ],
  slideWidth: 700,
  slideHeight: 100,
  animationSpeed: 10,
  pauseOnHover: false,
  background: 'transparent',
  position: 'relative',
})

const combinedSlides = computed(() => [...props.slides, ...props.slides])

const isPaused = ref(false)

const sliderStyle = computed(() => ({
  height: `${props.slideHeight}px`,
  width: '100%',
  background: props.background,
  position: props.position,
  '--slide-height': `${props.slideHeight}px`,
  '--slide-width': `${props.slideWidth}px`,
  '--animation-speed': `${props.animationSpeed}s`,
  '--slide-count': props.slides.length,
}))

const slideStyle = computed(() => ({
  height: `${props.slideHeight}px`,
  width: `${props.slideWidth}px`,
}))

const trackStyle = computed(() => {
  const width = props.slideWidth * combinedSlides.value.length
  const animationPlayState = isPaused.value ? 'paused' : 'running'

  return {
    width: `${width}px`,
    animationPlayState,
  }
})

// Manejadores de eventos para pausar en hover
const handleMouseEnter = () => {
  if (props.pauseOnHover) {
    isPaused.value = true
  }
}

const handleMouseLeave = () => {
  if (props.pauseOnHover) {
    isPaused.value = false
  }
}
</script>

<style scoped lang="scss">
.slider {
  margin: auto;
  overflow: hidden;
  padding-left: 50px;
  padding-right: 50px;
  &::before,
  &::after {
    content: '';
    height: var(--slide-height);
    position: absolute;
    width: 500px;
    z-index: 2;
  }
  &::after {
    right: 0;
    top: 0;
    transform: rotateZ(180deg);
  }
  &::before {
    left: 0;
    top: 0;
  }
  .slide-track {
    animation: scroll var(--animation-speed) linear infinite;
    display: flex;
    .slide {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

@keyframes scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(var(--slide-width) * -1 * var(--slide-count)));
  }
}
</style>
