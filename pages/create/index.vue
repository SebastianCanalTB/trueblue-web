<script setup lang="ts">
definePageMeta({
  layout: 'custom',
})

/*stores */
const systemStore = useSystemStore()
const accountStore = useAccountStore()
const allProductsStore = useAllProductsStore()
const referralStore = useReferralStore()
const calculatorStore = useCalculatorStore()
/** Variables*/
const { isMovil } = storeToRefs(systemStore)
const { getAllFormsData: storedForms, getFrecuency: storedFrecuency } =
  storeToRefs(allProductsStore)
const { getInfoCupon: cupon, preSelectedProduct } = storeToRefs(accountStore)
const { getInfoReferalCodes: referralData } = storeToRefs(referralStore)
const router = useRouter()
const route = useRoute()
const localePath = useLocalePath()
const isEditing = ref(false)

const steps = ['Mascota', 'Sobre mí', 'Plan ideal']
const stepQueries = ['pet', 'about-me', 'ideal-plan']
const { t } = useI18n()
const loading = ref(true)

const getStepFromQuery = (query: string): number => {
  const index = stepQueries.indexOf(query)
  return index !== -1 ? index : 0
}

const getQueryFromStep = (step: number): string => {
  return stepQueries[step] || stepQueries[0]
}

const updateURLForStep = (step: number) => {
  const newQuery = getQueryFromStep(step)
  const queryParams: any = { ...route.query, step: newQuery }

  if (step === 0) {
    const createPetsRef = itemRefs.value.find((t: any) => t.type === 'pets')
    if (createPetsRef && createPetsRef.ref && createPetsRef.ref.step) {
      queryParams.substep = getQueryFromSubStep(createPetsRef.ref.step)
    } else {
      queryParams.substep = queryParams.substep || 'bodyCondition'
    }
  } else {
    delete queryParams.substep
  }

  router.push({ query: queryParams })
}
const getQueryFromSubStep = (subStep: string): string => {
  const subStepQueries = [
    'meet',
    'calculation',
    'active',
    'bodyCondition',
    'portion',
  ]
  return subStepQueries.includes(subStep) ? subStep : 'meet'
}

const currentStep = ref(getStepFromQuery(route.query.step as string))

const itemRefs = ref<any[]>([])
const loadingDog = ref(false)
const createPetsStep = ref('meet')
const totalPrice = ref(0)
const grammage = ref(0)
const productsInformation = ref()
const selectedFrequency = ref(null)

const allFormData = ref({
  pets: {},
  aboutMe: null,
  idealPlan: {},
  grammage: null,
})

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

const nextStep = () => {
  const step = formValidate()
  const ref = itemRefs.value.find((t: any) => t.type === step)
  if (ref) {
    ref.ref.onSubmit()
    if (currentStep.value === 1 && stepsValidate.value.second === true) {
      loadingDog.value = true
    }
  }
  return step
}

const prevStep = () => {
  const step = formValidate()
  const ref = itemRefs.value.find((t: any) => t.type === step)

  if (currentStep.value > 0) {
    currentStep.value--
    if (
      currentStep.value === 2 &&
      storedForms.value.length > 0 &&
      !allFormData.value?.pets?.form1
    ) {
      currentStep.value = 0
      router.replace({
        query: {
          step: 'pet',
          substep: 'meet',
        },
      })
    }
    if (
      currentStep.value === 2 &&
      storedForms.value.length > 0 &&
      allFormData.value?.pets?.form1
    ) {
      allProductsStore.deleteSelectedAllFromData(storedForms.value.length - 1)
      const thirdStep = itemRefs.value.find((t: any) => t.type === 'third')
      if (thirdStep && thirdStep.ref && allFormData.value.grammage) {
        thirdStep.ref.getPlanTotal()
      }
    }
    if (currentStep.value === 1) {
      currentStep.value--
    }
  } else if (ref) {
    validationFirst.value = true
    ref.ref.goBack()
  }
}

const finishPets = async (value) => {
  allFormData.value.pets = value

  if (currentStep.value === 0 && allFormData.value.aboutMe !== null) {
    loadingDog.value = true
    currentStep.value = 2
  } else {
    currentStep.value++
  }
  const sendDataForProducts = ref({
    age: +allFormData?.value?.pets.form1.years,
  })
  const resultProducts = await accountStore.getFoodRelatedToPet(
    sendDataForProducts.value,
  )
  productsInformation.value = resultProducts.data
  const sendDataForCalculation = ref({
    years: +allFormData?.value?.pets.form1.years,
    months: +allFormData?.value?.pets.form1.months,
    weight: +allFormData?.value?.pets.form2.actualWeight,
    petsBodyConditionId: allFormData?.value?.pets.form2.bodyCondition,
    sterilized: allFormData?.value?.pets.form2.castrated,
    petsActivityId: allFormData?.value?.pets.form3.option,
    // productId: productsInformation.value[preSelectedProduct.value].id,
    // isMixedFood: allFormData?.value?.pets?.form5?.portions
    //   ? allFormData?.value?.pets.form5.portions
    //   : false,
  })

  const response = await calculatorStore.getCalculations(
    sendDataForCalculation.value,
  )
  if (response.status && response.code === 100) {
    grammage.value = response.data.grammage

    allFormData.value.grammage = grammage.value
  }

  const thirdStep = itemRefs.value.find((t: any) => t.type === 'third')
  if (thirdStep && thirdStep.ref && allFormData.value.grammage) {
    thirdStep.ref.getPlanTotal()
  }
}

const finishAboutMe = (value) => {
  if (stepsValidate.value.second === false) {
    return false
  } else {
    allFormData.value.aboutMe = value
    currentStep.value++
  }
  const thirdStep = itemRefs.value.find((t: any) => t.type === 'third')
  if (thirdStep && thirdStep.ref && allFormData.value.grammage) {
    thirdStep.ref.getPlanTotal()
  }
}

const finishRecommendedPlan = async (value) => {
  allFormData.value.idealPlan = value
  selectedFrequency.value =
    allFormData.value.idealPlan.frecuency || storedFrecuency.value

  if (allFormData.value.pets) {
    const formDataCopy = JSON.parse(JSON.stringify(allFormData.value))
    allProductsStore.setAllFormData(formDataCopy)
  }
  if (isEditing.value) {
    allProductsStore.deleteSelectedAllFromData(storedForms.value.length - 2)
    isEditing.value = false
  }

  const fourthStep = itemRefs.value.find((t: any) => t.type === 'fourth')

  currentStep.value++
}

const stepsValidate = ref({
  first: {
    meet: false,
    calculation: false,
    active: false,
    body: false,
  },
  second: false,
  third: false,
  fourth: false,
})

const formValidate = () => {
  let step = ''
  switch (currentStep.value) {
    case 0:
      step = 'pets'
      break
    case 1:
      step = 'second'
      break
    case 2:
      step = 'third'
      break
    case 3:
      step = 'fourth'
      break
    case 4:
      step = 'fifth'
      break
    default:
      return false
  }
  return step
}
const validationFirst = ref(false)
const resetFlag = ref(false)

const resetForm = () => {
  if (allFormData.value.pets) {
    allFormData.value.pets = null
    allFormData.value.idealPlan = null
  }

  currentStep.value = 0
  prevStep()
  prevStep()
  prevStep()
  prevStep()

  resetFlag.value = true
  grammage.value = 0
  setTimeout(() => {
    resetFlag.value = false
  }, 100)
}

const editOrderItem = (index) => {
  editLastOrder()
  isEditing.value = true

  allProductsStore.editSelectedAllFromData(index)
  allFormData.value = JSON.parse(
    JSON.stringify(storedForms.value[storedForms.value.length - 1]),
  )
}

const editLastOrder = () => {
  currentStep.value = 0
  prevStep()
  prevStep()
  prevStep()
  prevStep()
}

watch(
  currentStep,
  (newStep, oldStep) => {
    if (newStep !== oldStep) {
      updateURLForStep(newStep)
    }
  },
  { immediate: false },
)

watch(
  () => route.query.step,
  (newQuery) => {
    if (newQuery && typeof newQuery === 'string') {
      const newStep = getStepFromQuery(newQuery)
      if (currentStep.value !== newStep) {
        currentStep.value = newStep
      }
    }
  },
)

onMounted(() => {
  nextTick(async () => {
    currentStep.value = -1
    loading.value = true
    await accountStore.firstCupon()
    await accountStore.getParametization()
    await accountStore.getDeliveryDates()
    await referralStore.getReferalCodes()
    await accountStore.getDocumentsRegister()
    if (storedForms?.value[0]?.pets?.form1?.name) {
      selectedFrequency.value =
        storedForms.value[storedForms.value.length - 1].idealPlan.frecuency
      allFormData.value = JSON.parse(
        JSON.stringify(storedForms.value[storedForms.value.length - 1]),
      )
      grammage.value = allFormData.value.grammage
      const sendDataForProducts = ref({
        age: +allFormData?.value?.pets.form1.years,
      })
      const resultProducts = await accountStore.getFoodRelatedToPet(
        sendDataForProducts.value,
      )
      productsInformation.value = resultProducts.data

      currentStep.value = 3
      router.replace({
        query: {
          step: 'checkout',
        },
      })
    } else {
      currentStep.value = 0
      router.replace({
        query: {
          step: 'pet',
          substep: 'meet',
        },
      })
      updateURLForStep(currentStep.value)
    }
    loading.value = false
  })
})
</script>
<template>
  <div :class="currentStep === 3 ? 'tw-bg-white' : 'tw-bg-[#f5f6fa]'">
    <header
      class="create-header"
      :class="{ transparent: currentStep === 2 && !loadingDog }"
    >
      <nav>
        <img
          src="/icons/LOGO-TRUE-BLUE-HEADER.svg"
          alt="true_blue_logo"
          width="129px"
          height="22px"
          class="tw-cursor-pointer lg:tw-absolute"
          @click="router.push(localePath({ name: 'index' }))"
        />
      </nav>
    </header>
    <div
      v-if="currentStep === 2 && !loadingDog"
      class="background-create-container"
    >
      <div class="background-create"></div>
      <div class="wave"></div>
    </div>
    <main
      class="create-main tw-pb-20"
      :class="{
        transparent: currentStep === 2 && !loadingDog,
      }"
    >
      <div class="flex tw-w-full max-lg:tw-flex-col">
        <Timeline
          v-if="isMovil && !loading"
          :value="steps"
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
              :class="{
                active: slotProps.index === currentStep,
                change: currentStep === 2 && slotProps.index < currentStep,
              }"
            >
              {{ slotProps.item }}
            </span>
          </template>
        </Timeline>
        <div
          v-if="!isMovil && !loading && currentStep !== 3"
          class="lg:tw-w-[200px] lg:!tw-ml-[10%] max-lg:tw-w-full max-lg:tw-flex md:tw-justify-center tw-absolute"
        >
          <div class="stepper-my-pets">
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
                <p
                  :class="{
                    active: index === currentStep,
                    thirdStep: currentStep === 2,
                  }"
                >
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
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div class="lg:tw-w-full" :class="{ 'lg:tw-px-52': currentStep !== 3 }">
          <CreatePets
            v-show="currentStep === 0"
            v-model:model-value="stepsValidate.first.meet"
            v-model:calculation-value="stepsValidate.first.calculation"
            v-model:active-value="stepsValidate.first.active"
            v-model:body-value="stepsValidate.first.body"
            :ref="
              ($ref) => {
                const refData = { type: 'pets', ref: $ref }
                itemRefs.push(refData)
                if ($ref) {
                  createPetsStep = $ref.step
                }
              }
            "
            :resetForm="resetFlag"
            :editData="allFormData.pets"
            @finish="finishPets"
          />
          <CreateSecondStep
            v-show="currentStep === 1"
            :ref="($ref) => itemRefs.push({ type: 'second', ref: $ref })"
            v-model:modelValue="stepsValidate.second"
            @finish-form="finishAboutMe"
          />
          <CreateLoading
            v-if="loadingDog"
            @next-step="loadingDog = false"
            :grammage="grammage"
          />
          <CreateThirdStep
            v-show="currentStep === 2 && !loadingDog"
            :ref="($ref) => itemRefs.push({ type: 'third', ref: $ref })"
            v-model="stepsValidate.third"
            :resetForm="resetFlag"
            :dogData="allFormData?.pets"
            :editData="allFormData.idealPlan"
            :planData="productsInformation"
            :grammage="grammage"
            :frequency="selectedFrequency"
            :hidePrices="true"
            @finish-form="finishRecommendedPlan"
          />
        </div>
      </div>
    </main>
    <GeneralCarusel
      v-if="currentStep === 2 && !loadingDog"
      style="bottom: 48px; z-index: 30"
      :position="'fixed'"
      :slideHeight="32"
      :slideWidth="1000"
      :background="'#EDEDF1'"
      :slides="slites"
      :animationSpeed="25"
    />
    <div
      v-if="!loadingDog && currentStep < 4"
      class="create-footer"
      :class="isMovil && currentStep === 2 ? 'tw-h-[50px]' : 'tw-pb-[10px]'"
    >
      <div
        class="tw-flex tw-flex-row-reverse tw-gap-3 max-lg:tw-w-full max-lg:tw-justify-between"
      >
        <Button
          v-if="currentStep !== 2"
          class="app-general-button btn-solo-create flex align-items-center justify-content-center gap-3 !tw-w-[200px]"
          @click="nextStep"
        >
          {{
            currentStep === 3
              ? $t('create.footer.confirm')
              : $t('create.footer.continue')
          }}
          <i class="pi pi-arrow-right"></i>
        </Button>
        <button
          v-if="
            currentStep > 0 || (currentStep === 0 && createPetsStep !== 'meet')
          "
          class="app-general-button btn-solo-login !tw-w-[82px]"
          @click="prevStep"
        >
          <i class="pi pi-arrow-left"></i>
        </button>
      </div>
      <span
        v-if="!isMovil"
        @click="router.push(localePath({ name: 'index' }))"
        class="cancel-btn"
      >
        {{ $t('create.footer.cancel') }}
      </span>
      <span
        v-if="
          isMovil &&
          createPetsStep === 'meet' &&
          currentStep === 0 &&
          totalPrice === 0
        "
        @click="router.push(localePath({ name: 'index' }))"
        class="cancel-btn"
      >
        {{ $t('create.footer.cancel') }}
      </span>
    </div>

    <!-- <div class="chat" @click="useOpenWhatsApp">
      <GeneralChat />
    </div> -->
  </div>
</template>
<style lang="scss">
.create-header {
  nav {
    @apply lg:tw-h-[58px] lg:tw-px-8 tw-flex tw-justify-between tw-items-center lg:tw-gap-6;
    @apply max-lg:tw-flex-col max-lg:tw-relative max-lg:tw-bottom-[-11px];
    color: #1a1a29;

    .discount-create {
      @apply tw-mx-auto tw-my-2;
      height: 35px;
      max-width: 211px;
      align-items: center;
      display: flex;
      color: $instruction;
      background-color: #ccdef5;
      padding-left: 15px;
      padding-right: 15px;
      border-radius: 5px;
      font-family: 'heading-pro-treble-bold';
      font-size: 12px;

      &.change {
        background-color: rgb(43, 126, 226, 0.2);
      }
    }
    .message {
      @apply tw-flex lg:tw-gap-1 max-lg:tw-px-[7%] tw-text-575E6B tw-font-treble-book max-lg:tw-text-center;
    }
  }

  &.transparent {
    @apply max-lg:tw-bg-[#96d9e9] lg:tw-bg-transparent max-lg:tw-min-h-[81px];
    z-index: 10;
    position: relative;
  }
}

.background-create-container {
  .background-create {
    @apply lg:tw-bg-contain  lg:tw-top-0 max-lg:tw-top-[80px];
    background-image: url('/icons/registry/ic_color_bg.svg');
    background-repeat: repeat-x;
    position: absolute;
    object-fit: contain;
    height: 100%;
    width: 100%;
    z-index: 3;
  }

  &::after {
    @apply max-lg:tw-hidden;
    content: '';
    background-image: url('/icons/registry/ic_dog_bg_third.svg');
    width: 238px;
    height: 318px;
    position: absolute;
    top: 0;
    right: 0;
    z-index: 10;
  }

  .wave {
    background-color: #f5f6fa;
    position: absolute;
    height: 100%;
    max-height: 1228px;
    width: 100%;
    z-index: 2;

    &::before {
      @apply max-lg:tw-hidden;
      content: '';
      background-image: url('/icons/registry/ic_food_bg_right.svg');
      position: fixed;
      height: 100%;
      width: 150px;
      right: 0;
      top: 0;
      background-repeat: no-repeat;
      opacity: 0.2;
    }

    &::after {
      @apply max-lg:tw-hidden;
      content: '';
      background-image: url('/icons/registry/ic_food_bg_left.svg');
      position: fixed;
      height: 100%;
      width: 300px;
      left: 0;
      top: 0;
      background-repeat: no-repeat;
      opacity: 0.2;
    }
  }
}

.create-main {
  @apply tw-flex lg:tw-pt-[50px];
  @apply max-lg:tw-flex-col  tw-overflow-x-hidden tw-overflow-y-hidden;
  min-height: calc(100vh - 115px) !important;

  &.transparent {
    background: none;
    z-index: 10;
    position: relative;
  }
}
.chat {
  cursor: pointer;
  z-index: 2000;
  position: fixed;
  height: 56px;
  width: 56px;
  bottom: 7%;
  right: 5%;
  background-color: #fff;
  border-radius: 50%;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  animation: float 2s infinite ease-in-out;
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
.create-footer {
  @apply tw-flex tw-gap-4 tw-pt-2 tw-flex-row-reverse lg:tw-px-10 max-lg:tw-px-4 tw-items-center tw-justify-between;
  @apply tw-fixed tw-w-full lg:tw-bottom-0 max-lg:tw-bottom-0 tw-z-10 lg:tw-h-[50px];
  background-color: #ffffff;

  .cancel-btn {
    @apply tw-cursor-pointer;
    color: $primary-1;
    font-size: 16px;
  }

  .prodcuts-price {
    @apply tw-text-[#1A1A29] tw-text-[18px] tw-font-treble-bold;
    @apply max-lg:tw-text-center max-lg:tw-w-full max-lg:tw-absolute max-lg:tw-top-0 max-lg:tw-pb-2;
  }
}
</style>
