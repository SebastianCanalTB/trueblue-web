<script setup lang="ts">
import { useForm, useFieldArray } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const ordersStore = useOrderStore()

const { getOrderDetail: order } = storeToRefs(ordersStore)

const route = useRoute()
const router = useRouter()
const isLoading = ref(true)
const { t } = useI18n()
const localePath = useLocalePath()
const showUpdateDialog = ref(false)
const selectedProduct = ref<any>(null)

const listRoutes = computed(() => [
  {
    text: t('profile.myDeliveries.title'),
    action: () => {
      router.push({ path: '/profile/my-deliveries' })
    },
  },
  {
    text: t('profile.myDeliveries.detail.id', {
      data: route.params.id || '',
    }),
    action: () => {
      router.push(
        localePath({
          name: 'profile-my-deliveries-id',
          params: { id: route.params.id },
        }),
      )
    },
  },
  {
    text: t('profile.myDeliveries.detail.edit', {
      data: route.params.id || '',
    }),
    url: route.fullPath,
  },
])

const availableStatusForEdition = [
  'created',
  'pending_payment',
  'in_preparation',
]

// Zod Schema
const { handleSubmit, errors, setFieldValue, resetForm } = useForm({
  validationSchema: toTypedSchema(
    z.object({
      petData: z
        .array(
          z.object({
            configId: z.number(),
            petInfo: z
              .object({
                id: z.number().optional(),
                name: z.string().optional(),
                sex: z.string().optional(),
                age: z.number().optional(),
                month: z.number().optional(),
                currentWeight: z.number().optional(),
                sterilization: z.boolean().optional(),
              })
              .optional(),
            idealPortion: z.string().optional(),
            grams: z
              .number({ message: t('rule.validation.requireForm') })
              .min(1, { message: t('rule.validation.requireForm') }),
            products: z
              .array(
                z.object({
                  id: z.number().nullable().optional(),
                  productId: z.number(),
                  name: z.string(),
                  imageProduct: z.string().optional(),
                  description: z.string().optional(),
                  numberOfPackages: z.number().nullable().default(0),
                  nutritionalInformation: z.any().optional(),
                  attributes: z.array(z.any()).optional(),
                }),
              )
              .optional(),
            price: z.number().nullable().optional(),
            maxPackages: z.number().optional(),
            totalSelectedPackages: z.number().optional(),
          }),
        )
        .superRefine((petDataArray, ctx) => {
          petDataArray.forEach((pet, index) => {
            const totalSelected =
              pet.products?.reduce(
                (sum, product) => sum + (product.numberOfPackages || 0),
                0,
              ) || 0

            if (totalSelected !== pet.maxPackages) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Debes seleccionar exactamente ${pet.maxPackages} paquetes. Actualmente tienes ${totalSelected} seleccionados.`,
                path: [index, 'totalSelectedPackages'],
              })
            }
          })
        }),
    }),
  ),
})

const { fields: petData } = useFieldArray<any>('petData')

const extractGramsFromString = (idealPortion: string): number => {
  const match = idealPortion?.match(/(\d+)/)
  return match ? parseInt(match[1]) : 0
}

const initializeFormData = () => {
  const orderDetails = order.value?.orderDetail
  if (!orderDetails || orderDetails.length === 0) {
    console.warn('No order details available')
    return
  }

  const mappedPets = orderDetails.map((config: any) => {
    const currentProducts = config.detailProducts || []
    const recommendedProducts = config.petDetail?.recommendedProducts || []

    const maxPackages = currentProducts.reduce(
      (sum: number, product: any) => sum + (product.numberOfPackages || 0),
      0,
    )

    const productsWithPackages = recommendedProducts.map((recProduct: any) => {
      const existingInOrder = currentProducts.find(
        (p: any) => p.name === recProduct.name,
      )

      return {
        id: existingInOrder?.id || null,
        productId: recProduct.id,
        name: recProduct.name,
        imageProduct: recProduct.imageProduct,
        description: recProduct.description,
        nutritionalInformation: recProduct.nutritionalInformation,
        attributes: recProduct.attributes,
        numberOfPackages: existingInOrder?.numberOfPackages || 0,
      }
    })

    const totalSelectedPackages = productsWithPackages.reduce(
      (sum: number, product: any) => sum + (product.numberOfPackages || 0),
      0,
    )

    return {
      configId: config.id,
      petInfo: config.petDetail
        ? {
            id: config.petDetail.id,
            name: config.petDetail.name,
            sex: config.petDetail.sex,
            age: config.petDetail.age,
            month: config.petDetail.month,
            currentWeight: config.petDetail.currentWeight,
            sterilization: config.petDetail.sterilization,
          }
        : null,
      idealPortion: config.idealPortion,
      grams: extractGramsFromString(config.idealPortion),
      products: productsWithPackages,
      price: config.price,
      maxPackages: maxPackages,
      totalSelectedPackages: totalSelectedPackages,
    }
  })

  resetForm({
    values: {
      petData: mappedPets,
    },
  })
}

// Auto distribute packages
const handleAutoDistribute = (petIndex: number) => {
  const pet = petData.value[petIndex]?.value

  if (!pet || !pet.products || !pet.maxPackages) {
    console.warn('No hay datos suficientes para distribuir paquetes')
    return
  }

  const productsCount = pet.products.length
  const baseQuantity = Math.floor(pet.maxPackages / productsCount)
  const remainder = pet.maxPackages % productsCount

  pet.products.forEach((product: any, productIndex: number) => {
    const numberOfPackages = baseQuantity + (productIndex < remainder ? 1 : 0)
    setFieldValue(
      `petData[${petIndex}].products[${productIndex}].numberOfPackages`,
      numberOfPackages,
    )
  })

  setFieldValue(`petData[${petIndex}].totalSelectedPackages`, pet.maxPackages)
}

// Log product data for debugging and open drawer
const handleViewDetail = (product: any) => {
  selectedProduct.value = product
  showUpdateDialog.value = true
}

// Get total selected packages for a pet
const getTotalSelectedPackages = (petIndex: number) => {
  return computed(() => {
    const pet = petData.value[petIndex]
    if (!pet?.value?.products) return 0

    return pet.value.products.reduce(
      (sum: number, product: any) => sum + (product.numberOfPackages || 0),
      0,
    )
  })
}

// Format data for submit
const formatDataForSubmit = (petData: any[]) => {
  return {
    orderId: Number(route.params.id),
    pets: petData
      .map((pet) => ({
        pet: pet.petInfo?.name || '',
        products:
          pet.products
            ?.filter((product: any) => product.numberOfPackages > 0)
            .map((product: any) => ({
              id: product.productId,
              numberOfPackages: product.numberOfPackages,
            })) || [],
      }))
      .filter((pet) => pet.products.length > 0),
  }
}

// Submit handler
const onSubmit = handleSubmit(async (values: any) => {
  isLoading.value = true
  const formattedData = formatDataForSubmit(values.petData)

  const response = await ordersStore.editOrder(formattedData)
  if (response.status && response.code === 100) {
    useShowAlert({
      type: 'success',
      message: response.message,
    })
    router.push({
      path: `/profile/my-deliveries/${route.params.id}`,
    })
  } else {
    useShowAlert({
      type: 'error',
      message: response.message,
    })
  }

  isLoading.value = false
})

// Initialize data on mount
const getData = async () => {
  isLoading.value = true

  try {
    const response = await ordersStore.getOneOrder(Number(route.params.id))
    if (response.status && response.code === 100) {
      if (
        !availableStatusForEdition.includes(
          useSearchItemJson('statusOrder', order.value),
        )
      ) {
        router.push({ path: '/profile/my-deliveries' })
        return
      }

      await nextTick()
      initializeFormData()
    } else {
      router.push({ path: '/profile/my-deliveries' })
    }
  } catch (error) {
    console.error('Error loading order data:', error)
    router.push({ path: '/profile/my-deliveries' })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  nextTick(async () => {
    await getData()
  })
})
</script>

<template>
  <div v-if="!isLoading" class="content-page">
    <GeneralBreadCrumb :routes="listRoutes" />
    <section class="container">
      <div class="content">
        <h2 class="title primary1">Editar pedido #{{ route.params.id }}</h2>

        <Tabs value="0" class="general-tabs order-tabs">
          <TabList>
            <Tab
              v-for="(petItem, petIndex) in petData"
              :key="`tab-${petItem.key}`"
              :value="petIndex.toString()"
            >
              {{ petItem.value.petInfo?.name || 'Sin nombre' }}
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel
              v-for="(petItem, petIndex) in petData"
              :key="`panel-${petItem.key}`"
              :value="petIndex.toString()"
            >
              <div class="w-full">
                <!-- Ideal Portion -->
                <span
                  class="general-input form-group normal-labels"
                  style="width: 302px"
                >
                  <label for="quantity">Porción ideal</label>
                  <InputGroup>
                    <InputNumber
                      v-model="petData[petIndex].value.grams"
                      :placeholder="'00'"
                      :disabled="true"
                      :max="3571"
                      :maxLength="4"
                      :useGrouping="false"
                      fluid
                    />
                    <InputGroupAddon>gramos/día</InputGroupAddon>
                  </InputGroup>
                  <GeneralInputError
                    :error="errors[`petData[${petIndex}].grams`]"
                  />
                </span>

                <!-- Package Selection Indicator -->
                <div class="mb-3">
                  <p class="body-m-highlighted">
                    Paquetes seleccionados:
                    <span
                      :class="
                        getTotalSelectedPackages(petIndex).value ===
                        petItem.value.maxPackages
                          ? 'text-green-500'
                          : 'text-red-500'
                      "
                    >
                      {{ getTotalSelectedPackages(petIndex).value }}
                    </span>
                    / {{ petItem.value.maxPackages }}
                  </p>
                  <GeneralInputError
                    :error="
                      errors[`petData[${petIndex}].totalSelectedPackages`]
                    "
                  />
                </div>
                <span class="body-m-highlighted tw-text-[18px]">
                  Debes agregar {{ petItem.value.maxPackages }} paquetes
                </span>
                <!-- Auto Distribute Button -->
                <Button
                  class="app-general-button app-btn-transparent label-primary"
                  @click="handleAutoDistribute(petIndex)"
                  label="Distribuir automáticamente"
                  icon="pi pi-refresh"
                  :pt="{
                    label: 'underline',
                  }"
                />
                <div class="mt-5">
                  <p class="body-m-highlighted mb-3">Productos</p>
                  <div
                    v-for="(product, productIndex) in petItem.value.products"
                    :key="productIndex"
                    class="card-protein"
                  >
                    <div class="general-information mt-2">
                      <img
                        :src="product.imageProduct"
                        alt="image_products"
                        width="114px"
                        height="114px"
                      />
                      <div class="tw-flex max-lg:tw-flex-col tw-w-full">
                        <div
                          class="flex flex-column justify-content-center flex-1"
                        >
                          <p class="body-m-highlighted">
                            {{ product.name }}
                          </p>
                          <p class="body-s-black">
                            {{ product.description }}
                            <span
                              class="detail p-0 tw-cursor-pointer tw-text-blue-500 tw-ml-1"
                              @click="handleViewDetail(product)"
                            >
                              Ver detalle
                            </span>
                          </p>
                        </div>
                        <div class="lg:tw-ml-auto">
                          <span class="general-input group-plan">
                            <InputNumber
                              v-model="product.numberOfPackages"
                              fluid
                              :useGrouping="false"
                              :min="0"
                              :max="petItem.value.maxPackages"
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

        <!-- Action Buttons -->
        <span
          class="flex gap-5 w-full justify-content-end align-items-end mt-4"
        >
          <Button
            type="submit"
            class="app-general-button app-btn-primary px-5"
            label="Actualizar"
            @click="onSubmit"
          />
        </span>
      </div>
    </section>
    <sidebarFoodDetailDrawer
      :showUpdateDialog="showUpdateDialog"
      :details="selectedProduct?.nutritionalInformation"
      :attributes="selectedProduct?.attributes"
      :name="selectedProduct?.name"
      :description="selectedProduct?.description"
      @closeModal="showUpdateDialog = false"
    />
  </div>
</template>

<style lang="scss" scoped>
.content-page {
  @apply tw-w-full tw-h-full lg:tw-pt-10 lg:tw-px-16;

  .body-m-highlighted {
    font-family: 'heading-pro-treble-bold';
    font-style: normal;
    font-weight: bold;
    font-size: $font-size-14;
    line-height: 24px;
    letter-spacing: 0;
    color: $color-25282b;
    margin: 0;
  }
  .card-protein {
    @apply lg:tw-p-5 max-lg:tw-p-2;
    margin: 20px 0;
    background-color: $color-white;
    border-radius: 12px;
    border: 1px solid rgba($text-disabled, 76%);
    display: flex;
    flex-direction: column;
    &.recommended {
      border: 1px solid $secondary;
      box-shadow: 0px 3px 6px #00000029;
    }
    .option {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 16px;
      justify-content: end;
      margin: 7px 7px 4px 7px;
      span {
        background-color: #2b7ee2;
        padding: 5px 8px;
        border-radius: 16px;
        width: fit-content;
        .title {
          font-family: 'heading-pro-treble-book';
          font-size: 11px;
          margin: 0;
          color: $color-white;
        }
      }
    }
    .switch-label {
      @apply tw-text-[#1A1A29] tw-font-treble-bold tw-text-[12px] tw-w-16;
    }
    .general-information {
      @apply lg:tw-gap-9 max-lg:tw-gap-2;
      display: flex;
      .detail {
        @apply lg:tw-text-[13px] max-lg:tw-text-[12px];
        font-family: 'heading-pro-treble-regular';
        color: $secondary;
        margin-left: 8px;
        cursor: pointer;
      }
      img {
        width: 114px;
        height: 114px;
        object-fit: cover;
      }
    }
  }
}
</style>
