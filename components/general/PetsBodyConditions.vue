<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { Carousel, Slide, Navigation } from 'vue3-carousel'
import 'vue3-carousel/dist/carousel.css'

const props = defineProps({
  initialValue: {
    type: Number,
    default: null,
  },
  reset: {
    type: Boolean,
    default: false,
  },
})

const createStore = useCreateStore()
const systemStore = useSystemStore()
const { isMovil } = storeToRefs(systemStore)
const { getBodyConditions: bodyConditions } = storeToRefs(createStore)
const emit = defineEmits(['update:condition'])

const currentIndex = ref(-1)

const findIndexFromId = (id: number) => {
  return bodyConditions.value.findIndex((condition) => condition.id === id)
}

const updateIndexFromId = (id: number) => {
  const index = findIndexFromId(id)

  if (index !== -1) {
    currentIndex.value = index
    emit('update:condition', id)
  } else if (bodyConditions.value.length > 0) {
    const defaultId = 3
    const stdIndex = findIndexFromId(defaultId)

    if (stdIndex !== -1) {
      currentIndex.value = stdIndex
      emit('update:condition', defaultId)
    } else {
      currentIndex.value = 0
      emit('update:condition', bodyConditions.value[0].id)
    }
  }
}

onMounted(() => {
  nextTick(async () => {
    await createStore.getListBodyConditions()
    if (bodyConditions.value && bodyConditions.value.length > 0) {
      const idToUse = props.initialValue || 3
      updateIndexFromId(idToUse)
    }
  })
})

watch(
  () => bodyConditions.value,
  (newValue) => {
    if (newValue && newValue.length > 0 && currentIndex.value === -1) {
      const idToUse = props.initialValue || 3
      updateIndexFromId(idToUse)
    }
  },
  { immediate: true },
)

watch(
  () => props.reset,
  (newValue) => {
    if (newValue === true && !isMovil.value) {
      currentIndex.value = -1
    } else if (newValue === true && isMovil.value) {
      // En móvil reseteamos al valor por defecto
      const idToUse = props.initialValue || 3
      updateIndexFromId(idToUse)
    }
  },
)
watch(
  () => props.initialValue,
  (newValue) => {
    if (newValue && bodyConditions.value.length > 0) {
      // Solo en móvil aplicamos initialValue
      updateIndexFromId(newValue)
    }
  },
)

const currentCondition = computed(() => {
  if (currentIndex.value >= 0 && bodyConditions.value.length > 0) {
    return bodyConditions.value[currentIndex.value]
  } else {
    return null
  }
})

const selectCondition = (index: number) => {
  if (index >= 0 && index < bodyConditions.value.length) {
    currentIndex.value = index
    const id = bodyConditions.value[index].id
    emit('update:condition', id)
  }
}

const handleSlideEnd = (data: any) => {
  const index = data.currentSlideIndex
  selectCondition(index)
}
</script>

<template>
  <div class="dog-body-condition-selector">
    <label class="label-texts !tw-text-[15px] tw-w-full">{{
      $t('forms.create.recommendedWeight')
    }}</label>
    <div class="carousel-container">
      <Carousel
        ref="carouselRef"
        v-model="currentIndex"
        :items-to-show="1"
        :wrap-around="true"
        :autoplay="0"
        @slide-end="handleSlideEnd"
      >
        <Slide v-for="(condition, index) in bodyConditions" :key="condition.id">
          <div class="condition-slide" @click="selectCondition(index)">
            <div class="image-wrapper">
              <img
                :src="condition.image"
                :alt="condition.bodyCondition"
                class="dog-image"
              />
            </div>
            <div class="condition-info">
              <h3 class="condition-name">{{ condition.bodyCondition }}</h3>
              <p class="condition-description">{{ condition.description }}</p>
            </div>
          </div>
        </Slide>

        <template #addons>
          <Navigation />
        </template>
      </Carousel>
    </div>

    <!-- Timeline indicators (dots) preserved for desktop/context -->
    <div
      v-if="!isMovil && bodyConditions && bodyConditions.length > 0"
      class="timeline-indicators tw-mt-6"
    >
      <div class="timeline-dots">
        <div class="timeline-line"></div>
        <div
          v-for="(condition, index) in bodyConditions"
          :key="condition.id"
          class="timeline-dot circle"
          :class="{
            active: index === currentIndex,
          }"
          @click="selectCondition(index)"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dog-body-condition-selector {
  @apply lg:tw-min-w-[434px] lg:tw-max-w-[740px];
  width: 100%;
  margin-top: 10px;
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;

  .carousel-container {
    width: 100%;
    max-width: 600px;
    @apply tw-relative;

    .condition-slide {
      width: 100%;
      padding: 1rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;

      .image-wrapper {
        height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;

        .dog-image {
          height: 100%;
          object-fit: contain;
        }
      }

      .condition-info {
        text-align: center;

        .condition-name {
          font-family: 'heading-pro-treble-bold';
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #25282b;
        }

        .condition-description {
          font-family: 'heading-pro-treble-book';
          font-size: 12px;
          color: #575e6b;
          line-height: 1.4;
          margin: 0;
          max-width: 300px;
        }
      }
    }

    :deep(.carousel__prev),
    :deep(.carousel__next) {
      background-color: rgba(139, 160, 201, 0.1);
      color: #8ba0c9;
      border-radius: 50%;
      transition: all 0.2s;

      &:hover {
        background-color: rgba(139, 160, 201, 0.3);
        color: #2b7ee2;
      }
    }
  }

  .timeline-indicators {
    position: relative;
    width: 100%;
    height: 40px; /* Increased height to allow centering */
    display: flex;
    align-items: center;
    justify-content: center;

    .timeline-dots {
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center; /* Center dots relative to the container height */
      width: 100%;
      max-width: 500px;
      z-index: 1;

      .timeline-line {
        position: absolute;
        left: 6px; /* Start at the center of the first dot (12px / 2) */
        right: 6px; /* End at the center of the last dot */
        height: 2px;
        background-color: #e0e0e0;
        top: 50%;
        transform: translateY(-50%);
        z-index: 0;
      }

      .timeline-dot {
        width: 12px;
        height: 12px;
        border: 2px solid #8ba0c9;
        background-color: white;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        z-index: 2;

        &.active {
          width: 16px;
          height: 16px;
          background-color: #2b7ee2;
          border-color: #2b7ee2;
          transform: translateY(-2px);
        }
      }
    }
  }
}
</style>
