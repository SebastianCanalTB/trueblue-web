<script setup lang="ts">
const emit = defineEmits(['enable-edit', 'go-back'])
const props = defineProps({
  petId: {
    type: Number,
    required: true,
  },
})

const createStore = useCreateStore()
const loading = ref(true)
const { getMyPet: myPet } = storeToRefs(createStore)
const route = useRoute()
const enableEditMode = () => {
  emit('enable-edit', Number(route.query.detail))
}
onMounted(() => {
  nextTick(async () => {
    loading.value = true
    useLoading(true)
    await createStore.getOnePet(route.query.detail)
    useLoading(false)
    loading.value = false
  })
})
</script>

<template>
  <div v-if="!loading" class="pet-profile-container lg:tw-px-10">
    <div class="pet-header">
      <h1 class="pet-name">
        {{ myPet?.name }}
      </h1>
      <p class="pet-breed">
        {{ myPet?.race?.name }}
      </p>
      <button class="edit-button" @click="enableEditMode">
        <img src="/icons/profile/ic_edit.svg" alt="edit_ic" />
        {{ $t('profile.myPets.petDetail.edit') }}
      </button>
    </div>

    <div class="data-cards-container">
      <div>
        <h2 class="section-title">{{ $t('profile.myPets.petDetail.data') }}</h2>
        <div class="data-card">
          <div class="data-grid">
            <div class="data-item">
              <p class="label-texts">{{ $t('profile.myPets.genre') }}</p>
              <p class="data-value">{{ myPet?.sex }}</p>
            </div>

            <div class="data-item">
              <p class="label-texts">{{ $t('profile.myPets.age') }}</p>
              <p class="data-value">
                {{ useFormatAge(myPet.age, myPet.month) }}
              </p>
            </div>

            <div class="data-item">
              <p class="label-texts">
                {{ $t('profile.myPets.actualHeight') }}
              </p>
              <p class="data-value">{{ myPet?.currentWeight }} Kg</p>
            </div>

            <div class="data-item">
              <p class="label-texts">
                {{ $t('profile.myPets.bodyCondition') }}
              </p>
              <p class="data-value">
                {{ myPet?.bodyCondition?.bodyCondition }}
              </p>
            </div>

            <div class="data-item">
              <p class="label-texts">
                {{ $t('profile.myPets.sterilized') }}
              </p>
              <p class="data-value">{{ myPet?.sterilization ? 'Sí' : 'No' }}</p>
            </div>

            <div class="data-item">
              <p class="label-texts">
                {{ $t('profile.myPets.activityLevel') }}
              </p>
              <p class="data-value">{{ myPet?.petsActivity?.title }}</p>
            </div>
            <div class="data-item">
              <p class="label-texts">{{ $t('profile.myPets.planType') }}</p>
              <p class="data-value">
                {{
                  $t(
                    `create.main.content.1.portions.${useSearchItemJson('isMixedFood', myPet) ? 'mixed.desciprtion' : 'notMixed.title'}`,
                  )
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div>
        <h2 class="section-title">
          {{ $t('profile.myPets.petDetail.actualPlan') }}
        </h2>

        <div class="data-card">
          <div class="plan-price">
            {{ useFormatPrice(myPet?.planDescriptions[0].price) }}
          </div>
          <p class="next-delivery">
            {{ $t('profile.myPets.petDetail.nextDelivey') }}
            {{ useFormatDate(myPet?.nextDelivery, 'date-table') }}
          </p>

          <div class="ideal-portion">
            <h3 class="label-texts !tw-text-[14px] tw-mb-2">
              {{ $t('profile.myPets.petDetail.idealPortion') }}
            </h3>
            <p class="portion-value">
              {{ myPet?.planDescriptions[0]?.idealPortion }}
            </p>

            <p class="products-count">
              {{ myPet?.planDescriptions[0]?.descriptionProducts.length }}
              {{ $t('profile.myPets.petDetail.packages') }}
            </p>

            <div class="products-list">
              <div
                v-for="product in myPet?.planDescriptions[0]
                  ?.descriptionProducts"
                :key="product.id"
                class="product-item"
              >
                x{{ product.numberOfPackages }} {{ product?.products.name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.pet-profile-container {
  @apply tw-max-w-6xl tw-mx-auto tw-pb-10 tw-mt-10;
}

.pet-header {
  @apply tw-mb-8 tw-relative;

  .pet-name {
    @apply tw-text-[32px] tw-font-bold tw-text-primary tw-font-medium-heavy tw-mb-0;
  }

  .pet-breed {
    @apply tw-text-[14px] tw-text-[#8BA0C9];
  }

  .edit-button {
    @apply tw-absolute tw-top-0 tw-right-4 tw-text-[#003366] tw-font-medium tw-flex tw-items-center tw-gap-2;
  }
}

.data-cards-container {
  @apply tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6;
}

.section-title {
  @apply tw-text-lg tw-font-treble-bold tw-text-[#575E6B] tw-mb-6;
}
.data-card {
  @apply tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-6 tw-relative;

  .data-grid {
    @apply tw-grid tw-grid-cols-2 tw-gap-y-4;
  }

  .data-item {
    @apply tw-mb-2;
  }

  .data-value {
    @apply tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book;
  }

  .plan-price {
    @apply tw-text-[#003366] tw-text-[20px] tw-font-treble-bold tw-mb-1;
  }

  .next-delivery {
    @apply tw-text-primary tw-font-treble-book tw-text-[14px];
  }

  .ideal-portion {
    @apply tw-pt-4;
    &::before {
      @apply tw-w-[100%];
      content: '';
      left: 0;
      top: 85px;
      position: absolute;
      display: flex;
      padding-left: 0;
      padding-right: 0;
      border-bottom: 1px solid #8ba0c9;
      opacity: 0.5;
    }
  }

  .portion-value {
    @apply tw-text-[20px] tw-text-[#2B7EE2] tw-font-treble-bold tw-mb-3;
  }

  .products-count {
    @apply tw-text-primary tw-mb-2;
  }

  .products-list {
    @apply tw-space-y-1;
  }

  .product-item {
    @apply tw-text-[#575E6B];
  }
}
</style>
