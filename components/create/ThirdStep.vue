<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const emit = defineEmits(['update:modelValue', 'finish-form', 'product-price'])
const props = defineProps({
  dogData: {
    type: Object,
    required: true,
    default: {},
  },
  resetForm: {
    type: Boolean,
  },
  editData: {
    type: Object,
    default: () => null,
  },
  grammage: {
    type: Number,
    required: true,
  },
  planId: {
    type: Number,
    required: false,
  },
  planData: {
    type: Array || undefined,
    required: true,
  },
  selectedFrecuency: {
    type: Number,
    default: null,
  },
  hidePrices: {
    type: Boolean,
    default: false,
  },
})

const createStore = useCreateStore()
const accountStore = useAccountStore()
const allProductsStore = useAllProductsStore()
const systemStore = useSystemStore()
const { isMovil } = storeToRefs(systemStore)
const { getListFrecuencies: options } = storeToRefs(createStore)
const {
  getLisParametrization: parametrization,
  getInfoCupon: cupon,
  preSelectedProduct,
} = storeToRefs(accountStore)
const { getAllFormsData: allForms } = storeToRefs(allProductsStore)
const formSubmitted = ref(false)
const dailyPrice = ref(0)
const { t } = useI18n()
const deliveryResume = ref()
const defaultSelectedIndex = ref(preSelectedProduct) // Índice parametrizable para el producto seleccionado por defecto
const { handleSubmit, errors, meta, resetField, setErrors } = useForm({
  validationSchema: toTypedSchema(
    z.object({
      frecuency: z
        .number({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.require') }),
      selected: z
        .array(
          z.object({
            id: z.number(),
          }),
        )
        .min(1, { message: t('rule.validation.require') }),
    }),
  ),
})

const { value: frecuency, setValue: setFrecuencyValue } = useField(
  'frecuency',
  undefined,
  { initialValue: 1 },
)
const { value: selected, setValue: setValueSelected } = useField('selected')
const route = useRoute()
const getPlans = async () => {
  await createStore.getFrecuencies()
}

const selectSelected = ({
  id,
  name,
  isSelected,
}: {
  id: number
  name: string
  isSelected: boolean
}) => {
  if (isSelected) {
    setValueSelected([{ id, name }])
  } else {
    setValueSelected([])
  }
}

const formSendData = ref({})
const loadEditData = () => {
  if (props?.editData?.selected && props.planData) {
    const availableProductIds =
      props.planData?.map((product) => product.id) || []

    const validSelectedProducts = props.editData.selected.filter((product) =>
      availableProductIds.includes(product.id),
    )

    selected.value = validSelectedProducts
  }

  if (props?.frecuency) {
    frecuency.value = props?.frecuency
  }
}
const isProductSelected = (id: number) => {
  return selected.value?.some((product) => product.id === id) ?? false
}
const finishForm = () => {
  emit('finish-form', formSendData.value)
}

const onSubmit = handleSubmit((values: any) => {
  formSendData.value = { price: dailyPrice.value, ...values }
  finishForm()
  formSubmitted.value = true
  return values
})
const filteredOptions = computed(() => {
  if (
    deliveryResume.value?.subtotal > parametrization.value.limitToBeCollected
  ) {
    return options.value
  } else {
    return options.value ? [options.value[0]] : []
  }
})
watch(
  () => props.planId,
  (newValue) => {
    if (props.planId !== undefined) {
      setFrecuencyValue(1)
    }
  },
  { immediate: true },
)
watch(
  () => meta.value.valid,
  (newVal: boolean) => {
    emit('update:modelValue', newVal)
  },
)
watch(
  () => props.resetForm,
  (newVal: boolean) => {
    if (newVal === true) {
      resetField('selected')
      setErrors({})

      nextTick(() => {
        if (
          props.planData &&
          Array.isArray(props.planData) &&
          props.planData.length > 0
        ) {
          const allProductsSelected = props.planData.map((product) => ({
            id: product.id,
            name: product.name,
          }))
          setValueSelected(allProductsSelected)
        }
      })
    }
  },
)
const getDailyPrice = async () => {
  const formData = ref({
    frequency: frecuency.value,
    grams: props.grammage,
    discount: useSearchItemJson('id', cupon.value),
    // deliveryResume?.value?.total >
    //   parametrization?.value?.limitToBeCollected && frecuency.value === 1
    //   ? true
    //   : false,
  })
  const response = await accountStore.getValuesByFrequency(formData.value)
  if (response.status && response.code === 100) {
    dailyPrice.value = response.data
  } else {
    dailyPrice.value = 0
  }
}
const getPlanTotal = async () => {
  try {
    let pets = []

    if (!allForms.value || allForms.value.length === 0) {
      pets = [
        {
          grams: props.grammage,
          pet: props.dogData.form1.name,
          products: selected.value?.map((product) => product.id),
        },
      ]
    } else {
      const currentFormData = {
        grams: props.grammage,
        pet: props.dogData.form1.name,
        products: selected.value?.map((product) => product.id) || [],
      }

      const formsData = allForms.value.map((form) => ({
        grams: form.grammage,
        pet: form.pets.form1.name,
        products: selected.value,
      }))

      pets = [currentFormData, ...formsData]
    }

    const response = await accountStore.getPurchaseValues({
      planId: null,
      frequency: 1,
      pets: pets,
    })

    if (response?.status && response?.code == 100) {
      deliveryResume.value = response?.data
      if (frecuency.value && !props.hidePrices) {
        getDailyPrice()
      }
    }
  } catch (error) {
    console.error('Error al obtener valores de compra:', error)
  }
}

onMounted(() => {
  nextTick(async () => {
    await getPlans()
    loadEditData()
  })
})
watch(
  () => props.editData,
  (newValue) => {
    if (newValue) {
      loadEditData()
    }
  },
  { deep: true },
)
watch(
  () => props.planData,
  (newPlanData) => {
    if (newPlanData && Array.isArray(newPlanData) && newPlanData.length > 0) {
      if (props.editData?.selected) {
        const availableProductIds = newPlanData.map((product) => product.id)
        const validSelectedProducts = props.editData.selected.filter(
          (product) => availableProductIds.includes(product.id),
        )
        setValueSelected(
          validSelectedProducts.length > 0 ? [validSelectedProducts[0]] : [],
        )
      } else {
        // Usar el índice parametrizable en lugar del valor hardcodeado
        const indexToSelect = Math.min(
          defaultSelectedIndex.value,
          newPlanData.length - 1,
        )
        const selectedProduct = {
          id: newPlanData[indexToSelect].id,
          name: newPlanData[indexToSelect].name,
        }
        setValueSelected([selectedProduct])
      }
    }
  },
  {
    immediate: true,
    deep: true,
  },
)

defineExpose({
  onSubmit,
  getPlanTotal,
})
</script>

<template>
  <div class="create-container third-step">
    <div class="tw-w-full lg:tw-mt-14">
      <h1
        class="title-create lg:!tw-w-full tw-flex tw-flex-col max-lg:!tw-pt-3"
      >
        {{ $t('create.main.content.3.title') }}
        <strong class="pet-name">{{
          useSearchItemJson('form1.name', dogData)
        }}</strong>
      </h1>
    </div>
    <div class="flex lg:col-12 pl-0 max-lg:tw-flex-col">
      <div class="gramamge-container">
        <p class="grammage-text">
          {{ $t('create.main.content.3.perDay', { grammage: props.grammage }) }}
        </p>
        <div
          v-if="dailyPrice?.finalValueIVA > 0 && !hidePrices"
          class="price-container"
        >
          <p class="price">
            {{ useFormatPrice(dailyPrice.finalValueIVA) }}/día
          </p>
          <p v-if="dailyPrice" class="price lined">
            {{ useFormatPrice(dailyPrice.valueDayIVA) }}
            /día
          </p>
        </div>
        <p v-if="parametrization.isMixedFood" class="grammage-text">
          {{
            $t(
              `create.main.content.1.portions.${useSearchItemJson('form5?.portions', dogData) ? 'mixed.desciprtion' : 'notMixed.title'}`,
            )
          }}
        </p>
      </div>
    </div>
    <!-- v-if="!formSubmitted" -->
    <div
      v-if="!hidePrices"
      class="tw-w-full tw-flex tw-justify-center max-lg:tw-px-3 lg:tw-mt-20 max-lg:tw-mt-24"
    >
      <span class="general-selectButton form tw-py-5">
        <label for="frecuency">
          {{ $t('create.main.content.3.frecuency') }}
        </label>
        <SelectButton
          v-model="frecuency"
          option-value="id"
          option-label="name"
          :options="[...filteredOptions]"
          :allowEmpty="false"
          @click="!hidePrices && getDailyPrice()"
          size="large"
          style="max-width: 350px; margin-left: 30px; margin-top: 20px"
        />
        <GeneralInputError :error="errors['frecuency']" />
        <div
          v-if="
            !hidePrices &&
            deliveryResume?.subtotal > parametrization.limitToBeCollected &&
            parametrization.discount > 0
          "
          class="disccount-option"
        >
          <p>-{{ parametrization.discount }}%</p>
        </div>
      </span>
    </div>
    <div
      v-if="!hidePrices"
      class="tw-flex tw-gap-2 tw-items-center tw-justify-center max-lg:tw-px-3"
    >
      <img
        src="/icons/registry/ic_exclamation.svg"
        alt="ic_exclamation"
        width="18px"
        height="18px"
      />
      <p class="tw-text-primary tw-font-treble-book tw-text-[14px]">
        {{
          $t('create.main.content.3.frecuencyText', {
            frecuency: t(`create.main.content.texts.frecuency${frecuency}`),
          })
        }}
      </p>
    </div>
    <div v-if="!hidePrices" class="tw-w-full tw-mt-20">
      <div
        class="tw-flex tw-gap-2 tw-items-center max-lg:tw-justify-center max-lg:tw-flex-row-reverse"
      >
        <p class="tw-text-primary tw-font-treble-bold tw-text-[20px]">
          {{ $t('create.main.content.3.foodLabel') }}
          {{ useSearchItemJson('form1.name', dogData) }}
        </p>
        <img
          src="/icons/registry/ic_exclamation.svg"
          alt="ic_exclamation"
          width="18px"
          height="18px"
        />
      </div>
      <p class="tw-text-primary tw-font-treble-book tw-text-[14px]">
        {{ $t('create.main.content.3.rule') }}
      </p>
    </div>
    <div
      class="tw-w-full tw-overflow-x-auto tw-pb-4 lg:tw-overflow-visible max-lg:tw-px-3 lg:tw-min-w-[1020px]"
    >
      <Carousel
        v-if="props.planData && props.planData.length > 3 && !isMovil"
        :value="props.planData"
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
              :reset="props.resetForm"
              :initiallySelected="isProductSelected(slotProps.data.id)"
              :prductData="slotProps.data"
              @select="selectSelected"
            />
          </div>
        </template>
      </Carousel>

      <div
        v-else
        class="tw-flex lg:tw-justify-center tw-gap-5 max-lg:tw-pb-2 tw-w-full max-lg:tw-flex-col"
      >
        <GeneralProductCard
          v-for="product in props.planData"
          :id="product.id"
          :key="product.id"
          :reset="props.resetForm"
          :initiallySelected="isProductSelected(product.id)"
          :prductData="product"
          @select="selectSelected"
        />
      </div>

      <GeneralInputError :error="errors['selected']" />
    </div>

    <div v-if="!hidePrices" class="tw-w-full tw-mt-10 lg:tw-max-w-[822px]">
      <!-- <Accordion value="0" class="general-accordion accordion-registry">
        <template #collapseicon>
          <img src="/icons/registry/ic_arrow_up.svg" alt="arrowup" />
        </template>
        <template #expandicon>
          <img
            src="/icons/registry/ic_arrow_up.svg"
            alt="arrowdown"
            style="transform: rotate(180deg)"
          />
        </template>

        <AccordionPanel value="0">
          <AccordionHeader>
            <span class="label-texts tw-w-full">
              {{ $t('create.main.content.3.welcomeBox.title') }}
            </span>
          </AccordionHeader>
          <AccordionContent>
            <div class="items">
              <div class="accordion-content-container">
                <div class="accordion-content">
                  <div class="img-accordion-container">
                    <img src="/icons/registry/ic_pack_in_t.svg" alt="ic_pack" />
                  </div>
                  <p>
                    {{ $t('create.main.content.3.welcomeBox.1') }}
                    {{ useSearchItemJson('form1.name', dogData) }}
                  </p>
                </div>
                <div class="accordion-content">
                  <div class="img-accordion-container">
                    <img
                      src="/icons/registry/ic_food_dog_t.svg"
                      alt="ic_pack"
                    />
                  </div>
                  <p>{{ $t('create.main.content.3.welcomeBox.2') }}</p>
                </div>
              </div>
              <div class="accordion-content-container max-lg:tw-mt-5">
                <div class="accordion-content">
                  <div class="img-accordion-container">
                    <img src="/icons/registry/ic_guide_t.svg" alt="ic_pack" />
                  </div>
                  <p>{{ $t('create.main.content.3.welcomeBox.3') }}</p>
                </div>
                <div class="accordion-content">
                  <div class="img-accordion-container">
                    <img src="/icons/registry/ic_gift_t.svg" alt="ic_pack" />
                  </div>
                  <p>{{ $t('create.main.content.3.welcomeBox.4') }}</p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion> -->
      <div class="benefits-container">
        <div class="benefits-section">
          <div v-for="index in 3" :key="index" class="benefits">
            <img src="/icons/registry/ic_complete_check.svg" alt="ic_check" />
            <p>
              {{ $t(`create.main.content.texts.benefits.${index}`) }}
            </p>
          </div>
        </div>
        <div class="benefits-section !tw-justify-start">
          <div class="benefits">
            <img src="/icons/registry/ic_complete_check.svg" alt="ic_check" />
            <p>
              {{ $t(`create.main.content.texts.benefits.4`) }}
            </p>
          </div>
          <div class="benefits">
            <img src="/icons/registry/ic_complete_check.svg" alt="ic_check" />
            <p>
              {{ $t(`create.main.content.texts.benefits.5`) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss">
.subtitle-third-step {
  color: #25282b !important;
  font-family: 'heading-pro-treble-bold' !important;
  font-size: 14px;
  margin-bottom: 0;
  margin-right: 5px;
}

.pet-name {
  @apply tw-text-primary tw-font-medium-heavy tw-text-[34px];
}

.portion-text {
  color: $instruction;
  font-family: 'heading-pro-treble-bold';
  font-size: 20px;
}

.gramamge-container {
  @apply tw-w-full tw-flex tw-flex-col tw-justify-center tw-gap-2 tw-relative;

  .price-container {
    @apply tw-w-full tw-flex tw-justify-center tw-gap-5 tw-relative;

    .price {
      @apply tw-text-primary tw-font-treble-bold tw-text-[20px];

      &.lined {
        @apply tw-font-treble-regular;
        text-decoration: line-through;
        color: $primary-4;
      }
    }
  }

  .grammage-text {
    @apply tw-w-full tw-flex tw-justify-center tw-gap-5 tw-relative tw-text-primary tw-text-[16px];
  }
}

.benefits-container {
  @apply tw-flex max-lg:tw-flex-col tw-justify-center max-lg:tw-mt-5 max-lg:tw-py-5 tw-border-t-[1px] tw-border-solid tw-border-[#8ba0c9];

  .benefits-section {
    @apply tw-flex tw-flex-col tw-gap-5 lg:tw-mt-5 tw-justify-center max-lg:tw-mt-5;

    .benefits {
      @apply tw-flex tw-items-center tw-gap-3 tw-px-5;
    }
  }
}

.text-frecuency {
  color: #575e6b;
  font-size: 12px;
  margin-top: 5px;
  margin-bottom: 10px;
}
</style>
