<script setup lang="ts">
import { useField, useFieldArray, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { any, z } from 'zod'

const emit = defineEmits([
  'close-edit',
  'finish-form',
  'total-price',
  'frecuency',
  'create-plan',
  'edit-order',
  'pet-selected',
])

const createStore = useCreateStore()
const accountStore = useAccountStore()
const systemStore = useSystemStore()
const { isMovil } = storeToRefs(systemStore)
const { getListFrecuencies: options } = storeToRefs(createStore)
const allProductsProfileStore = useAllProductsProfileStore()
const { getAllFormsData: storedForms, getFrequency: storedFrequency } =
  storeToRefs(allProductsProfileStore)
const { getLisParametrization: parametrization } = storeToRefs(accountStore)
const { t } = useI18n()
const deliveryResume = ref<any>({})
const loading = ref(true)

const { handleSubmit, errors, resetForm, setFieldValue, values } = useForm({
  validationSchema: toTypedSchema(
    z.object({
      frecuency: z
        .number({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.require') }),
      petsOptions: z.array(
        z.object({
          productSelected: z
            .array(
              z.object({
                id: z.number({ message: t('rule.validation.require') }).min(1, {
                  message: t('rule.validation.require'),
                }),
              }),
            )
            .min(1, { message: t('rule.validation.require') }), // Requiere al menos un producto
        }),
      ),
    }),
  ),
})

const { value: frecuency } = useField('frecuency')
const { fields: petsOptions } = useFieldArray<any[]>('petsOptions')

const getPlans = async () => {
  loading.value = true
  useLoading(true)

  await createStore.getFrecuencies()

  loading.value = false
  useLoading(false)
}

const selectProduct = ({
  id,
  isSelected,
  petIndex,
}: {
  id: number
  isSelected: boolean
  petIndex: number
}) => {
  // Asegúrate de que el array de mascotas esté inicializado
  if (!petsOptions.value[petIndex]) {
    petsOptions.value[petIndex] = { value: { productSelected: [] } }
  }

  const currentProducts =
    petsOptions.value[petIndex]?.value?.productSelected || []

  let newProducts
  if (isSelected) {
    // Añadir producto si no existe
    if (!currentProducts.some((p) => p.id === id)) {
      newProducts = [...currentProducts, { id }]
    } else {
      newProducts = currentProducts
    }
  } else {
    // Remover producto
    newProducts = currentProducts.filter((product) => product.id !== id)
  }

  // Usar setFieldValue con la ruta correcta
  setFieldValue(`petsOptions.${petIndex}.productSelected`, newProducts)
}

const onSubmit = handleSubmit(async (formValues) => {
  const enrichedFormValues = formValues
  enrichedFormValues.petsOptions = enrichedFormValues.petsOptions.map(
    (option, index) => {
      return {
        ...option,
      }
    },
  )

  emit('finish-form', enrichedFormValues)
})
const updateInfo = async () => {
  // Establece la frecuencia
  if (storedFrequency.value) {
    frecuency.value = storedFrequency.value
  }

  if (storedForms.value.length > 0) {
    // 1. Crear la estructura correcta para el formulario
    const initialPetsOptions = storedForms.value.map((pet) => ({
      productSelected: pet.recommendedProducts.map((product) => ({
        id: product.id,
      })),
    }))

    // 2. Crear activePets usando los datos originales de storedForms
    const activePets = storedForms.value.map((pet) => ({
      grams: pet.idealPortion, // Usar idealPortion como grammage
      pet: pet.name, // Usar name como petName
      // Seleccionar TODOS los productos recomendados por defecto
      products: pet.recommendedProducts.map((product) => product.id),
    }))

    // 3. Actualizar el formulario
    setFieldValue('petsOptions', initialPetsOptions)

    // 4. Llamar al servicio con los datos correctos
    const response = await accountStore.getPurchaseValues({
      planId: 0,
      frequency: 1,
      pets: activePets,
      cuponId: null,
    })
    deliveryResume.value = response.data
  } else {
    setFieldValue('petsOptions', [])
    deliveryResume.value = null // Limpiar resume si no hay mascotas
  }
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
onMounted(() => {
  nextTick(async () => {
    await getPlans()
  })
})
const emitCreatePlan = () => {
  emit('create-plan')
}

const emitEditPlan = (index: any) => {
  allProductsProfileStore.editSelectedAllFromData(index)
  emit('edit-order')
}
const isProductSelected = (productId: number, petIndex: number): boolean => {
  const currentPetsOptions = values.petsOptions || []
  const selectedProducts = currentPetsOptions[petIndex]?.productSelected || []
  return selectedProducts.some((p) => p.id === productId)
}

defineExpose({
  onSubmit,
  updateInfo,
})

watch(frecuency, (value) => {
  allProductsProfileStore.setFrequency(value)
  emit('frecuency', value)
})
</script>

<template>
  <div v-if="!loading">
    <div class="edit-page-account" @keydown.enter="onSubmit">
      <form class="tw-w-full">
        <p class="frecuency-options-subtitle !tw-mb-1">
          {{ $t('create.main.content.3.frecuency') }}
        </p>
        <p class="text-frecuency tw-mb-3 !tw-text-[12px]">
          {{ $t('create.main.content.3.text') }}
        </p>
        <span
          class="general-selectButton form normal-label tw-pb-5 max-lg:tw-mx-auto max-lg:tw-w-[90%]"
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
        <span v-if="storedForms.length > 0" class="general-tabs plan-tabs">
          <Tabs :value="0" class="tw-mt-5">
            <TabList>
              <div class="lg:tw-w-3/4 max-lg:tw-w-full">
                <Tab
                  v-for="(petDesc, i) in storedForms"
                  :key="petDesc?.name"
                  :value="i"
                >
                  {{ useTruncateText(petDesc?.name, 10) }}
                </Tab>
              </div>
              <span
                @click="emitCreatePlan"
                class="max-lg:tw-hidden tw-flex tw-items-center tw-gap-3 tw-text-primary tw-font-treble-regular tw-cursor-pointer lg:tw-mr-10"
              >
                <i class="pi pi-plus" style="color: #003b71"></i>
                {{ $t('profile.myPlan.edit.add') }}
              </span>
            </TabList>
            <TabPanels class="!tw-p-0">
              <TabPanel
                v-for="(petDesc, it) in storedForms"
                :key="petDesc?.name"
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
                      @click="emitEditPlan(it)"
                    >
                      {{ $t('profile.myPlan.edit.click') }}
                    </strong>
                  </p>
                </div>
                <div class="tw-flex tw-justify-between tw-mb-5">
                  <div>
                    <p class="frecuency-options-subtitle tw-my-3">
                      {{ $t('profile.myPlan.edit.recommended') }}
                    </p>
                    <strong class="tw-text-[20px] tw-font-treble-bold">
                      {{ petDesc?.idealPortion }} g/Dia
                    </strong>
                  </div>
                </div>
                <div class="protein-contianer">
                  <p class="frecuency-options-subtitle tw-mt-3 !tw-mb-1">
                    {{ $t('profile.myPlan.edit.protein') }}
                  </p>
                  <p class="text-frecuency tw-mb-3 !tw-text-[12px]">
                    {{ $t('profile.myPlan.edit.options') }}
                  </p>
                  <div
                    class="max-lg:tw-w-auto lg:tw-w-[915px] lg:tw-overflow-x-auto tw-pb-4"
                  >
                    <Carousel
                      v-if="
                        petDesc?.pets?.recommendedFood &&
                        petDesc?.pets?.recommendedFood?.length > 3 &&
                        !isMovil
                      "
                      :value="petDesc?.pets?.recommendedFood"
                      :numVisible="3"
                      :numScroll="1"
                      :showIndicators="true"
                      :showNavigators="true"
                      circular
                      :autoplayInterval="5000"
                      class="general-carousel products tw-w-full"
                    >
                      <template #item="slotProps">
                        <div class="tw-px-2">
                          <GeneralProductCard
                            :id="slotProps.data.id"
                            :key="slotProps.data.id"
                            :prductData="slotProps.data"
                            :initiallySelected="
                              isProductSelected(slotProps.data.id, it)
                            "
                            @select="
                              (data) => selectProduct({ ...data, petIndex: it })
                            "
                          />
                        </div>
                      </template>
                    </Carousel>
                    <div
                      v-else
                      class="tw-flex max-lg:tw-gap-5 max-lg:tw-flex-col max-lg:tw-w-full max-lg:tw-pb-2"
                    >
                      <GeneralProductCard
                        v-for="(product, il) in petDesc?.recommendedProducts"
                        :prductData="product"
                        :id="product.id"
                        :key="product.id"
                        :initiallySelected="isProductSelected(product.id, it)"
                        @select="
                          (data) => selectProduct({ ...data, petIndex: it })
                        "
                      />
                    </div>
                    <div
                      class="tw-w-[800px] tw-mt-5"
                      :class="
                        errors[`petsOptions[${it}].productSelected`]
                          ? 'tw-flex tw-justify-between tw-flex-row-reverse'
                          : 'tw-text-end'
                      "
                    >
                      <GeneralInputError
                        class="!tw-mr-0"
                        :error="errors[`petsOptions[${it}].productSelected`]"
                      />
                    </div>
                  </div>
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </span>
      </form>
    </div>
  </div>
</template>
<style scoped lang="scss">
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

  .my-dogs-container {
    @apply tw-flex tw-justify-between tw-h-[42px];
    border-bottom: 2px solid #e0e5f0;

    .my-dogs-options {
      @apply lg:tw-ml-20 tw-flex tw-gap-5;
      @apply max-lg:tw-max-w-[80%] max-lg:tw-overflow-x-auto;

      .dogs-titles {
        &.active {
          @apply tw-text-primary tw-font-treble-bold;

          &::after {
            transform: scaleX(1) translateX(-50%);
            transform-origin: bottom left;
          }
        }
      }

      span {
        @apply tw-relative tw-text-[#575E6B] tw-text-[18px] tw-font-treble-book tw-cursor-pointer;

        &::after {
          content: '';
          position: absolute;
          width: 40%;
          transform: scaleX(0) translateX(-50%);
          height: 4px;
          bottom: 0;
          left: 50%;
          z-index: 40;
          transform-origin: bottom right;
          transition: transform 0.25s ease-out;
          background-color: $primary-1;
        }

        &:hover::after {
          transform: scaleX(1) translateX(-50%);
          transform-origin: bottom left;
        }
      }
    }
  }

  .edit-dogs {
    @apply tw-flex tw-gap-3 tw-items-center tw-mt-5 tw-mb-4;
  }
}
</style>
