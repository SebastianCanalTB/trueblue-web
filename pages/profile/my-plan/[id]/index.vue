<script setup lang="ts">
interface FormData {
  pets: any | null
  idealPlan: any | null
  checkout: any | null
}

interface ItemRef {
  type: string
  ref: any
}

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { t } = useI18n()

// Stores
const systemStore = useSystemStore()
const planStore = usePlanStore()
const { isMovil } = storeToRefs(systemStore)
const { getAllMyPlan: plan } = storeToRefs(planStore)

// Page Logic
const planId = computed(() => Number(route.params.id))
const isCreateMode = computed(() => planId.value === 0)
const isEditMode = computed(() => planId.value > 0)

const navigateToViewMode = () => {
  router.push(localePath({ name: 'profile-my-profile' }))
}

const listRoutes = computed(() => [
  {
    text: t('profile.account.mine'),
    action: navigateToViewMode,
  },
  {
    text: isCreateMode.value
      ? t('profile.myPlan.edit.titleCreate')
      : t('profile.myPlan.edit.title'),
    url: route.fullPath,
  },
])

// --- Plan Flow Logic via Composable ---
const {
  steps,
  stepsCreate,
  currentStep,
  totalPrice,
  frecuency,
  createPlan,
  isLoading,
  dogLoading,
  openDialogNewData,
  petId,
  onlyThisOrder,
  stepsValidation,
  allFormData,
  nextButtonText,
  formattedPrice,
  maxSteps,
  globalPrice,
  updateTotalPrice,
  updateFrecuency,
  updateCreatePlan,
  updateEditPlan,
  updateIdealPlan,
  updatePets,
  updateCheckout,
  nextStep,
  prevStep,
  updateGlobalPrice,
  registerRef,
  finishProcess,
} = usePlanFlow(
  planId.value,
  () => navigateToViewMode(), // onFinish
  () => navigateToViewMode(), // onPrevAtStart
)

watch(createPlan, (newValue) => {
  currentStep.value = 0
  nextTick(() => {
    stepsValidation.value = {
      first: false,
      second: false,
      pets: false,
    }
  })
})

watch(
  [
    () => useFormatPrice(globalPrice.value),
    () => useFormatPrice(plan.value?.total),
  ],
  ([newPrice, newTotal]) => {
    const changes = []
    if (newPrice !== newTotal) {
      changes.push({
        field: 'Price',
        newValue: newPrice,
        oldValue: newTotal,
      })
    }
    systemStore.setMenuOpen(changes.length > 0)
  },
  { deep: true, immediate: true },
)

onMounted(() => {
  nextTick(async () => {
    systemStore.setMenuOpen(false)
    const response = await planStore.getListPlan()

    if (response.status && response.code === 100 && response.data?.id) {
      if (planId.value !== response.data.id && planId.value !== 0) {
        router.push(
          localePath({
            name: 'profile-my-plan-id',
            params: { id: response.data.id },
            query: route.query,
          }),
        )
      }
    } else if (
      !response.status &&
      response.code !== 100 &&
      !response.data?.id
    ) {
      if (planId.value !== 0) {
        router.push(
          localePath({
            name: 'profile-my-plan-id',
            params: { id: 0 },
            query: route.query,
          }),
        )
      }
    }

    if (route.query.addPet === 'true') {
      updateCreatePlan()
    }
  })
})
</script>

<template>
  <div class="tw-h-full lg:tw-py-20 max-lg:tw-py-10 tw-overflow-y-hidden">
    <div class="lg:tw-px-20">
      <GeneralBreadCrumb :routes="listRoutes" />
    </div>
    <!-- INLINED EDIT CONTAINER -->
    <div
      v-if="isEditMode"
      class="tw-flex tw-relative max-lg:tw-w-full tw-h-full"
    >
      <div
        v-if="
          useFormatPrice(plan?.total) !== useFormatPrice(globalPrice) &&
          (createPlan ? currentStep !== 2 : currentStep !== 1)
        "
        class="alert-banner"
      >
        <img
          src="/icons/profile/ic_alert_white.svg"
          alt="alert"
          height="16px"
          width="16px"
          class="tw-relative tw-top-[-6]"
        />
        <span class="tw-ml-2">
          El total ha cambiado: Antes {{ useFormatPrice(plan?.total) }} → Ahora
          {{ useFormatPrice(globalPrice) }} Completa el proceso para aplicar el
          cambio.
        </span>
      </div>

      <div class="tw-w-full lg:tw-pl-20 lg:tw-h-full tw-overflow-x-hidden">
        <h3 class="title primary1 !tw-text-[32px] tw-my-10">
          {{ $t('profile.myPlan.edit.title') }}
        </h3>
        <Timeline
          v-if="isMovil"
          :value="createPlan ? stepsCreate : steps"
          class="general-timeline profile-timeline"
          layout="horizontal"
          align="top"
        >
          <template #marker="slotProps">
            <div
              class="p-timeline-event-marker"
              :class="{
                active: slotProps.index === currentStep,
                finished: slotProps.index < currentStep,
              }"
            ></div>
          </template>

          <template #connector="slotProps">
            <div
              class="p-timeline-event-connector"
              :class="{
                'half-progress': slotProps.index === currentStep,
                completed: slotProps.index < currentStep,
              }"
            ></div>
          </template>

          <template #content="slotProps">
            <span
              class="p-timeline-event-content"
              :class="{ active: slotProps.index === currentStep }"
            >
              {{ slotProps.item }}
            </span>
          </template>
        </Timeline>
        <div v-if="!createPlan" class="component-container-edit">
          <div
            v-if="!isMovil"
            class="stepper-my-pets lg:!tw-w-[15%] lg:tw-pl-4"
          >
            <div
              v-for="(step, index) in steps"
              :key="index"
              class="step-container"
            >
              <div class="text-circle">
                <div
                  class="circle"
                  :class="{
                    active: index === currentStep,
                    finished: index < currentStep,
                  }"
                ></div>
                <p :class="{ active: index === currentStep }">
                  {{ step }}
                </p>
              </div>
              <div class="line-container">
                <div
                  v-if="index < steps.length - 1"
                  class="line"
                  :class="{
                    active: index === currentStep,
                    finished: index < currentStep,
                  }"
                />
              </div>
            </div>
          </div>
          <div
            class="tw-w-full"
            :class="currentStep === 0 ? 'lg:tw-overflow-x-auto' : ''"
          >
            <div v-show="currentStep === 0" class="tw-w-full">
              <ProfileMyPlanEdit
                :ref="(ref) => registerRef('first', ref)"
                :planId="planId"
                v-model="stepsValidation.first"
                @total-price="updateTotalPrice"
                @frecuency="updateFrecuency"
                @finish-form="updateIdealPlan"
                @create-plan="updateCreatePlan"
                @edit-plan="updateEditPlan"
                @total-global-price="updateGlobalPrice"
              />
            </div>
            <div v-if="currentStep === 1" class="tw-w-full">
              <ProfileMyPlanEditCheckout
                :ref="(ref) => registerRef('second', ref)"
                :planId="planId"
                :dataPlan="allFormData.idealPlan"
                v-model="stepsValidation.second"
                @finish-form="updateCheckout"
                @add-order="updateCreatePlan"
                @edit-pet="updateEditPlan"
              />
            </div>
          </div>
        </div>

        <div v-if="createPlan" class="component-container-edit">
          <div
            v-if="!isMovil"
            class="stepper-my-pets lg:!tw-w-[10%] lg:!tw-ml-4 lg:!tw-mx-auto"
          >
            <div
              v-for="(step, index) in stepsCreate"
              :key="index"
              class="step-container"
            >
              <div class="text-circle">
                <div
                  class="circle"
                  :class="{
                    active: index === currentStep,
                    finished: index < currentStep,
                  }"
                ></div>
                <p :class="{ active: index === currentStep }">
                  {{ step }}
                </p>
              </div>
              <div class="line-container">
                <div
                  v-if="index < stepsCreate.length - 1"
                  class="line"
                  :class="{
                    active: index === currentStep,
                    finished: index < currentStep,
                  }"
                ></div>
              </div>
            </div>
          </div>
          <div class="lg:tw-w-full">
            <div
              v-show="currentStep === 0 && !dogLoading"
              class="tw-w-full lg:tw-ml-[10%]"
            >
              <profileMyPlanEditCreate
                :ref="(ref) => registerRef('pets', ref)"
                :planId="planId"
                :petId="petId"
                :initialData="allFormData.pets[petId]"
                v-model="stepsValidation.pets"
                @update-data="updatePets"
              />
            </div>
            <div v-if="dogLoading">
              <CreateLoading
                :grammage="5"
                @next-step="dogLoading = false"
                :customHeight="isMovil ? '100%' : '100vh'"
                customTop="-100px"
                :customZIndex="49"
                :customLeft="'0'"
              />
            </div>
            <div v-show="currentStep === 1 && !dogLoading" class="tw-w-full">
              <ProfileMyPlanEdit
                :ref="(ref) => registerRef('first', ref)"
                :planId="planId"
                v-model="stepsValidation.first"
                @total-price="updateTotalPrice"
                @create-plan="updateCreatePlan"
                @frecuency="updateFrecuency"
                @finish-form="updateIdealPlan"
                @edit-plan="updateEditPlan"
                @total-global-price="updateGlobalPrice"
              />
            </div>
            <div v-if="currentStep === 2" class="tw-w-full">
              <ProfileMyPlanEditCheckout
                :ref="(ref) => registerRef('second', ref)"
                :planId="planId"
                :dataPlan="allFormData.idealPlan"
                v-model="stepsValidation.second"
                @edit-pet="updateEditPlan"
                @finish-form="updateCheckout"
                @add-order="updateCreatePlan"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="!dogLoading" class="edit-plan-footer">
        <div
          class="tw-flex tw-flex-row-reverse tw-gap-3 tw-w-full tw-justify-between"
        >
          <Button
            class="app-general-button btn-solo-create flex align-items-center justify-content-center gap-3 !tw-w-[200px] tw-mb-[12px] max-lg:tw-mr-4"
            @click="nextStep"
            :disabled="isLoading"
            :loading="isLoading"
          >
            {{ nextButtonText }}
            <i class="pi pi-arrow-right"></i>
          </Button>

          <span
            v-if="
              !totalPrice ||
              (createPlan && currentStep === 0) ||
              (currentStep === 2 && createPlan) ||
              (currentStep === 1 && !createPlan)
            "
            class="cancel-btn"
            @click="prevStep"
            :disabled="isLoading"
          >
            <i class="pi pi-arrow-left"></i>
            {{ currentStep > 0 ? 'Volver' : $t('create.footer.cancel') }}
          </span>

          <span
            v-if="
              (totalPrice && currentStep === 0 && !createPlan) ||
              (currentStep === 1 && totalPrice && createPlan)
            "
            class="products-price"
          >
            {{ formattedPrice }}
          </span>
        </div>
      </div>
      <GeneralDialogNewData
        v-model:show="openDialogNewData"
        @all-plan="(onlyThisOrder = false), finishProcess()"
        @only-this="(onlyThisOrder = true), finishProcess()"
      />
    </div>

    <!-- Keep existing Create Mode container -->
    <ProfileMyPlanCreatePlanContainer
      v-if="isCreateMode"
      @go-back="navigateToViewMode"
    />
  </div>
</template>

<style scoped lang="scss">
.component-container-edit {
  @apply tw-flex  tw-my-5 max-lg:tw-flex-col max-lg:tw-overflow-x-hidden;
}
.alert-banner {
  @apply tw-flex tw-fixed tw-font-treble-bold tw-w-full lg:tw-h-[36px] tw-top-[57px] tw-justify-center tw-items-center tw-bg-[#EDB724] tw-left-0 max-lg:tw-h-[60px];
  @apply tw-text-[11px] max-lg:tw-px-5 tw-z-50;
}

.edit-plan-footer {
  @apply tw-flex  tw-gap-4 tw-pt-2 tw-flex-row-reverse lg:tw-px-20 max-lg:tw-pl-4  tw-items-center tw-justify-between;
  @apply lg:tw-w-[100%] lg:tw-left-[0] max-lg:tw-left-[-14px] tw-fixed lg:tw-h-[64px] tw-bottom-0  tw-z-10;
  @media (max-width: 1023px) {
    width: calc(100% + 2rem);
  }
  background-color: #ffffff;

  .products-price {
    @apply tw-text-[#1A1A29] lg:tw-text-[18px] tw-font-treble-bold;
    @apply max-lg:tw-text-[14px] max-lg:tw-flex max-lg:tw-items-center;
  }
}
.cancel-btn {
  @apply tw-cursor-pointer tw-flex tw-items-center tw-h-[37px] tw-gap-3;
  color: $primary-1;
  font-size: 16px;
}
</style>
