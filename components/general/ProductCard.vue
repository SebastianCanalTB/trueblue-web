<script setup lang="ts">
const emit = defineEmits(['select'])

const props = defineProps({
  prductData: {
    type: Object,
    required: true,
  },
  id: {
    type: Number,
    required: true,
  },
  reset: {
    type: Boolean,
  },
  initiallySelected: {
    type: Boolean,
    default: false,
  },
})

const showUpdateDialog = ref(false)
const isSelected = ref(props.initiallySelected)

const toggleSelection = () => {
  isSelected.value = !isSelected.value
  emit('select', {
    id: props.prductData?.id,
    isSelected: isSelected.value,
    name: props.prductData?.title,
  })
}

watch(
  () => props.initiallySelected,
  (newValue) => {
    isSelected.value = newValue
  },
  { immediate: true },
)

watch(
  () => props.reset,
  (newValue) => {
    if (newValue === true) {
      isSelected.value = false
    }
  },
)

const displayName = computed(() => props.prductData?.name || '')
const displayDescription = computed(() => props.prductData?.description || '')
const photoPreview = computed(() => props.prductData?.imageProduct || '')
const displayComplemantaryimage = computed(
  () => props.prductData?.complementaryImage || '',
)
const secondImageSrc = computed(() => {
  const name = displayName.value
  if (!name) return '/icons/registry/second_image_beef.png'

  const firstWord = name.split(' ')[0].toLowerCase()

  const extension =
    firstWord === 'chicken' || firstWord === 'salmon' ? 'webp' : 'png'

  return `/icons/registry/second_image_${firstWord}.${extension}`
})
</script>

<template>
  <div class="preview-card-container">
    <Card
      class="preview-card"
      :class="{ selected: isSelected }"
      @click="toggleSelection"
    >
      <template #header>
        <div class="preview-image-wrapper">
          <img :src="photoPreview" :alt="displayName" class="preview-image" />
          <img
            :src="`/icons/registry/ic_icon_${isSelected}.svg`"
            alt="_icon"
            class="selected-icon max-lg:tw-hidden"
          />
        </div>
      </template>

      <template #content>
        <div>
          <p class="body-l-highlighted">{{ displayName }}</p>
          <p class="body-s-black">{{ displayDescription }}</p>
          <img
            :src="`/icons/registry/ic_icon_${isSelected}.svg`"
            alt="_icon"
            class="selected-icon lg:tw-hidden max-lg:tw-absolute max-lg:tw-top-[10px] max-lg:tw-right-[10px]"
          />
        </div>
        <img
          :src="
            displayComplemantaryimage !== ''
              ? displayComplemantaryimage
              : secondImageSrc
          "
          alt="second image"
          class="max-lg:tw-hidden tw-h-[112px] tw-w-[291px] tw-translate-y-[8px] tw-object-cover"
          width="291px"
          height="112px"
        />
      </template>

      <template #footer>
        <div
          class="footer-content"
          :class="{ selected: isSelected }"
          @click.stop="showUpdateDialog = true"
        >
          <span class="see-detail"> Ver detalle </span>
        </div>
      </template>
    </Card>
  </div>

  <sidebarFoodDetailDrawer
    :showUpdateDialog="showUpdateDialog"
    :details="props.prductData?.nutritionalInformation"
    :name="props.prductData?.name"
    :description="props.prductData?.description"
    @closeModal="showUpdateDialog = false"
  />
</template>

<style lang="scss">
.preview-card-container {
  @apply max-lg:tw-w-full tw-flex tw-justify-center lg:tw-mt-[130px] max-lg:tw-max-w-[500px] max-lg:tw-mx-auto max-lg:tw-mt-4;
  .preview-card {
    @apply tw-relative lg:tw-w-[290px] tw-rounded-[23px] lg:tw-min-h-[280px] tw-cursor-pointer tw-bg-[#f9f9f9];
    @apply max-lg:tw-w-full max-lg:tw-min-h-[164px];
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    &.selected {
      @apply max-lg:tw-min-h-[166px] lg:tw-min-h-[282px];
      @apply max-lg:tw-border-solid max-lg:tw-border-[#3db5e6] max-lg:tw-border-[2px];
      .p-card-header {
        .preview-image-wrapper {
          .preview-image {
            opacity: 1;
          }
        }
      }
      .p-card-body {
        .p-card-content {
          opacity: 1;
        }
      }
    }

    .p-card-header {
      @apply tw-p-0 tw-absolute lg:tw-top-[-130px] lg:tw-left-[22%] tw-rounded-[6px];
      @apply max-lg:tw-h-full;
      .preview-image-wrapper {
        @apply lg:tw-w-[170px] lg:tw-h-[170px] tw-bg-transparent tw-flex tw-justify-center tw-items-center tw-overflow-hidden tw-rounded-[6px];
        @apply max-lg:tw-h-[115px] max-lg:tw-translate-y-[20%] max-lg:tw-w-[115px];
        .preview-image {
          @apply tw-w-full tw-h-full tw-object-contain;
          @apply max-lg:tw-top-1/2;
          opacity: 0.5;
        }
        .selected-icon {
          @apply tw-absolute tw-w-[20px] tw-h-[20px] lg:tw-right-[-30px] lg:tw-bottom-[5px];
          @apply max-lg:tw-right-0 max-lg:tw-top-0;
        }
      }
    }

    .p-card-body {
      @apply tw-px-1 tw-w-full;
      .p-card-content {
        @apply lg:tw-my-[26px] lg:tw-mx-0 tw-h-full tw-flex tw-flex-col lg:tw-justify-between;
        @apply max-lg:tw-ml-[110px] max-lg:tw-mb-[14px];
        opacity: 0.5;
        p {
          @apply max-lg:tw-mt-0;
          overflow-wrap: break-word;
        }
        .body-l-highlighted {
          @apply tw-text-[18px] tw-font-treble-regular tw-text-[#1a1a29] tw-mb-0 lg:tw-text-center;
        }

        .body-s-black {
          @apply tw-text-[12px] tw-font-treble-regular tw-text-[#575e6b] tw-mb-0 lg:tw-text-center tw-my-0 tw-min-h-[80px];
        }
      }

      .p-card-footer {
        @apply tw-bottom-0 tw-absolute lg:tw-w-full lg:tw-h-[46px] lg:tw-left-0 tw-bg-[#ededf1] tw-border-t-0 tw-flex tw-items-center tw-justify-center lg:tw-rounded-b-[23px];
        @apply max-lg:tw-w-[161px] max-lg:tw-h-[32px] max-lg:tw-right-0;
        @apply max-lg:tw-rounded-tl-[15px] max-lg:tw-rounded-br-[20px];

        .footer-content {
          @apply tw-flex tw-items-center tw-gap-2 tw-border-t-0 tw-bg-[#ededf1] tw-w-full tw-h-full tw-justify-center lg:tw-rounded-b-[23px];
          @apply max-lg:tw-rounded-tl-[15px] max-lg:tw-rounded-br-[20px];
          .see-detail {
            @apply tw-text-[#575e6b] tw-text-[14px] tw-font-treble-bold;
          }
          &.selected {
            @apply max-lg:tw-rounded-tl-[15px] max-lg:tw-rounded-br-[20px];
            background-color: rgba(#3db5e6, 0.2);
            .see-detail {
              color: #3db5e6;
            }
          }
        }
      }
    }
  }
}
</style>
