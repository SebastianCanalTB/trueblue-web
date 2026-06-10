<script setup lang="ts">
const systemStore = useSystemStore()
const store = useOnboardingStore()
const bannerStore = useBannerStore()

const { getBannerInfo: banner } = storeToRefs(bannerStore)
const imageForMainSection = useSearchItemJson('[2].image', banner.value)
  ? useSearchItemJson('[2].image', banner.value)
  : '/img/recipes/header.webp'
const bannerLink = useSearchItemJson('[2].link', banner.value) ?? ''
const userData = store.getLoginUser
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const recipeKey = ref(Number(route.params.id))
const selectedRecipe = ref<any>(null)

const tableData1 = [
  { nutrient: 'Proteína', wet: '7,00', dry: '25,00', limit: 'Mínimo' },
  { nutrient: 'Grasa', wet: '2,50', dry: '8,00', limit: 'Mínimo' },
  { nutrient: 'Fibra', wet: '1,40', dry: '5,00', limit: 'Máximo' },
  { nutrient: 'Cenizas', wet: '1,50', dry: '5,36', limit: 'Máximo' },
  { nutrient: 'Humedad', wet: '72,00', dry: '', limit: 'Máximo' },
]

const tableData2 = [
  { nutrient: 'Proteína', wet: '9,00', dry: '32,00', limit: 'Mínimo' },
  { nutrient: 'Grasa', wet: '3,00', dry: '10,00', limit: 'Mínimo' },
  { nutrient: 'Fibra', wet: '1,40', dry: '5,00', limit: 'Máximo' },
  { nutrient: 'Cenizas', wet: '1,50', dry: '5,36', limit: 'Máximo' },
  { nutrient: 'Humedad', wet: '72,00', dry: '', limit: 'Máximo' },
]

const recipes = {
  1: {
    title: "Beef N' Carrot",
    image: '/img/recipes/img_beef_detail.webp',
    inters: [
      'conservants',
      'gluten',
      'colorants',
      'probiotics',
      'omega',
      'sterilization',
    ],
    quantity: 5,
    table1: tableData1,
    table2: tableData2,
  },
  2: {
    title: "Chicken N' Potato",
    image: '/img/recipes/img_chicken_detail.webp',
    inters: [
      'conservants',
      'gluten',
      'colorants',
      'probiotics',
      'omega',
      'sterilization',
    ],
    quantity: 5,
    table1: tableData1,
    table2: tableData2,
  },
  3: {
    title: 'Salmon Sensitive',
    image: '/img/recipes/img_salmon_detail.webp',
    inters: [
      'gastroint',
      'conservants',
      'gluten',
      'colorants',
      'probiotics',
      'omega',
      'sterilization',
    ],
    quantity: 5,
    table1: tableData1,
    table2: tableData2,
  },
}
const table = {
  headers: {
    nutrients: {
      header: t('recipes.detail.table.1'),
      field: 'nutrients',
    },
    baseWet: {
      header: t('recipes.detail.table.2'),
      field: 'baseWet',
    },
    baseDry: {
      header: t('recipes.detail.table.3'),
      field: 'baseDry',
    },
    limit: {
      header: t('recipes.detail.table.4'),
      field: 'limit',
    },
  },
}
const goToBannerLink = () => {
  if (bannerLink) {
    window.open(bannerLink, '_blank')
  }
}

onMounted(() => {
  nextTick(() => {
    selectedRecipe.value = recipes[recipeKey.value as keyof typeof recipes]
  })
})
</script>

<template>
  <article class="content-page-who" :class="[!userData ? 'tw-pt-10' : '']">
    <RecipesHero
      :image-for-main-section="imageForMainSection"
      :banner-link="bannerLink"
      :user-data="userData"
      :title="useSearchItemJson('title', selectedRecipe)"
      @banner-click="goToBannerLink"
    />
    <section class="product-presentation">
      <div class="product-presentation-container">
        <div class="product-presentation-image">
          <img :src="useSearchItemJson('image', selectedRecipe)" alt="" />
        </div>
        <div class="product-presentation-content">
          <div class="tw-flex tw-gap-2">
            <i18n-t tag="span" keypath="recipes.detail.labels.type">
              <template #type>
                <b>
                  {{ t(`recipes.detail.${recipeKey}.type`) }}
                </b>
              </template>
            </i18n-t>
          </div>

          <div class="tw-flex tw-gap-2">
            <i18n-t tag="label" keypath="recipes.detail.labels.mainProtein">
              <template #mainProtein>
                <b>
                  {{ t(`recipes.detail.${recipeKey}.mainProtein`) }}
                </b>
              </template>
            </i18n-t>
          </div>

          <div class="tw-flex tw-gap-2">
            <i18n-t tag="label" keypath="recipes.detail.labels.keyIngredients">
              <template #ingredients>
                <b>
                  {{ t(`recipes.detail.${recipeKey}.keyIngredients`) }}
                </b>
              </template>
            </i18n-t>
          </div>

          <div class="benefits-section">
            <i18n-t tag="span" keypath="recipes.detail.labels.mainBenefits">
            </i18n-t>
            <ul class="benefits-list">
              <li
                v-for="i in useSearchItemJson('quantity', selectedRecipe)"
                :key="i"
              >
                <img src="/icons/recipes/ic_elipsis_blue.svg" alt="" />
                {{ t(`recipes.detail.${recipeKey}.mainBenefits.${i}`) }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
    <div class="inter-section">
      <div
        class="lg:tw-flex lg:tw-items-center lg:tw-justify-between max-lg:tw-grid max-lg:tw-grid-cols-2 lg:tw-gap-2 max-lg:tw-gap-4"
      >
        <div
          v-for="inter in selectedRecipe?.inters"
          :key="inter"
          class="inter-section-item"
        >
          <img
            :src="`/icons/recipes/inter/ic_${inter}.svg`"
            alt="conservants"
            width="60px"
            height="65px"
          />
          <p>{{ t(`recipes.detail.icons.${inter}`) }}</p>
        </div>
      </div>
    </div>
    <section class="table-section">
      <h3 class="title primary1 tw-text-center">
        {{ t('recipes.detail.table.title') }}
      </h3>
      <div class="tw-grid lg:tw-grid-cols-2 tw-gap-8 tw-mt-8">
        <div class="max-lg:tw-w-full">
          <span class="subtitles">
            {{ t('recipes.detail.table.tableOne') }}
          </span>
          <DataTable :value="selectedRecipe?.table1" class="table-recipe">
            <Column
              field="nutrient"
              :header="t('recipes.detail.table.1')"
            ></Column>
            <Column field="wet" :header="t('recipes.detail.table.2')"></Column>
            <Column field="dry" :header="t('recipes.detail.table.3')"></Column>
            <Column
              field="limit"
              :header="t('recipes.detail.table.4')"
            ></Column>
          </DataTable>
        </div>
        <div>
          <span>
            {{ t('recipes.detail.table.tableTwo') }}
          </span>
          <DataTable :value="selectedRecipe?.table2" class="table-recipe">
            <Column
              field="nutrient"
              :header="t('recipes.detail.table.1')"
            ></Column>
            <Column field="wet" :header="t('recipes.detail.table.2')"></Column>
            <Column field="dry" :header="t('recipes.detail.table.3')"></Column>
            <Column
              field="limit"
              :header="t('recipes.detail.table.4')"
            ></Column>
          </DataTable>
        </div>
      </div>
      <div class="tw-flex tw-items-center tw-justify-center tw-mt-8">
        <Button
          v-if="!userData"
          class="app-general-button btn-solo-create"
          @click="
            router.push(
              localePath({
                name: 'registry',
                query: { step: 'pet', substep: 'meet' },
              }),
            )
          "
        >
          {{ $t('home.create') }}
        </Button>
      </div>
    </section>
  </article>
</template>

<style scoped lang="scss">
.product-presentation {
  @apply max-lg:tw-pt-[100px] lg:tw-py-[80px] lg:tw-px-[10%];
  background-color: #ffffff;
  position: relative;
  z-index: 2;
  .product-presentation-container {
    @apply tw-flex tw-items-center lg:tw-justify-center lg:tw-gap-16 max-lg:tw-gap-8 max-lg:tw-flex-col;
    .product-presentation-image {
      @apply lg:tw-w-[50%] lg:tw-max-w-[495px] tw-bg-[#F5F6FA] tw-rounded-[40px] lg:tw-max-h-[350px] max-lg:tw-max-w-[228px] max-lg:tw-max-h-[161px];
      img {
        @apply lg:tw-w-[495px] lg:tw-h-[459px] lg:tw-object-cover -tw-translate-y-[24%] max-lg:tw-w-[228px] max-lg:tw-h-[211px];
      }
    }
    .product-presentation-content {
      @apply lg:tw-w-[50%] max-lg:tw-w-full max-lg:tw-px-4 tw-flex tw-flex-col tw-gap-3;
      label,
      span {
        @apply tw-text-[#25282B] tw-font-treble-bold lg:tw-text-[16px] max-lg:tw-text-[15px] tw-leading-[35px];
      }
      b,
      p {
        @apply tw-text-[#575E6B] tw-font-treble-book lg:tw-text-[16px] max-lg:tw-text-[15px] tw-leading-[35px] tw-font-thin;
      }
      .benefits-list {
        @apply tw-flex tw-flex-col tw-gap-2 tw-py-4;

        li {
          @apply tw-flex tw-items-center tw-gap-6;
          @apply tw-text-[#575E6B] tw-font-treble-book lg:tw-text-[16px] max-lg:tw-text-[15px] tw-leading-[35px];
          img {
            @apply tw-w-[13px] tw-h-[12px];
          }
        }
      }
    }
  }
}
.inter-section {
  @apply tw-py-8 lg:tw-px-[10%] tw-bg-[#F5F6FA] max-lg:tw-px-4;
  position: relative;
  z-index: 2;
  .inter-section-item {
    @apply tw-flex tw-flex-col tw-items-center tw-gap-2;
    p {
      @apply tw-text-primary   tw-font-treble-regular tw-text-[14px] tw-text-center tw-max-w-[196px];
    }
  }
}
.table-section {
  @apply tw-py-8 lg:tw-px-[10%] tw-bg-white max-lg:tw-px-4;
  position: relative;
  z-index: 2;
  span {
    @apply tw-text-primary tw-font-treble-bold tw-text-xl;
  }
}
</style>
