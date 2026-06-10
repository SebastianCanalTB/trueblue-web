<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

interface FormData {
  pets: any | null
  idealPlan: any | null
  checkout: any | null
}

interface ItemRef {
  type: string
  ref: any
}
const emit = defineEmits(['go-back'])
const { t } = useI18n()
const systemStore = useSystemStore()
const accountStore = useAccountStore()
const createStore = useCreateStore()
const planStore = usePlanStore()
const { isMovil } = storeToRefs(systemStore)
const { getAllMyPlan: myPlan, getAllMyActivePets: activePets } =
  storeToRefs(planStore)
const { getMyPet: myPet } = storeToRefs(createStore)
const { getProfileInformation: profile } = storeToRefs(accountStore)
const stepsCreate = ['Mascota', 'Plan ideal', 'Checkout']
const allOrders = ref<any[]>([])
const route = useRoute()
const currentStep = ref(0)
const totalPrice = ref(0)
const itemRefs = ref<ItemRef[]>([])
const createPlan = ref(false)
const grammage = ref(0)
const onlyThisOrder = ref(false)
const openDialogNewData = ref(false)
const isLoading = ref(false)
const dogLoading = ref(false)
const productsInformation = ref()
const newPetId = ref(0)
const stepsValidation = ref({
  first: false,
  second: false,
  pets: false,
})

const allFormData = ref<FormData>({
  pets: null,
  idealPlan: null,
  checkout: null,
})

const nextButtonText = computed(() => {
  const lastStep = currentStep.value === 2

  return lastStep
    ? route.query.id === '0'
      ? t('create.footer.addPet')
      : t('create.footer.updatePet')
    : t('create.footer.continue')
})
const deliveryResume = ref()
const updateIdealPlan = async (value: any) => {
  allFormData.value.idealPlan = value
  getDeliveryPrices()
  stepsValidation.value.first = true
}

const updatePets = async (value: any) => {
  allFormData.value.pets = value
  const sendDataForProducts = ref({
    age: +allFormData?.value?.pets.years,
  })
  const resultProducts = await accountStore.getFoodRelatedToPet(
    sendDataForProducts.value,
  )
  productsInformation.value = resultProducts.data

  const response = await accountStore.getCalculation({
    age: +allFormData?.value?.pets.years,
    month: +allFormData?.value?.pets.months,
    currentWeight: +allFormData?.value?.pets.actualWeight,
    bodyCondition: allFormData?.value?.pets.recommendedWeight,
    sterilization: allFormData?.value?.pets.castrated,
    petsActivity: allFormData?.value?.pets.dogActive,
    isMixedFood: allFormData?.value?.pets?.portions
      ? allFormData?.value?.pets?.portions
      : false,
  })

  grammage.value = response.data
  allFormData.value.grammage = grammage.value
  stepsValidation.value.pets = true
}

const updateCheckout = (checkoutData: any, filteredProcessedOrders: any) => {
  allFormData.value.checkout = checkoutData

  stepsValidation.value.second = true
  if (allFormData.value.pets && allFormData.value.idealPlan) {
    const formDataCopy = JSON.parse(JSON.stringify(allFormData.value))
    if (formDataCopy.pets) {
      allOrders.value.push(formDataCopy)
    }
  }
  if (
    allFormData.value.checkout.addressId !== profile.value.addresses[0].id ||
    allFormData.value.checkout.cardId !== profile.value.card[0].id
  ) {
    openDialogNewData.value = true
  } else {
    finishProcess()
  }
}
const transformOrderDataForCreation = (currentOrders, checkoutData) => {
  const flag = onlyThisOrder.value === true ? 'temporary' : 'general'

  const firstOrder = currentOrders[0]
  const pet = {
    name: firstOrder.pets.name,
    sex: firstOrder.pets.genre,
    age: parseInt(firstOrder.pets.years, 10),
    month: parseInt(firstOrder.pets.months, 10),
    currentWeight: parseFloat(firstOrder.pets.actualWeight),
    bodyCondition: firstOrder.pets.recommendedWeight,
    sterilization: firstOrder.pets.castrated,
    isMixedFood: firstOrder?.pets?.portions
      ? firstOrder?.pets?.portions
      : false,
    race: firstOrder.pets.raze,
    petsActivity: firstOrder.pets.dogActive,
    planDetail: {
      detailProducts: firstOrder.idealPlan.selectedProducts.map(
        (product) => product.id,
      ),
    },
  }

  const frequency = myPlan.value.frequency === '4 semanas' ? 1 : 2

  let checkout =
    checkoutData ||
    (currentOrders.length > 0 &&
      currentOrders[currentOrders.length - 1].checkout) ||
    null
  const deliveryDate = checkout.deliveryDate
  const code = checkout.code
  checkout = (({ deliveryDate, code, ...rest }) => rest)(checkout)
  return {
    flag,
    pet,
    code,
    deliveryDate,
    checkout,
    frequency,
  }
}

const finishProcess = async () => {
  useLoading(true)
  const checkoutData = allFormData.value.checkout
  const transformedData = transformOrderDataForCreation(
    allOrders.value,
    checkoutData,
  )
  if (Number(route.query.id) !== 0) {
    const response = await createStore.updatePet(
      transformedData,
      Number(route.query.id),
    )
    if (response.status && response.code === 100) {
      useShowAlert({
        message: response.message,
        type: 'success',
      })
      emit('go-back')
    } else {
      useShowAlert({
        message: response.message,
        type: 'error',
      })
    }
  } else {
    const response = await createStore.createPet(transformedData)
    if (response.status && response.code === 100) {
      useShowAlert({
        message: response.message,
        type: 'success',
      })
      emit('go-back')
    } else {
      useShowAlert({
        message: response.message,
        type: 'error',
      })
    }
  }
  useLoading(false)
}
const nextStep = async () => {
  isLoading.value = true

  try {
    let validationSucceeded = false

    if (currentStep.value === 0) {
      validationSucceeded = await validatePetsStep()
      if (validationSucceeded) {
        dogLoading.value = true
        currentStep.value++
        isLoading.value = false
        return
      }
    } else if (currentStep.value === 1) {
      validationSucceeded = await validatePlanStep()
      if (validationSucceeded) {
        currentStep.value++
      }
    } else if (currentStep.value === 2) {
      validationSucceeded = await validateCheckoutStep()
    }
  } catch (error) {
    console.error('Error durante la validación:', error)
  } finally {
    isLoading.value = false
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  } else {
    emit('go-back')
  }
}
const getDeliveryPrices = async (cupon?: any) => {
  if (!allFormData.value.pets || !allFormData.value.idealPlan) return

  const deliveryResumeDataToSend = {
    planId: useSearchItemJson('id', myPlan.value) || '0',
    frequency: myPlan.value.frequency === '4 semanas' ? 1 : 2,
    pets: [
      {
        grams: allFormData.value.grammage,
        pet: allFormData.value.pets.name,
        products: allFormData.value.idealPlan.selectedProducts.map((t) => t.id),
        cuponId: cupon?.id || null,
      },
    ],
  }
  const response = await accountStore.getPurchaseValues(
    deliveryResumeDataToSend,
  )
  deliveryResume.value = response.data
}
const validatePetsStep = async () => {
  const ref = itemRefs.value.find((item) => item.type === 'pets')
  if (!ref || !ref.ref) return false

  try {
    const result = await ref.ref.onSubmit()
    return !!result
  } catch (error) {
    console.error('Error al validar el paso de mascotas:', error)
    return false
  }
}

const validatePlanStep = async () => {
  const ref = itemRefs.value.find((item) => item.type === 'first')
  if (!ref || !ref.ref) return false

  try {
    const result = await ref.ref.onSubmit()
    return !!result
  } catch (error) {
    console.error('Error al validar el paso de plan:', error)
    return false
  }
}
const deleteOrderItem = (index) => {
  allOrders.value.splice(index, 1)
}
const deleteLastOrder = () => {
  allFormData.value.pets = null
  allFormData.value.idealPlan = null
}
const validateCheckoutStep = async () => {
  const ref = itemRefs.value.find((item) => item.type === 'second')
  if (!ref || !ref.ref) return false

  try {
    const result = await ref.ref.onSubmit()
    return !!result
  } catch (error) {
    console.error('Error al validar el paso de checkout:', error)
    return false
  }
}

const editOrderItem = (index) => {
  editLastOrder()
  if (allFormData.value.pets && allFormData.value.idealPlan) {
    const formDataCopy = JSON.parse(JSON.stringify(allFormData.value))
    if (formDataCopy.pets) {
      allOrders.value.push(formDataCopy)
    }
  }
  allFormData.value = JSON.parse(JSON.stringify(allOrders.value[index]))
  allOrders.value.splice(index, 1)
}
const editLastOrder = () => {
  currentStep.value = 0
}
const registerRef = (type: string, ref: any) => {
  if (!ref) return
  const existingIndex = itemRefs.value.findIndex((item) => item.type === type)
  if (existingIndex >= 0) {
    itemRefs.value[existingIndex].ref = ref
  } else {
    itemRefs.value.push({ type, ref })
  }
}
const selectedFrequency = ref(null)

const updateFrequency = async (frequency) => {
  selectedFrequency.value = frequency
  const response = await accountStore.getPurchaseValues({
    planId: route.query.id === '0' ? null : route.query.id,
    frequency: selectedFrequency.value,
    pets: [
      {
        grams: grammage.value,
        pet: allFormData.value.pets.name,
        products: [19],
      },
    ],
  })
  totalPrice.value = response.data
}

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
const loadEditData = async () => {
  if (Number(route.query.id) === 0) return
  await createStore.getOnePet(Number(route.query.id))
}
onMounted(() => {
  nextTick(async () => {
    await planStore.getListPlan()

    if (Number(route.query.id) !== 0) {
      createPlan.value = true
      loadEditData()
    } else {
      createPlan.value = false
    }
  })
})
</script>

<template>
  <div class="tw-flex tw-w-full tw-h-full">
    <div
      class="lg:tw-w-full lg:tw-pl-10 lg:tw-h-full max-lg:tw-w-full max-lg:tw-pr-6 lg:tw-pb-10"
    >
      <h3 class="title primary1 !tw-text-[32px] tw-my-10">
        {{
          Number(route.query.id) !== 0
            ? $t('profile.myPets.edit')
            : $t('profile.myPets.create')
        }}
      </h3>
      <div class="component-container-edit">
        <Timeline
          v-if="isMovil"
          :value="stepsCreate"
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
        <div v-if="!isMovil" class="max-lg:tw-w-full max-lg:tw-flex">
          <div
            class="stepper-my-pets lg:!tw-w-[10%] lg:!tw-ml-4 max-lg:!tw-w-full"
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
        </div>
        <div class="tw-w-full">
          <div v-show="currentStep === 0 && !dogLoading" class="tw-w-full">
            <profileMyPetsCreateStepOne
              :ref="(ref) => registerRef('pets', ref)"
              v-model="stepsValidation.pets"
              @update-data="updatePets"
            />
          </div>
          <div v-if="dogLoading">
            <CreateLoading
              :grammage="grammage"
              @next-step="dogLoading = false"
              customHeight="100vh"
              customTop="0"
              :customZIndex="49"
              :customLeft="isMovil ? '-15px' : 0"
            />
          </div>
          <div v-show="currentStep === 1 && !dogLoading" class="tw-w-full">
            <profileMyPetsCreateStepTwo
              :ref="(ref) => registerRef('first', ref)"
              v-model="stepsValidation.first"
              :dog-name="allFormData?.pets?.name"
              :editData="myPet.planDescriptions"
              :planData="productsInformation"
              :grammage="grammage"
              :frequency="myPlan.frequency"
              @finish-form="updateIdealPlan"
              @frequency-change="updateFrequency"
            />
          </div>
          <div v-show="currentStep === 2" class="tw-w-full">
            <!-- @restartForms="resetForm" -->
            <profileMyPetsCreateStepThree
              :ref="(ref) => registerRef('second', ref)"
              v-model="stepsValidation.second"
              @finish-form="updateCheckout"
              :allInfo="activePets"
              :lastOrder="allFormData"
              :deliveryResume="deliveryResume"
              @delete-order="deleteOrderItem"
              @delete-last-order="deleteLastOrder"
              @edit-order="editOrderItem"
              @cupon-applied="getDeliveryPrices"
              @edit-last-order="editLastOrder"
              @go-back="editLastOrder"
            />
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="!dogLoading"
      class="edit-plan-footer-my-pets"
      :class="{
        'max-lg:tw-h-[77px]': currentStep === 1 && totalPrice,
      }"
    >
      <div class="tw-flex tw-gap-3 tw-w-full tw-justify-between">
        <span
          v-if="
            ((currentStep === 0 && !totalPrice) || currentStep === 2) &&
            !isMovil
          "
          class="cancel-btn"
          @click="emit('go-back')"
          :disabled="isLoading"
        >
          <i class="pi pi-arrow-left"></i>
          {{ $t('create.footer.cancel') }}
        </span>
        <div>
          <span
            v-if="totalPrice && currentStep === 1"
            class="products-price-pets"
          >
            {{
              useFormatPrice(totalPrice.total) +
              ' / ' +
              (myPlan.frequency ||
                (selectedFrequency === 1 ? 'Mensual' : 'Quincenal'))
            }}
          </span>
        </div>
        <div
          class="tw-flex tw-gap-5 max-lg:tw-justify-between max-lg:tw-w-full"
          :class="{
            'max-lg:tw-relative max-lg:tw-bottom-[-8px] ': currentStep === 1,
          }"
        >
          <button
            v-if="(currentStep > 0 && !isMovil) || isMovil"
            class="app-general-button btn-solo-login !tw-w-[82px] !tw-h-[37px]"
            @click="prevStep"
          >
            <i class="pi pi-arrow-left"></i>
          </button>
          <Button
            class="app-general-button btn-solo-create flex align-items-center justify-content-center gap-3 !tw-w-[220px] tw-mb-[12px] max-lg:tw-mr-4"
            @click="nextStep"
            :disabled="isLoading"
            :loading="isLoading"
          >
            {{ nextButtonText }}
            <i class="pi pi-arrow-right"></i>
          </Button>
        </div>
      </div>
    </div>
    <GeneralDialogNewData
      v-model:show="openDialogNewData"
      @all-plan="(onlyThisOrder = false), finishProcess()"
      @only-this="(onlyThisOrder = true), finishProcess()"
    />
  </div>
</template>
<style lang="scss">
.component-container-edit {
  @apply tw-flex tw-my-5 max-lg:tw-flex-col tw-overflow-x-hidden;
}

.edit-plan-footer-my-pets {
  @apply tw-flex tw-gap-4 tw-pt-2 tw-flex-row-reverse lg:tw-px-20 max-lg:tw-pl-4 tw-items-center tw-justify-between;
  @apply tw-w-[100%] tw-left-[0] tw-fixed lg:tw-h-[64px] tw-bottom-0 tw-z-10;

  background-color: #ffffff;

  .products-price-pets {
    @apply tw-text-[#1A1A29] lg:tw-text-[18px] tw-font-treble-bold;
    @apply max-lg:tw-text-[14px] max-lg:tw-flex max-lg:tw-items-center max-lg:tw-absolute max-lg:tw-w-full max-lg:tw-justify-center max-lg:tw-top-0;
  }
}

.cancel-btn {
  @apply tw-cursor-pointer tw-flex tw-items-center tw-h-[37px] tw-gap-3;
  color: $primary-1;
  font-size: 16px;
}
</style>
