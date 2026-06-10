<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'

interface FormData {
  pets: any[] | null
  idealPlan: any | null
  checkout: any | null
}

interface ItemRef {
  type: string
  ref: any
}
const emit = defineEmits(['go-back', 'pet-id'])

const systemStore = useSystemStore()
const accountStore = useAccountStore()
const planStore = usePlanStore()
const allProductsProfileStore = useAllProductsProfileStore()
const cardStore = useCardStore()
const { getAllFormsData: storedForms } = storeToRefs(allProductsProfileStore)
const { getAllMyCards: cards } = storeToRefs(cardStore)
const { isMovil } = storeToRefs(systemStore)
const { getProfileInformation: profile } = storeToRefs(accountStore)
const steps = ['Plan ideal', 'Checkout']
const stepsCreate = ['Mascota', 'Plan ideal', 'Checkout']
const currentStep = ref(0)
const router = useRouter()
const totalPrice = ref(0)
const frecuency = ref(0)
const itemRefs = ref<ItemRef[]>([])
const createPlan = ref(false)
const isLoading = ref(false)
const dogLoading = ref(false)
const grammage = ref(0)
const onlyThisOrder = ref(false)
const openDialogNewData = ref(false)
const editingData = ref()
const stepsValidation = ref({
  first: false,
  second: false,
  pets: false,
})
const resetFlag = ref(false)

const allFormData = ref<FormData>({
  pets: null,
  idealPlan: null,
  checkout: null,
})
const allOrders = ref<any[]>([])

const formattedPrice = computed(() => {
  if (!totalPrice.value) return ''
  const price = useFormatPrice(totalPrice.value)
  if (frecuency.value === 1) {
    return `${price} / Mensual`
  } else if (frecuency.value === 2) {
    return `${price} / Quincenal`
  }
  return price
})

const maxSteps = computed(() => {
  return createPlan.value ? stepsCreate.length : steps.length
})

const updateTotalPrice = (price: number) => {
  totalPrice.value = price
}

const updateFrecuency = (frec: number) => {
  frecuency.value = frec
}
const petsData = ref()
const editOrderItemForSecondStep = () => {
  petsData.value = storedForms.value[0]
  const firstStep = itemRefs.value.find((t: any) => t.type === 'pets')
  firstStep.ref.updateData()
  isEditing.value = true
  currentStep.value = 0
}
const updateCreatePlan = () => {
  currentStep.value = 0
  petsData.value = null
  const firstStep = itemRefs.value.find((t: any) => t.type === 'pets')
  firstStep.ref.resetAllData()
  resetFlag.value = true
}
const isEditing = ref(false)
const updatePets = async (value: any) => {
  const responseCalculations = await accountStore.getCalculation({
    age: +value.years,
    month: +value.months,
    currentWeight: +value.actualWeight,
    bodyCondition: value.recommendedWeight,
    sterilization: value.castrated,
    petsActivity: value.dogActive,
    isMixedFood: value.portions,
  })

  const responseProducts = await accountStore.getFoodRelatedToPet({
    age: +value.years,
    month: +value.months,
    currentWeight: +value.actualWeight,
  })
  grammage.value = responseCalculations.data
  const enrichedPetData = {
    ...value,
    idealPortion: responseCalculations?.data || 0,
    recommendedProducts: responseProducts?.data || [],
  }
  if (isEditing.value) {
    allProductsProfileStore.deleteSelectedAllFromData(0)
    isEditing.value = false
  }
  allFormData.value.pets = enrichedPetData
  allProductsProfileStore.setAllFormData(enrichedPetData)
  const thirdStep = itemRefs.value.find((t: any) => t.type === 'first')
  thirdStep.ref.updateInfo()
  resetFlag.value = false
  stepsValidation.value.pets = true
}
const updateIdealPlan = (value: any) => {
  frecuency.value = value.frecuency
  storedForms.value.forEach((pet: any, index: number) => {
    if (value.petsOptions && value.petsOptions[index]) {
      pet.productSelected = value.petsOptions[index].productSelected
      pet.frecuency = value.frecuency
    }
  })

  currentStep.value++
  stepsValidation.value.first = true
}
const updateCheckout = (value: any) => {
  allFormData.value.checkout = value
  stepsValidation.value.second = true

  if (
    allFormData.value.checkout.addressId !== profile.value.addresses[0].id ||
    allFormData?.value?.checkout?.cardId !== cards?.value[0]?.id
  ) {
    openDialogNewData.value = true
  } else {
    finishProcess()
  }
}

const nextStep = async () => {
  isLoading.value = true

  try {
    let validationSucceeded = false

    switch (currentStep.value) {
      case 0:
        validationSucceeded = await validatePetsStep()
        if (validationSucceeded) {
          dogLoading.value = true
          currentStep.value++
          return
        }
        break
      case 1:
        validationSucceeded = await validatePlanStep()
        break
      case 2:
        validationSucceeded = await validateCheckoutStep()
        break
    }

    if (validationSucceeded && currentStep.value < maxSteps.value - 1) {
      currentStep.value++
    } else if (
      validationSucceeded &&
      currentStep.value === maxSteps.value - 1
    ) {
      if (
        allFormData.value.checkout.addressId !==
          profile.value.addresses[0].id ||
        allFormData.value.checkout.cardId !== profile.value.card[0].id
      ) {
        openDialogNewData.value = true
      } else {
        finishProcess()
      }
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
    if (currentStep.value === 0) {
      allProductsProfileStore.deleteSelectedAllFromData(0)
    }
  } else {
    emit('go-back')
  }
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

const finishProcess = async () => {
  useLoading(true)
  let allPets = []

  if (storedForms.value && Array.isArray(storedForms.value)) {
    allPets = storedForms.value.map((pet) => ({
      name: pet.name || '',
      sex: pet.genre || '',
      age: pet.years || 0,
      month: pet.months || 0,
      currentWeight: Number(pet.actualWeight) || 0,
      bodyCondition: pet.recommendedWeight || 3,
      sterilization: Boolean(pet.castrated),
      race: pet.raze || 1,
      petsActivity: pet.dogActive || 2,
      isMixedFood: pet.portions || false,
      planDetail: {
        detailProducts: pet.productSelected?.map((product) => product.id) || [],
      },
    }))
  }

  const checkoutData =
    allOrders.value.length > 0
      ? allOrders.value[allOrders.value.length - 1].checkout
      : allFormData.value.checkout

  const frequency = allFormData.value.idealPlan?.frecuency || 1

  try {
    const payload = {
      deliveryDate: useFormatDate(checkoutData.deliveryDate, 'date-send'),
      flag: onlyThisOrder.value === true ? 'temporary' : 'general',
      userPlan: {
        frequency: frequency,
      },
      pets: allPets,
      checkout: (({ code, ...rest }) => rest)(checkoutData),
      code: checkoutData.code,
    }

    const response = await planStore.createPlan(payload)
    if (response && response.status) {
      useShowAlert({
        type: 'success',
        message: response.message || 'Plan creado exitosamente',
      })
      openDialogNewData.value = false
      systemStore.setMenuOpen(false)
      allProductsProfileStore.deleteAllFromData()
      emit('go-back')
    } else {
      useShowAlert({
        type: 'error',
        message: response.message || 'Error al crear el plan',
      })
    }
  } catch (error) {
    console.error('Error al crear el plan:', error)
    useShowAlert({
      type: 'error',
      message: 'Error al procesar la solicitud',
    })
  }

  useLoading(false)
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
onMounted(() => {
  nextTick(() => {
    if (storedForms?.value[0]?.productSelected?.length > 0) {
      petsData.value = storedForms.value[0]
      frecuency.value = storedForms.value[0].frecuency
      currentStep.value = 2
    } else if (storedForms?.value[0]) {
      petsData.value = storedForms.value[0]
      const thirdStep = itemRefs.value.find((t: any) => t.type === 'first')
      thirdStep.ref.updateInfo()
      currentStep.value = 1
    } else {
      petsData.value = null
      currentStep.value = 0
    }
  })
})
</script>

<template>
  <div class="tw-flex tw-relative max-lg:tw-w-full tw-h-full">
    <div class="tw-w-full lg:tw-pl-20 lg:tw-h-full">
      <h3 class="title primary1 !tw-text-[32px] tw-my-10">
        {{ $t('profile.myPlan.edit.titleCreate') }}
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
              :class="{ active: slotProps.index === currentStep }"
            >
              {{ slotProps.item }}
            </span>
          </template>
        </Timeline>
        <div v-if="!isMovil" class="stepper-my-pets lg:!tw-w-[10%] lg:!tw-ml-4">
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
        <div
          class="lg:tw-w-full lg:tw-ml-[50px]"
          :class="{
            'lg:tw-max-w-[740px] lg:!tw-ml-[100px]': currentStep === 0,
          }"
        >
          <div v-show="currentStep === 0 && !dogLoading" class="tw-w-full">
            <ProfileMyPlanCreatePlanFirstStep
              :ref="(ref) => registerRef('pets', ref)"
              :editingInfo="editingData"
              :petData="petsData"
              :resetForm="resetFlag"
              v-model="stepsValidation.pets"
              @update-data="updatePets"
            />
          </div>
          <div v-if="dogLoading">
            <CreateLoading
              :grammage="grammage"
              @next-step="dogLoading = false"
              customHeight="100vh"
              customTop="-15px"
              :customZIndex="49"
              :resetForm="resetFlag"
              :customLeft="isMovil ? '-15px' : 0"
            />
          </div>
          <div v-show="currentStep === 1 && !dogLoading" class="tw-w-full">
            <ProfileMyPlanCreatePlanSecondStep
              :ref="(ref) => registerRef('first', ref)"
              :petsData="allFormData.pets"
              :allOrders="allOrders"
              v-model="stepsValidation.first"
              @total-price="updateTotalPrice"
              @create-plan="updateCreatePlan"
              @frecuency="updateFrecuency"
              @finish-form="updateIdealPlan"
              @edit-order="editOrderItemForSecondStep"
            />
          </div>
          <div v-if="currentStep === 2 && !dogLoading" class="tw-w-full">
            <ProfileMyPlanCreatePlanThirdStep
              :ref="(ref) => registerRef('second', ref)"
              :petsData="allFormData"
              :frequency="frecuency"
              v-model="stepsValidation.second"
              @finish-form="updateCheckout"
              @create-form="updateCreatePlan"
              @edit-order="editOrderItemForSecondStep"
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
          {{ currentStep === 2 ? 'Confirmar' : $t('create.footer.continue') }}
          <i class="pi pi-arrow-right"></i>
        </Button>

        <span
          v-if="!totalPrice || currentStep === 0 || currentStep === 2"
          class="cancel-btn"
          @click="prevStep"
          :disabled="isLoading"
        >
          <i class="pi pi-arrow-left"></i>
          {{ $t('create.footer.cancel') }}
        </span>

        <span v-if="currentStep === 1 && totalPrice" class="products-price">
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
</template>

<style scoped lang="scss">
.component-container-edit {
  @apply tw-flex tw-my-5 max-lg:tw-flex-col;
}

.edit-plan-footer {
  @apply tw-flex tw-gap-4 tw-pt-2 tw-flex-row-reverse lg:tw-px-20 max-lg:tw-pl-4 tw-items-center tw-justify-between;
  @apply lg:tw-w-[100%] lg:tw-left-[0] max-lg:tw-left-[-14px] tw-fixed lg:tw-h-[64px] tw-bottom-0 tw-z-10;

  @media (max-width: 1023px) {
    width: calc(100% + 2rem);
  }

  background-color: #ffffff;

  .products-price {
    @apply tw-text-[#1A1A29] lg:tw-text-[18px] tw-font-treble-bold;
    @apply max-lg:tw-text-[14px];
  }
}

.cancel-btn {
  @apply tw-cursor-pointer tw-flex tw-items-center tw-h-[37px] tw-gap-3;
  color: $primary-1;
  font-size: 16px;
}
</style>
