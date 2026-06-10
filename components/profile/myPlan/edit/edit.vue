<script setup lang="ts">
import { useField, useFieldArray, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const emit = defineEmits([
  'close-edit',
  'finish-form',
  'total-price',
  'total-global-price',
  'frecuency',
  'create-plan',
  'edit-plan',
])
const props = defineProps({
  planId: {
    type: Number,
    required: true,
  },
})

const planStore = usePlanStore()
const createStore = useCreateStore()
const accountStore = useAccountStore()
const systemStore = useSystemStore()
const { isMovil } = storeToRefs(systemStore)
const { getAllMyPlanSelected: myPlans } = storeToRefs(planStore)
const { getListFrecuencies: options } = storeToRefs(createStore)
const { getLisParametrization: parametrization } = storeToRefs(accountStore)
const { t } = useI18n()
const deliveryResume = ref()
const route = useRoute()
const localePath = useLocalePath()
const loading = ref(true)
const showUpdateDialog = ref(false)
const showFoodDetail = ref(false)
const selectedProduct = ref<any>(null)
const router = useRouter()
const lastDeactivatedPetIndex = ref<number | null>(null)
const { handleSubmit, errors, values, setErrors, resetForm, setFieldValue } =
  useForm({
    validationSchema: toTypedSchema(
      z.object({
        frecuency: z
          .number({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
        petsOptions: z
          .array(
            z.object({
              id: z.union([z.string(), z.number()]).optional().nullable(),
              check: z.boolean().optional().default(false),
              petName: z.string().optional(),
              grammage: z
                .number({ message: t('rule.validation.require') })
                .min(1, { message: t('rule.validation.require') }),
              maxPackages: z.number().optional().default(30),
              totalSelectedPackages: z.number().optional().default(0),
              petPrice: z.number().optional().default(0),
              products: z.array(
                z.object({
                  id: z.number().optional().nullable(),
                  productId: z.number(),
                  name: z.string(),
                  imageProduct: z.string().optional(),
                  description: z.string().optional(),
                  numberOfPackages: z.number().default(0),
                  nutritionalInformation: z.any().optional(),
                  attributes: z.array(z.any()).optional(),
                }),
              ),
            }),
          )
          .superRefine((petsOptions, ctx) => {
            petsOptions.forEach((pet, index) => {
              if (pet.check) {
                const total = pet.products.reduce(
                  (sum, p) => sum + p.numberOfPackages,
                  0,
                )
                if (total !== pet.maxPackages) {
                  ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Debes seleccionar exactamente ${pet.maxPackages} paquetes. Actualmente tienes ${total}.`,
                    path: [index, 'totalSelectedPackages'],
                  })
                }
              }
            })
          }),
      }),
    ),
  })

const { value: frecuency } = useField<number>('frecuency')
const { fields: petsOptions } = useFieldArray<any>('petsOptions')

const getPlans = async () => {
  loading.value = true
  useLoading(true)

  await createStore.getFrecuencies()
  if (route) {
    await planStore.getOnePlan(props.planId)
    const petsOptionsData =
      useSearchItemJson('userPlanDescription', myPlans.value) || []

    resetForm({
      values: {
        frecuency: useSearchItemJson('frequency.id', myPlans.value),
        petsOptions: petsOptionsData.map((t: any) => {
          const products =
            t.pets.recommendedFood?.map((recProduct: any) => {
              const existingSelection = t.pets.descriptionProducts?.find(
                (p: any) => p.products.id === recProduct.id,
              )

              return {
                id: existingSelection?.id || null,
                productId: recProduct.id,
                name: recProduct.name,
                imageProduct: recProduct.imageProduct,
                description: recProduct.description,
                nutritionalInformation: recProduct.nutritionalInformation,
                attributes:
                  recProduct.attributes ||
                  recProduct.nutritionalInformation?.attributes ||
                  [],
                numberOfPackages: existingSelection?.numberOfPackages || 0,
              }
            }) || []

          const totalSelectedPackages = products.reduce(
            (sum: number, p: any) => sum + p.numberOfPackages,
            0,
          )

          return {
            id: t.pets?.id,
            check: t.status === 'active',
            petName: t.pets.name,
            grammage: +t.idealPortion.split(' ')[0].trim(),
            maxPackages: totalSelectedPackages || 30, // Default to 30 if 0, else use current total
            totalSelectedPackages: totalSelectedPackages,
            petPrice: t.price || 0,
            products: products,
          }
        }),
      },
    })
  } else {
    emitCreatePlan()
  }

  loading.value = false
  useLoading(false)
}

const onSubmit = handleSubmit(async (formValues) => {
  const activePetsOptions = formValues.petsOptions.filter(
    (pet) => pet.check === true,
  )

  const thisInfoToSend = {
    frecuency: formValues.frecuency,
    petsOptions: formValues.petsOptions,
  }

  if (activePetsOptions.length === 0) {
    useShowAlert({
      type: 'error',
      message: 'No hay mascotas activas para enviar',
    })
    return
  }

  emit('finish-form', thisInfoToSend)
})

const calculatePackages = async (petIndex: number) => {
  const pet = values.petsOptions?.[petIndex]
  if (!pet || !pet.check) return

  const payload = {
    petId: pet.id > 0 ? pet.id : values.petsOptions?.[0].id,
    frequency: values.frecuency,
    gramage: pet.grammage,
  }

  try {
    const response = await planStore.changeTotalOfPackages(
      route.params.id,
      payload,
    )
    if (response.status && response.code === 100) {
      setFieldValue(
        `petsOptions[${petIndex}].maxPackages`,
        response.data.numberOfPackages,
      )
      setFieldValue(`petsOptions[${petIndex}].petPrice`, response.data.price)

      const currentTotal = pet.products.reduce(
        (sum: number, p: any) => sum + (p.numberOfPackages || 0),
        0,
      )
      if (currentTotal > response.data.numberOfPackages) {
        handleAutoDistribute(petIndex, response.data.numberOfPackages)
      }
    }
  } catch (error) {
    console.error('Error calculating packages:', error)
  }
}

const handleAutoDistribute = (petIndex: number, forcedMax?: number) => {
  const pet = values.petsOptions?.[petIndex]
  if (!pet || !pet.products || pet.products.length === 0) return

  const max = forcedMax || pet.maxPackages || 30
  const productsCount = pet.products.length
  const baseQuantity = Math.floor(max / productsCount)
  const remainder = max % productsCount

  pet.products.forEach((_: any, productIndex: number) => {
    const numberOfPackages = baseQuantity + (productIndex < remainder ? 1 : 0)
    setFieldValue(
      `petsOptions[${petIndex}].products[${productIndex}].numberOfPackages`,
      numberOfPackages,
    )
  })

  setFieldValue(`petsOptions[${petIndex}].totalSelectedPackages`, max)
}

const getTotalSelectedPackages = (petIndex: number) => {
  return computed(() => {
    const pet = values.petsOptions?.[petIndex]
    if (!pet?.products) return 0
    return pet.products.reduce(
      (sum: number, p: any) => sum + (p.numberOfPackages || 0),
      0,
    )
  })
}

onMounted(() => {
  nextTick(async () => {
    await getPlans()
    setErrors({})
  })
})

const emitCreatePlan = () => {
  emit('total-price', 0)
  emit('create-plan')
}

const emitEditPlan = (value: number) => {
  emit('total-price', 0)
  emit('edit-plan', value)
}

const confirmDeactivation = async () => {
  useLoading(true)
  const response = await planStore.changeStatus()
  if (response.status && response.code == 100) {
    useShowAlert({
      type: 'success',
      message: response.message,
    })
    router.push(localePath({ name: 'profile-my-profile' }))
    await planStore.getListPlan()
  } else {
    useShowAlert({
      type: 'error',
      message: response.message,
    })
  }
  useLoading(false)
}

const updateGlobalPrice = async () => {
  const activePets = values.petsOptions
    .filter((form) => form.check === true)
    .map((form) => ({
      grams: form.grammage,
      pet: form.petName,
      products: form.products
        .filter((p) => p.numberOfPackages > 0)
        .map((p) => p.productId),
    }))

  const frequency = values.frecuency

  if (activePets.length > 0) {
    const response = await accountStore.getPurchaseValues({
      planId: route.params.id,
      frequency: frequency,
      pets: activePets,
      cuponId: useSearchItemJson('cupon.id', myPlans.value) || null,
    })
    deliveryResume.value = response.data
    emit('total-global-price', deliveryResume.value)
  } else {
    deliveryResume.value = null
    showUpdateDialog.value = true
    emit('total-global-price', 0)
  }
}

const handleViewDetail = (product: any) => {
  selectedProduct.value = product
  showFoodDetail.value = true
}

const filteredOptions = computed(() => {
  if (
    deliveryResume.value?.subtotal > parametrization.value.limitToBeCollected
  ) {
    return options.value
  } else {
    return options.value ? [options.value[0]] : []
  }
})

const cancelDeactivation = () => {
  showUpdateDialog.value = false

  if (lastDeactivatedPetIndex.value !== null) {
    setFieldValue(`petsOptions[${lastDeactivatedPetIndex.value}].check`, true)
    lastDeactivatedPetIndex.value = null

    nextTick(() => {
      updateGlobalPrice()
    })
  }
}

defineExpose({
  onSubmit,
  getPlans,
  values,
  setFieldValue,
})

watch(frecuency, async (newValue) => {
  if (newValue) {
    updateGlobalPrice()
    emit('frecuency', frecuency)

    // Ejecutar secuencialmente
    for (let index = 0; index < values.petsOptions.length; index++) {
      await calculatePackages(index)
    }
  }
})

watch(
  () => values.petsOptions?.map((pet) => pet.check),
  async (newStatusArray, oldStatusArray) => {
    if (
      newStatusArray &&
      oldStatusArray &&
      JSON.stringify(newStatusArray) !== JSON.stringify(oldStatusArray)
    ) {
      for (let i = 0; i < newStatusArray.length; i++) {
        if (oldStatusArray[i] === true && newStatusArray[i] === false) {
          lastDeactivatedPetIndex.value = i
          break
        }
      }
      updateGlobalPrice()
    }
  },
  { deep: true },
)

watch(
  () => values.petsOptions?.map((pet) => pet.grammage),
  async (newGrammages, oldGrammages) => {
    if (newGrammages && oldGrammages) {
      for (let index = 0; index < newGrammages.length; index++) {
        if (newGrammages[index] !== oldGrammages[index]) {
          await calculatePackages(index)
        }
      }
    }
  },
  { deep: true },
)
</script>

<template>
  <div v-if="!loading" class="edit-page-plan-content">
    <div class="edit-page-account" @keydown.enter="onSubmit">
      <form class="tw-w-full">
        <p class="frecuency-options-subtitle !tw-mb-1">
          {{ $t('create.main.content.3.frecuency') }}
        </p>
        <p class="text-frecuency tw-mb-3 !tw-text-[12px]">
          {{ $t('create.main.content.3.text') }}
        </p>
        <span
          class="general-selectButton form normal-label tw-pb-5 lg:tw-ml-5 max-lg:tw-mx-auto max-lg:tw-w-[90%]"
        >
          <SelectButton
            v-model="frecuency"
            option-value="id"
            option-label="name"
            :options="[...filteredOptions]"
            :allowEmpty="false"
            size="large"
            style="max-width: 350px"
          />
          <GeneralInputError :error="errors['frecuency']" />
          <div
            v-if="
              deliveryResume?.subtotal > parametrization.limitToBeCollected &&
              parametrization.discount > 0
            "
            class="disccount-option !tw-top-[-10px] !tw-left-[-14px]"
          >
            <p>{{ parametrization.discount }}%</p>
          </div>
        </span>
        <span
          @click="emitCreatePlan"
          class="lg:tw-hidden tw-flex tw-justify-end tw-gap-3 tw-text-primary tw-font-treble-regular tw-cursor-pointer lg:tw-mr-10 tw-my-5"
        >
          <i class="pi pi-plus" style="color: #003b71"></i>
          {{ $t('profile.myPlan.edit.add') }}
        </span>
        <span class="general-tabs plan-tabs">
          <Tabs :value="0" class="tw-mt-5">
            <TabList>
              <div
                class="lg:!tw-w-3/4 lg:!tw-min-w-3/4 tw-overflow-x-auto tw-overflow-y-hidden tw-flex max-lg:tw-max-w-full"
              >
                <Tab
                  v-for="(petDesc, i) in petsOptions"
                  :key="petDesc.value.id"
                  :value="i"
                >
                  {{ useTruncateText(petDesc.value.petName, 10) }}
                </Tab>
              </div>
              <span
                @click="emitCreatePlan"
                class="max-lg:tw-hidden tw-flex tw-items-center tw-gap-3 tw-text-primary tw-font-treble-regular tw-cursor-pointer lg:tw-mr-0"
              >
                <i class="pi pi-plus" style="color: #003b71"></i>
                {{ $t('profile.myPlan.edit.add') }}
              </span>
            </TabList>
            <TabPanels class="!tw-p-0">
              <TabPanel
                v-for="(petDesc, it) in petsOptions"
                :key="petDesc.value.id"
                :value="it"
              >
                <div class="edit-dogs">
                  <img
                    class="tw-mb-auto tw-mt-1"
                    src="/icons/profile/ic_info-cafe.svg"
                    alt="info"
                    height="16px"
                    width="16px"
                  />
                  <p class="tw-text-[11px] tw-text-[#8BA0C9]">
                    {{ $t('profile.myPlan.edit.edt') }}
                    <strong
                      class="tw-cursor-pointer tw-text-[11px]"
                      @click="emitEditPlan(petDesc.value.id)"
                    >
                      {{ $t('profile.myPlan.edit.click') }}
                    </strong>
                  </p>
                </div>
                <div class="tw-flex tw-justify-between tw-mb-5">
                  <div class="tw-flex tw-flex-col tw-gap-2">
                    <p class="frecuency-options-subtitle tw-my-0">
                      Gramaje diario
                    </p>
                    <span class="general-input form-group normal-labels">
                      <label for="quantity">Porción ideal</label>
                      <InputGroup>
                        <InputNumber
                          v-model="petsOptions[it].value.grammage"
                          :placeholder="'00'"
                          :max="3571"
                          :maxLength="4"
                          :useGrouping="false"
                          fluid
                        />
                        <InputGroupAddon>gramos/día</InputGroupAddon>
                      </InputGroup>
                    </span>
                    <GeneralInputError
                      :error="errors[`petsOptions[${it}].grammage`]"
                    />
                  </div>
                  <div class="tw-items-end tw-flex tw-flex-col">
                    <div class="tw-items-center tw-flex">
                      <span class="switch-label">{{
                        !petsOptions[it]?.value?.check
                          ? $t('profile.myPlan.inactive')
                          : $t('profile.myPlan.active')
                      }}</span>
                      <span class="general-switch solo-other">
                        <ToggleSwitch v-model="petsOptions[it].value.check" />
                      </span>
                    </div>
                  </div>
                </div>

                <div class="protein-container-refactored">
                  <div
                    class="tw-mb-3 tw-flex tw-justify-between tw-items-center"
                  >
                    <div>
                      <p class="body-m-highlighted">
                        Paquetes seleccionados:
                        <span
                          :class="
                            getTotalSelectedPackages(it).value ===
                            petsOptions[it].value.maxPackages
                              ? 'tw-text-green-500'
                              : 'tw-text-red-500'
                          "
                        >
                          {{ getTotalSelectedPackages(it).value }}
                        </span>
                        / {{ petsOptions[it].value.maxPackages }}
                      </p>
                      <GeneralInputError
                        :error="
                          errors[`petsOptions[${it}].totalSelectedPackages`]
                        "
                      />
                    </div>
                    <Button
                      class="app-general-button app-btn-transparent label-primary !tw-p-0"
                      @click="handleAutoDistribute(it)"
                      label="Distribuir automáticamente"
                      icon="pi pi-refresh"
                      :pt="{
                        label: 'tw-underline',
                      }"
                    />
                  </div>

                  <p class="frecuency-options-subtitle tw-mt-3 !tw-mb-1">
                    {{ $t('profile.myPlan.edit.protein') }}
                  </p>
                  <p class="text-frecuency tw-mb-3 !tw-text-[12px]">
                    {{ $t('profile.myPlan.edit.options') }}
                  </p>

                  <div
                    v-if="petsOptions[it].value.products"
                    class="tw-flex tw-flex-col tw-gap-4"
                  >
                    <div
                      v-for="(product, productIndex) in petsOptions[it].value
                        .products"
                      :key="productIndex"
                      class="card-protein-horizontal"
                    >
                      <div class="general-information-horizontal">
                        <img
                          :src="product.imageProduct"
                          alt="product_image"
                          class="product-img"
                        />
                        <div
                          class="tw-flex max-lg:tw-flex-col lg:tw-justify-between lg:tw-w-full tw-gap-2"
                        >
                          <div class="product-details">
                            <p class="body-m-highlighted">{{ product.name }}</p>
                            <p class="body-s-black">
                              {{ product.description }}
                              <span
                                class="tw-cursor-pointer tw-text-blue-500 tw-text-[12px] tw-ml-1"
                                @click="handleViewDetail(product)"
                              >
                                Ver detalle
                              </span>
                            </p>
                          </div>
                          <div class="product-actions max-lg:tw-ml-auto">
                            <span class="general-input group-plan">
                              <InputNumber
                                v-model="product.numberOfPackages"
                                fluid
                                :useGrouping="false"
                                :min="0"
                                :max="petsOptions[it].value.maxPackages"
                                :showButtons="true"
                                buttonLayout="horizontal"
                                incrementIcon="pi pi-plus"
                                decrementIcon="pi pi-minus"
                              />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </span>
      </form>
    </div>
    <GeneralDialog :show="showUpdateDialog" @close="showUpdateDialog = false">
      <div class="tw-p-5">
        <span class="tw-text-[#003B71] tw-text-[20px] tw-font-treble-bold"
          >¿Estás seguro de inactivar todas tus mascotas?</span
        >
        <div class="tw-mt-2">
          <p
            class="tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book tw-mt-5"
          >
            Al inactivar todas las mascotas, tu plan quedará inactivo. Puedes
            volver a activarlas en cualquier momento.
          </p>
          <div class="tw-flex tw-mt-11 tw-w-full tw-justify-end tw-gap-3">
            <Button
              class="app-general-button app-btn-transparent"
              :label="$t('button.cancel')"
              @click="cancelDeactivation"
            />
            <Button
              class="app-general-button btn-solo-create"
              label="Si, inactivar "
              autofocus
              @click="confirmDeactivation"
            />
          </div>
        </div>
      </div>
    </GeneralDialog>
    <sidebarFoodDetailDrawer
      :showUpdateDialog="showFoodDetail"
      :details="selectedProduct?.nutritionalInformation"
      :attributes="selectedProduct?.attributes"
      :name="selectedProduct?.name"
      :description="selectedProduct?.description"
      @closeModal="showFoodDetail = false"
    />
  </div>
</template>

<style scoped lang="scss">
.edit-page-plan-content {
  @apply tw-w-full;
}

.edit-page-account {
  @apply tw-flex lg:tw-min-h-[810px] lg:tw-max-w-[966px];
  @apply max-lg:tw-flex-col max-lg:tw-min-h-[810px];

  .frecuency-options-subtitle {
    @apply tw-mb-3;
    color: #25282b !important;
    font-family: 'heading-pro-treble-bold' !important;
    font-size: 14px;
    margin-right: 5px;
  }

  .cancel-btn {
    @apply tw-cursor-pointer;
    color: #8ba0c9;
    font-size: 15px;
  }
  .switch-label {
    @apply tw-text-[#1A1A29] tw-font-treble-bold tw-text-[12px] tw-w-16;
  }

  .edit-dogs {
    @apply tw-flex tw-gap-3 tw-items-center tw-mt-5 tw-mb-4;
  }

  .body-m-highlighted {
    font-family: 'heading-pro-treble-bold';
    font-style: normal;
    font-weight: bold;
    font-size: 14px;
    line-height: 24px;
    color: #25282b;
    margin: 0;
  }

  .body-s-black {
    font-family: 'heading-pro-treble-book';
    font-size: 12px;
    color: #1a1a29;
    margin: 0;
  }

  .card-protein-horizontal {
    background-color: #ffffff;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid rgba(139, 160, 201, 0.3);
    display: flex;
    flex-direction: column;

    .general-information-horizontal {
      @apply lg:tw-gap-9 max-lg:tw-gap-2;

      display: flex;
      align-items: center;

      .product-img {
        @apply lg:tw-w-[114px] lg:tw-h-[114px];
        @apply max-lg:tw-w-[68px] max-lg:tw-h-[118px];
        object-fit: cover;
        border-radius: 8px;
      }

      .product-details {
        display: flex;
        flex-direction: column;
        flex: 1;
      }
    }
  }

  .label-primary {
    color: #003b71 !important;
  }
}
</style>
