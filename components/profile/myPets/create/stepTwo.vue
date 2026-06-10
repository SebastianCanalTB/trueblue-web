<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

interface Product {
  id: number
  name: string
  price: number
}

interface FormData {
  frequency: number
  selectedProducts: number[]
}

interface EditData {
  frequency?: number
  selectedProducts?: number[]
}

const emit = defineEmits([
  'update:modelValue',
  'finish-form',
  'product-price',
  'frequency-change',
])
const props = defineProps({
  dogName: {
    type: String,
    required: true,
  },
  resetForm: {
    type: Boolean,
    default: false,
  },
  editData: {
    type: Object as PropType<EditData>,
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
    type: Array as PropType<Product[]>,
    required: true,
  },
})

const createStore = useCreateStore()
const { getListFrecuencies: frequencyOptions, getMyPet: myPet } =
  storeToRefs(createStore)
const systemStore = useSystemStore()
const { isMovil } = storeToRefs(systemStore)
const planStore = usePlanStore()
const { getAllMyPlan: myPlan } = storeToRefs(planStore)
const { t } = useI18n()
const route = useRoute()

const validationSchema = toTypedSchema(
  z.object({
    selectedProducts: z
      .array(
        z.object({
          id: z.number().min(1, { message: t('rule.validation.require') }),
        }),
      )
      .min(1, { message: t('rule.validation.require') }),
  }),
)

const { handleSubmit, errors, meta, resetForm, setFieldValue, values } =
  useForm({
    validationSchema,
  })

const { value: selectedProducts } = useField<any[]>('selectedProducts')

const isLoading = ref(false)
const formSendData = ref<FormData | null>(null)

const loadInitialData = async () => {
  try {
    isLoading.value = true
    await createStore.getFrecuencies()
  } catch (error) {
    console.error('Error loading initial data:', error)
  } finally {
    isLoading.value = false
  }
}

const toggleProductSelection = (productId: number) => {
  const currentProducts = Array.isArray(selectedProducts.value)
    ? [...selectedProducts.value]
    : []
  const index = currentProducts.findIndex(
    (product: any) => product.id === productId,
  )

  if (index > -1) {
    currentProducts.splice(index, 1)
  } else {
    currentProducts.push({ id: productId })
  }
  setFieldValue('selectedProducts', currentProducts)
}

const isProductSelected = (productId: number): boolean => {
  if (!selectedProducts?.value || !Array.isArray(selectedProducts.value)) {
    return false
  }
  return selectedProducts.value.some((product: any) => product.id === productId)
}

const loadPetData = () => {
  if (!myPet.value || Number(route.query.id) === 0) return

  try {
    const petsOptionsData =
      useSearchItemJson(
        'planDescriptions[0].descriptionProducts',
        myPet.value,
      ) || []
    resetForm({
      values: {
        selectedProducts: petsOptionsData.map((t) => {
          return {
            id: t.products.id,
          }
        }),
      },
    })
    // selectFrequency(myPlan.value.frequency === '4 semanas' ? 1 : 2)
    // console.log(myPlan.value.frequency === '4 semanas' ? 1 : 2)
  } catch (error) {
    console.error('Error loading pet data:', error)
  }
}

const onSubmit = handleSubmit((values: FormData) => {
  formSendData.value = values
  emit('finish-form', values)
  return values
})

const resetFormData = () => {
  resetForm({
    values: {
      selectedProducts: [],
    },
  })
}

watch(
  () => meta.value.valid,
  (isValid: boolean) => {
    emit('update:modelValue', isValid)
  },
)

watch(
  () => props.resetForm,
  (shouldReset: boolean) => {
    if (shouldReset) {
      resetFormData()
    }
  },
)
watch(
  () => myPet.value,
  (newPetData) => {
    if (newPetData && Number(route.query.id) !== 0) {
      nextTick(() => {
        loadPetData()
      })
    }
  },
  { deep: true },
)

onMounted(() => {
  nextTick(async () => {
    await loadInitialData()
  })
})

defineExpose({
  onSubmit,
})
</script>

<template>
  <div
    class="create-container lg:!tw-items-start lg:tw-ml-[5%] lg:!tw-w-full max-lg:tw-mb-10"
  >
    <div>
      <h1 class="title-create !tw-text-start max-lg:tw-mb-3 lg:!tw-pl-0">
        {{ $t('create.main.content.3.title') }}
        <strong>{{ props.dogName }}</strong>
      </h1>
      <div class="tw-flex lg:col-12 pl-0 max-lg:tw-flex-col">
        <div class="lg:col-12 pl-0 max-lg:tw-mb-3">
          <p class="subtitle-third-step">
            {{ $t('create.main.content.3.portion') }}
          </p>
          <strong class="portion-text">
            {{
              $t('create.main.content.3.perDay', { grammage: props.grammage })
            }}
          </strong>
        </div>
      </div>

      <div>
        <p class="subtitle-third-step">
          {{ $t('create.main.content.3.protein') }}
        </p>
        <p class="text-frecuency mt-1">
          {{ $t('create.main.content.3.textProtein') }}
        </p>
      </div>
    </div>
    <div
      v-if="props.planData && props.planData.length > 3 && !isMovil"
      class="tw-w-[1020px]"
    >
      <Carousel
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
          <GeneralProductCard
            :id="slotProps.data.id"
            :key="slotProps.data.id"
            :prductData="slotProps.data"
            :initially-selected="isProductSelected(slotProps.data.id)"
            @select="() => toggleProductSelection(slotProps.data.id)"
          />
        </template>
      </Carousel>
    </div>
    <div v-else class="max-lg:tw-w-full lg:tw-h-[500px] tw-relative">
      <div
        class="cards-container lg:tw-overflow-y-hidden tw-h-full tw-pb-4"
        style="scrollbar-width: thin"
      >
        <div class="tw-flex max-lg:tw-flex-col tw-gap-3 tw-min-w-max tw-pb-5">
          <GeneralProductCard
            v-for="product in props.planData"
            :id="product.id"
            :key="product.id"
            :prductData="product"
            :reset="props.resetForm"
            :initially-selected="isProductSelected(product.id)"
            @select="() => toggleProductSelection(product.id)"
          />
        </div>
      </div>

      <div
        class="tw-w-full tw-mt-5"
        :class="
          errors.selectedProducts
            ? 'tw-flex tw-justify-between tw-flex-row-reverse'
            : 'tw-text-end'
        "
      >
        <GeneralInputError
          class="!tw-mr-0"
          :error="
            errors.selectedProducts === 'Required'
              ? $t('rule.validation.require')
              : errors.selectedProducts
          "
        />
      </div>
    </div>

    <div v-if="isLoading" class="tw-text-center tw-py-4">
      <p>{{ $t('common.loading') }}</p>
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

.portion-text {
  color: $instruction;
  font-family: 'heading-pro-treble-bold';
  font-size: 20px;
}

.text-frecuency {
  color: #575e6b;
  font-size: 12px;
  margin-top: 5px;
  margin-bottom: 10px;
}

.cards-container {
  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;

    &:hover {
      background: #a8a8a8;
    }
  }
}
</style>
