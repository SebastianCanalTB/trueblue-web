<script setup lang="ts">
const { t } = useI18n()
const selectedIndex = ref(0)
const header = ref<HTMLElement | null>(null)
const titlesContainer = ref<HTMLElement | null>(null)
const localePath = useLocalePath()
const router = useRouter()
const systemStore = useSystemStore()
const store = useOnboardingStore()
const { isMovil } = storeToRefs(systemStore)
const { canSeePlanButton } = storeToRefs(store)
const userData = store.getLoginUser

const selectTitle = async (index: number) => {
  selectedIndex.value = index
  await nextTick()
  updateTrianglePosition()
}

const updateTrianglePosition = () => {
  if (titlesContainer.value && header.value) {
    const activeTitle = titlesContainer.value.querySelector(
      '.title-products.active',
    ) as HTMLElement
    if (activeTitle) {
      const titleRect = activeTitle.getBoundingClientRect()
      const containerRect = titlesContainer.value.getBoundingClientRect()
      // const headerRect = header.value.getBoundingClientRect()

      let offsetLeft: number

      if (isMovil.value) {
        offsetLeft =
          titleRect.left -
          containerRect.left +
          titlesContainer.value.scrollLeft +
          titleRect.width / 2
      } else {
        offsetLeft = titleRect.left - containerRect.left + titleRect.width / 2
      }

      header.value.style.setProperty('--triangle-offset', `${offsetLeft}px`)
    }
  }
}

watch(selectedIndex, updateTrianglePosition)

onMounted(() => {
  nextTick(() => {
    updateTrianglePosition()
    window.addEventListener('resize', updateTrianglePosition)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateTrianglePosition)
})

const products = ref([
  {
    title: t('home.sectionOurProducts.content.beff.title'),
    content: t('home.sectionOurProducts.content.beff.content'),
  },
  {
    title: t('home.sectionOurProducts.content.farm.title'),
    content: t('home.sectionOurProducts.content.farm.content'),
  },
  {
    title: t('home.sectionOurProducts.content.energy.title'),
    content:
      t('home.sectionOurProducts.content.energy.content') ||
      'Default Content 3',
  },
])

const slites = ref([
  {
    text: t('carousel.1'),
  },
  {
    text: t('carousel.2'),
  },
  {
    text: t('carousel.3'),
  },
  {
    text: t('carousel.4'),
  },
])
</script>

<template>
  <section class="our-products">
    <GeneralCarusel
      style="top: -30px"
      :position="'absolute'"
      :slideHeight="32"
      :slideWidth="1000"
      :background="'#EDEDF1'"
      :slides="slites"
      :animationSpeed="25"
    />
    <div class="header" ref="header">
      <h3
        class="title blue pt-5 mt-0 mb-2 tw-text-center max-lg:tw-w-[90%] max-lg:tw-mx-auto"
      >
        {{ $t('home.sectionOurProducts.header.title') }}
      </h3>
      <p
        class="text white tw-text-center tw-w-3/4 tw-mx-auto lg:tw-max-w-[850px] lg:!tw-text-[14px] max-lg:!tw-text-[12px] max-lg:tw-leading-5 max-lg:tw-mt-3"
      >
        {{ $t('home.sectionOurProducts.header.content') }}
      </p>
    </div>
    <div class="content-products">
      <div class="titles lg:tw-mb-[60px] max-lg:tw-mb-5">
        <div class="title-products-container" ref="titlesContainer">
          <h4
            v-for="(product, index) in products"
            :key="index"
            :class="{ active: index === selectedIndex }"
            class="title-products tw-z-20"
            @click="selectTitle(index)"
          >
            {{ product.title }}
          </h4>
        </div>
      </div>
      <div class="content">
        <p class="tw-min-h-[100px] max-lg:tw-min-h-[130px] tw-leading-5">
          {{ products[selectedIndex].content }}
        </p>
        <div class="w-full flex justify-content-center pr-4rem lg:tw-mt-5">
          <Button
            v-if="!userData?.id"
            class="app-general-button btn-300px primary-1 tw-z-20"
            @click="router.push(localePath({ name: 'registry' }))"
          >
            {{ $t('home.create') }}
          </Button>
          <Button
            v-if="userData?.id && canSeePlanButton"
            class="app-general-button btn-300px primary-1 tw-z-20"
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
      </div>
      <div class="images-container">
        <img
          src="/img/feeding/img_linaza.webp"
          alt="img_linaza"
          class="img-linaza"
        />
        <img
          src="/img/feeding/img-chicken.webp"
          alt="img-chicken"
          class="img-chicken"
        />
        <img src="/img/feeding/img_meat.webp" alt="img_meat" class="img-meat" />
        <img
          src="/img/feeding/img_oatmeal.webp"
          alt="img_oatmeal"
          class="img-oatmeal"
        />
        <!-- <img
              src="/img/ic_food_plate.webp"
              alt="food"
              class="food-image"
              :style="{ transform: `rotate(${selectedIndex * 50}deg)` }"
            /> -->
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.our-products {
  @apply lg:tw-mb-28 max-lg:tw-mb-10 tw-relative;

  .header {
    @apply tw-w-full tw-pb-7 tw-flex tw-flex-col tw-relative;
    background-color: $primary-1;

    &::after {
      content: '';
      position: absolute;
      width: 0;
      height: 0;
      bottom: -18px;
      border-style: solid;
      border-right: 30px solid transparent;
      border-left: 30px solid transparent;
      border-top: 30px solid #003b71;
      border-bottom: 0;
      z-index: 10;
      left: var(--triangle-offset, 50%);
      transform: translateX(-50%);
      transition: left 0.3s ease-in-out;
    }
  }

  .content-products {
    @apply tw-pt-[50px] lg:tw-min-h-[460px] max-lg:tw-pb-5 tw-w-full tw-bg-[#f5f6fa] tw-relative;

    .titles {
      @apply tw-flex tw-items-center tw-justify-center lg:tw-gap-[10%];
      @apply max-lg:tw-w-screen max-lg:tw-overflow-x-auto;

      .title-products-container {
        @apply tw-flex tw-justify-evenly tw-text-center tw-w-full;
        @apply max-lg:tw-relative max-lg:tw-z-20 max-lg:tw-flex max-lg:tw-items-center max-lg:tw-mr-5;

        .title-products {
          @apply lg:tw-text-[28px] tw-inline-block;
          @apply max-lg:tw-text-[18px]  max-lg:tw-w-[94px] max-lg:tw-h-auto max-lg:tw-leading-tight;
          font-family: 'heading-pro-medium-heavy';
          color: #8ba0c9;
          cursor: pointer;

          &.active {
            color: $primary-1;
          }
        }
      }
    }

    .content {
      @apply lg:tw-w-[40%] max-lg:tw-w-[90%] tw-mx-auto tw-text-[#572e6b] tw-text-center tw-min-h-[130px] tw-pr-[20px];
      font-size: 18px;

      .img-beef {
        @apply max-lg:tw-hidden tw-absolute tw-left-[-40%] tw-h-[144px] tw-w-[131px];
      }
    }

    .images-container {
      @apply tw-absolute tw-overflow-x-hidden tw-overflow-y-hidden tw-w-full lg:tw-h-[527px] max-lg:tw-h-[680px] tw-content-center max-lg:tw-flex max-lg:tw-justify-center max-lg:tw-items-center;
      @apply max-lg:tw-hidden;
      transform: translate(0%, -40%);

      .food-image {
        @apply tw-absolute lg:tw-top-[10%] lg:tw-right-[-116px] lg:tw-w-[480px] tw-h-auto;
        @apply max-lg:tw-w-[300px] max-lg:tw-bottom-0;
        transition: transform 0.4s ease-in-out;
      }

      .img-linaza {
        @apply tw-absolute tw-h-[300px] tw-w-[300px] -tw-translate-y-60 -tw-translate-x-32;
        @apply max-lg:tw-hidden;
      }

      .img-chicken {
        @apply tw-absolute lg:tw-left-[25%] tw-h-[210px] tw-w-[210px] -tw-translate-y-6;
        @apply max-lg:tw-hidden;
      }

      .img-meat {
        @apply tw-absolute -tw-right-20  tw-h-[205px] tw-w-[205px] -tw-translate-y-52;
        @apply max-lg:tw-hidden;
      }

      .img-oatmeal {
        @apply tw-absolute lg:tw-right-[25%]  tw-h-[149px] tw-w-[265px];
        @apply max-lg:tw-hidden;
      }
    }
  }
}
</style>
