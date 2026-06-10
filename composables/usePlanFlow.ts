import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'

interface FormData {
  pets: Record<number | string, any>
  idealPlan: any | null
  checkout: any | null
}

interface ItemRef {
  type: string
  ref: any
}

export const usePlanFlow = (
  planId: number,
  onFinish?: () => void,
  onPrevAtStart?: () => void,
) => {
  const { t } = useI18n()
  const systemStore = useSystemStore()
  const planStore = usePlanStore()
  const accountStore = useAccountStore()
  const calculatorStore = useCalculatorStore()

  const { getProfileInformation: profile } = storeToRefs(accountStore)
  const { getAllMyPlan: plan, getAllMyPlanSelected: myPlan } =
    storeToRefs(planStore)

  const steps = ['Plan ideal', 'Checkout']
  const stepsCreate = ['Mascota', 'Plan ideal', 'Checkout']

  const currentStep = ref(0)
  const totalPrice = ref(0)
  const frecuency = ref(0)
  const itemRefs = ref<ItemRef[]>([])
  const createPlan = ref(false)
  const isLoading = ref(false)
  const dogLoading = ref(false)
  const openDialogNewData = ref(false)
  const petId = ref<number | string>(0)
  const onlyThisOrder = ref(false)

  const stepsValidation = ref({
    first: false,
    second: false,
    pets: false,
  })

  const allFormData = ref<FormData>({
    pets: {},
    idealPlan: null,
    checkout: null,
  })

  const nextButtonText = computed(() => {
    const lastStep = createPlan.value
      ? currentStep.value === 2
      : currentStep.value === 1

    return lastStep ? 'Confirmar' : t('create.footer.continue')
  })

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

  const updateCreatePlan = () => {
    currentStep.value = 0
    petId.value = 0
    createPlan.value = true
  }

  const updateEditPlan = (value: number | string) => {
    petId.value = value
    createPlan.value = true
    currentStep.value = 0
  }

  const updateIdealPlan = (value: any) => {
    allFormData.value.idealPlan = value
    currentStep.value++
    stepsValidation.value.first = true
  }

  const updatePets = async (value: any) => {
    if (petId.value === 0) {
      petId.value = `temp_${Date.now()}`
    }

    allFormData.value.pets[petId.value] = { ...value }

    const calculationData = {
      petId: petId.value,
      name: value.name,
      sex: value.genre,
      years: +value.years,
      months: +value.months,
      weight: +value.actualWeight,
      petsBodyConditionId: value.recommendedWeight,
      sterilized: value.castrated,
      race: value.raze,
      isMixedFood: value.portions,
      petsActivityId: value.dogActive,
    }

    const calcResponse = await calculatorStore.getCalculations(calculationData)
    if (calcResponse.status && calcResponse.code === 100) {
      allFormData.value.pets[petId.value].grammage = calcResponse.data.grammage
    }

    const ref = itemRefs.value.find((item) => item.type === 'first')
    if (ref?.ref) {
      const petsOptions = ref.ref.values.petsOptions
      const petIndex = petsOptions.findIndex((p: any) => p.id === petId.value)

      if (petIndex !== -1) {
        ref.ref.setFieldValue(`petsOptions[${petIndex}].petName`, value.name)
        if (allFormData.value.pets[petId.value].grammage) {
          ref.ref.setFieldValue(
            `petsOptions[${petIndex}].grammage`,
            allFormData.value.pets[petId.value].grammage,
          )
        }
      } else {
        // Nueva mascota
        const resultProducts = await accountStore.getFoodRelatedToPet({
          age: +value.years,
        })
        let products = []
        if (resultProducts.status && resultProducts.code === 100) {
          products = resultProducts.data.map((recProduct: any) => ({
            id: null,
            productId: recProduct.id,
            name: recProduct.name,
            imageProduct: recProduct.imageProduct,
            description: recProduct.description,
            nutritionalInformation: recProduct.nutritionalInformation,
            attributes:
              recProduct.attributes ||
              recProduct.nutritionalInformation?.attributes ||
              [],
            numberOfPackages: 0,
          }))
        }

        const newPetOption = {
          id: petId.value,
          check: true,
          petName: value.name,
          grammage: allFormData.value.pets[petId.value].grammage || 0,
          maxPackages: 30, // Se distribuirá en el primer tab
          totalSelectedPackages: 0,
          petPrice: 0,
          products: products,
        }

        const updatedPetsOptions = [...petsOptions, newPetOption]
        ref.ref.setFieldValue('petsOptions', updatedPetsOptions)
      }
    }
    stepsValidation.value.pets = true
  }

  const updateCheckout = (value: any) => {
    console.log("🚀 ~ updateCheckout ~ value:", value)

    allFormData.value.checkout = value
    systemStore.setMenuOpen(false)
    stepsValidation.value.second = true
  }

  const nextStep = async () => {
    isLoading.value = true

    try {
      let validationSucceeded = false

      if (createPlan.value) {
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
      } else {
        switch (currentStep.value) {
          case 0:
            validationSucceeded = await validatePlanStep()
            break
          case 1:
            validationSucceeded = await validateCheckoutStep()
            break
        }
      }

      if (validationSucceeded && currentStep.value < maxSteps.value - 1) {
        currentStep.value++
      } else if (
        validationSucceeded &&
        currentStep.value === maxSteps.value - 1
      ) {
        if (
          allFormData.value.checkout.addressId !==
            (profile.value as any).addresses[0].id ||
          allFormData?.value?.checkout?.cardId !==
            (profile?.value as any)?.card[0]?.id
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
    } else if (currentStep.value === 0 && createPlan.value === true) {
      createPlan.value = false
    } else {
      onPrevAtStart?.()
    }
  }

  const _internalGlobalPrice = ref(0)
  const globalPrice = computed({
    get: () => _internalGlobalPrice.value,
    set: (newValue: any) => {
      const subtotal = newValue.subtotal || 0
      const cupon = newValue?.discount
      const shippingInfo = (myPlan?.value as any)?.address?.cities
        ?.shippingCost[0]

      let shippingCost = 0
      if (shippingInfo) {
        if (shippingInfo.notApplicable === true) {
          shippingCost = shippingInfo.shippingCost
        } else {
          if (subtotal - cupon > (shippingInfo.limitForFreeDeliveries || 0)) {
            shippingCost = 0
          } else {
            shippingCost = shippingInfo.shippingCost || 0
          }
        }
      }
      const total = newValue.total + shippingCost
      _internalGlobalPrice.value = total
    },
  })

  const updateGlobalPrice = (totalPriceValue: any) => {
    globalPrice.value = totalPriceValue
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
    console.log(ref)
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
    const formData = allFormData.value || {}
    const petsOptions = formData.idealPlan?.petsOptions || []

    const filteredPets = petsOptions.map((pet: any) => {
      const detailProducts =
        pet.products
          ?.filter((p: any) => p.numberOfPackages > 0)
          .map((p: any) => ({
            id: p.productId || p.productsId,
            numberOfPackages: p.numberOfPackages,
          })) || []

      const petIdValue =
        typeof pet.id === 'string' && pet.id.startsWith('temp_') ? 0 : pet.id

      const petData: any = {
        status: pet.check === true ? 'active' : 'inactive',
        grammage: pet.grammage,
        detailProducts: detailProducts,
      }

      if (petIdValue !== 0) {
        petData.petId = petIdValue
      }

      // Si esta mascota tiene datos guardados en el objeto de mascotas editadas
      const editedPet = formData.pets[pet.id]
      if (editedPet) {
        petData.name = editedPet.name
        petData.sex = editedPet.genre
        petData.age = +editedPet.years
        petData.month = +editedPet.months
        petData.currentWeight = +editedPet.actualWeight
        petData.bodyCondition = editedPet.recommendedWeight
        petData.sterilization = editedPet.castrated
        petData.race = editedPet.raze
        petData.isMixedFood = editedPet.portions
        petData.petsActivity = editedPet.dogActive
      }

      return petData
    })

    const sendData = {
      deliveryDate: useFormatDate(formData.checkout.deliveryDate, 'date-send'),
      flag: onlyThisOrder.value === true ? 'temporary' : 'general',
      userPlan: {
        frequency: formData.idealPlan?.frecuency || 1,
      },
      pets: filteredPets,
      checkout: (({ code, deliveryDate, ...rest }) => rest)(formData.checkout),
      code: formData.checkout.code || '',
    }

    const response = await planStore.updatePlan(sendData, planId)
    if (response.status && response.code === 100) {
      useShowAlert({ type: 'success', message: response.message })
      openDialogNewData.value = false
      systemStore.setMenuOpen(false)
      onFinish?.()
    } else {
      useShowAlert({ type: 'error', message: response.message })
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

  return {
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
    plan,
  }
}
