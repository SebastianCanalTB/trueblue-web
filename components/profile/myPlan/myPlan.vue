<script setup lang="ts">
import type { ItemRoute } from '~/interfaces/item-route.interface'

const emit = defineEmits(['update:model-value'])

const planStore = usePlanStore()
const { getAllMyPlan: plans, getAllHolyDays: holyDates } =
  storeToRefs(planStore)
const systemStore = useSystemStore()
const { isMenuOpen } = storeToRefs(systemStore)
const { t } = useI18n()
const showUnsavedDialog = ref(false)
const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const planId = computed(() => {
  const id = route.query.id ? Number(route.query.id) : null
  return id
})

const isEmptyState = computed(() => !plans.value?.id)
const validPets = computed(() => {
  if (!plans.value || !plans.value.pets) return []

  return plans.value.pets.filter((pet) => pet.price > 0)
})


const navigateToEditMode = (id) => {
  router.push(
    localePath({
      name: 'profile-my-plan-id',
      params: { id: id },
    }),
  )
  emit('update:model-value', true)
}

const navigateToCreateMode = () => {
  useLoading(true)

  router.push(
    localePath({
      name: 'profile-my-plan-id',
      params: { id: 0 },
    }),
  )
  emit('update:model-value', true)
}


onMounted(() => {
  nextTick(async () => {
    useLoading(true)
    await planStore.getListPlan()
    await planStore.getNonShippingDate()

    useLoading(false)
  })
})
</script>

<template>
  <div class="my-plan-page">
    <div v-if="isEmptyState" class="empty-plan-page tw-mt-8">
      <img
        src="/icons/profile/ic_my_plan.svg"
        alt="dog-icon"
        width="128px"
        height="127px"
      />
      <p class="tw-text-[12px] tw-text-[#8BA0C9] tw-w-[336px] tw-text-center">
        {{ $t('profile.myPlan.empty') }}
      </p>
      <Button
        @click="navigateToCreateMode"
        class="app-general-button btn-solo-login"
      >
        {{ $t('button.createPlan') }}
      </Button>
    </div>
    <div
      v-if="isViewMode"
      class="lg:tw-w-[649px] lg:tw-ml-10 max-lg:tw-mt-8 lg:tw-mt-16"
    >
      <div>
        <h2 class="title primary1 !tw-text-[32px] tw-mb-5">
          {{ $t('profile.myPlan.title') }}
        </h2>
      </div>
      <div class="tw-flex tw-gap-5">
        <img
          class="tw-mb-auto tw-mt-1"
          src="/icons/profile/ic_info-cafe.svg"
          alt="info"
          height="16px"
          width="16px"
        />
        <p class="tw-text-[#8BA0C9] tw-text-[11px]">
          {{ $t('profile.myPlan.message') }}
        </p>
      </div>
      <div class="my-plan-card">
        <div class="header-plan-card">
          <div v-if="plans.status === 'active'">
            <h3
              class="tw-flex lg:tw-items-center lg:tw-justify-between max-lg:tw-flex-col max-lg:tw-text-left"
            >
              {{
                useFormatPrice(useSearchItemJson('total', plans)) +
                ' / ' +
                useSearchItemJson('frequency', plans) +
                ' '
              }}
              <p
                class="lg:tw-w-[126px] !tw-text-[14px] lg:tw-text-right tw-mb-2"
              >
                *incluye costos adicionales
              </p>
            </h3>
            <p>
              {{
                $t('profile.myPlan.nextPayment', {
                  data: useFormatDate(
                    useSearchItemJson('nextPayment', plans),
                    'date-table',
                  ),
                })
              }}
            </p>
            <p>
              {{
                $t('profile.myPlan.nextDelivery', {
                  data: useFormatDate(
                    useSearchItemJson('nextDelivery', plans),
                    'date-table',
                  ),
                })
              }}
            </p>
          </div>
          <div v-else class="tw-flex tw-flex-col tw-items-center">
            <img
              src="/icons/profile/ic_exclamation.svg"
              alt="exclamation_ic"
              height="25px"
              width="25px"
              class="tw-my-3"
            />
            <p>{{ $t('profile.myPlan.inactiveDogs') }}</p>
          </div>
        </div>
        <div class="content-plan-card">
          <div class="general-information-plan">
            <div class="tw-flex tw-gap-5">
              <img
                src="/icons/profile/ic_location_line.svg"
                alt="location-icon"
              />
              <p class="tw-text-[#25282B] tw-font-treble-bold">
                {{ plans?.address?.address }}
              </p>
            </div>
            <p class="tw-text-[#575E6B] tw-font-treble-book tw-ml-8 tw-mt-2">
              {{
                plans?.address?.complement
                  ? plans?.address?.complement + ', ' + plans?.address?.city
                  : plans?.address?.city
              }}
            </p>
            <div
              v-if="useSearchItemJson('card.lastFour', plans)"
              class="tw-flex tw-gap-5 tw-mt-5"
            >
              <img src="/icons/profile/ic_credit_card.svg" alt="credit_card" />
              <p>
                {{ '**** ' + useSearchItemJson('card.lastFour', plans) }}
              </p>
            </div>
          </div>
          <div
            class="pets-container"
            :class="{ 'scrollable-pets': validPets.length > 3 }"
          >
            <div
              v-for="(plan, index) in validPets"
              :key="index"
              class="dogs-products-recieved"
            >
              <div class="head">
                <span class="dogs-name"> {{ plan.name }}</span>
                <span class="tw-w-[200px]">{{ plan.idealPortion }}</span>
              </div>
              <div class="summary">
                <span class="price">
                  {{ useFormatPrice(plan?.price) }}
                  <p v-if="plan.status !== 'active'" class="inactive">
                    Inactivo
                  </p>
                </span>
                <div class="tw-w-[200px]">
                  <span class="general-accordion products-accordion">
                    <Accordion>
                      <AccordionPanel value="0">
                        <AccordionHeader>
                          <span class="quantity">
                            {{
                              plan.products.length > 1
                                ? $t(
                                    'create.main.content.4.orderSummary.quantities',
                                    {
                                      data: plan.products.length,
                                    },
                                  )
                                : $t(
                                    'create.main.content.4.orderSummary.quantity',
                                    {
                                      data: plan.products.length,
                                    },
                                  )
                            }}
                          </span>
                        </AccordionHeader>
                        <AccordionContent>
                          <div class="number-list">
                            <ul>
                              <li
                                v-for="(product, subIndex) in plan.products"
                                :key="subIndex"
                              >
                                x{{ product.numberOfPackages }}
                                {{ product.name }}
                              </li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionPanel>
                    </Accordion>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <GeneralDialogUnSavedProgess
      v-model:show="showUnsavedDialog"
      @continueWithoutSaving="
        router.push({
          path: route.path,
          query: {
            page: 'my-plan',
          },
        }),
          (isMenuOpen = false)
      "
    />
  </div>
</template>
<style lang="scss">
.my-plan-page {
  @apply tw-mb-10 tw-h-full tw-overflow-y-hidden;
  .empty-plan-page {
    @apply tw-mt-[150px] tw-mx-auto tw-flex tw-flex-col tw-items-center tw-gap-5;
  }
  .edit-text {
    @apply tw-flex tw-gap-3 tw-text-primary tw-text-[15px] tw-justify-end  tw-cursor-pointer;
    font-family: 'heading-pro-treble-regular';
  }
  .my-plan-card {
    .header-plan-card {
      @apply tw-p-7;
      border-radius: 12px 12px 0px 0px;
      background-color: #e5ebf1;
      h3 {
        @apply tw-text-primary tw-text-[20px] tw-font-treble-bold;
      }
      p {
        @apply tw-text-primary tw-text-[14px] tw-font-treble-book;
      }
    }
    .content-plan-card {
      @apply tw-pb-0 max-lg:tw-w-full;
      background-color: #ffffff;
      border-radius: 0px 0px 12px 12px;
      .general-information-plan {
        @apply tw-relative tw-h-[140px] tw-p-7 tw-pb-0;
        &::after {
          @apply tw-w-[100%];
          content: '';
          left: 0;
          bottom: 0;
          position: absolute;
          display: flex;
          padding-left: 0;
          padding-right: 0;
          border-bottom: 1px solid #8ba0c9;
          opacity: 0.5;
        }
      }
      .pets-container {
        &.scrollable-pets {
          max-height: 400px;
          overflow-y: auto;
          padding-right: 5px;
        }
      }
      .dogs-products-recieved {
        @apply lg:tw-min-h-[80px] max-lg:tw-min-h-[110px] tw-relative tw-p-7;

        &::after {
          @apply tw-w-[100%];
          content: '';
          left: 0;
          bottom: 0;
          position: absolute;
          display: flex;
          padding-left: 0;
          padding-right: 0;
          border-bottom: 1px solid #8ba0c9;
          opacity: 0.5;
        }
        &:last-child {
          &::after {
            @apply tw-hidden;
            content: '';
          }
        }
        .head {
          @apply tw-flex  tw-mt-3;
          @apply max-lg:tw-justify-between;
          .dogs-name {
            @apply tw-text-primary tw-text-[16px] lg:tw-w-[285px] max-lg:tw-w-[120px];
            font-family: 'heading-pro-treble-bold';
          }
        }
        .summary {
          @apply tw-flex lg:tw-gap-[215px] max-lg:tw-gap-[65px] tw-mt-3;

          @apply max-lg:tw-flex max-lg:tw-justify-between;
          .price {
            @apply tw-text-[13px] tw-text-[#25282B];
            font-family: 'heading-pro-treble-bold';
          }
          .inactive {
            margin-top: 5px;
            font-size: 13px;
            text-align: center;
            background: var(---575e6b) 0% 0% no-repeat padding-box;
            background: rgb(87, 94, 107, 0.1);
            border-radius: 4px;
          }
          .quantity {
            @apply tw-text-primary tw-text-[12px] tw-flex tw-cursor-pointer;
          }
          .number-list {
            @apply tw-text-[13px] tw-text-[#575E6B] tw-mb-5;
          }
        }
      }
    }
  }
}
</style>
