div
<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
const emit = defineEmits([
  'finish-form',
  'restartForms',
  'delete-order',
  'delete-last-order',
  'edit-order',
  'edit-last-order',
  'go-back',
  'cupon-applied',
])
/*Stores */
const accountStore = useAccountStore()
const addressStore = useAddressStore()
const cardStore = useCardStore()
const createStore = useCreateStore()
const planStore = usePlanStore()
const { getAllMyPlan: plans } = storeToRefs(planStore)
const {
  getProfileInformation: profile,
  getListCities: cities,
  getAllDateOptions: dateOptions,
  getLisParametrization: parametrization,
} = storeToRefs(accountStore)
const { getMyPet: myPet } = storeToRefs(createStore)
const { getAllMyAddresses: address } = storeToRefs(addressStore)
const { getAllMyCards: cards } = storeToRefs(cardStore)
const { t } = useI18n()
const route = useRoute()
const isListVisible = ref([])
const showAddressDialog = ref(false)
const showAddressCreateDialog = ref(false)
const showUserUpdateDialog = ref(false)
const showPaymentDialog = ref(false)
const showPaymentCreationDialog = ref(false)
const cuponApplied = ref(false)
const tempSelectedAddressId = ref(null)
const tempSelectedCardId = ref(null)
const freeShipping = ref(false)
const appliedCouponCode = ref('')

const { value: addressActive, setValue: setAddressctive } =
  useField<number>('addressActive')
const { value: cardActive, setValue: setCardActive } =
  useField<number>('addressActive')
const props = defineProps({
  allInfo: {
    type: Array,
    required: true,
  },
  lastOrder: {
    type: Object,
    required: true,
  },
  deliveryResume: {
    type: Object,
    required: true,
  },
})
const getItems = async () => {
  await cardStore.getCards()
  await addressStore.getListAddress()
}

const handleAddressPredetermination = async () => {
  useLoading(true)

  if (tempSelectedAddressId.value) {
    selectedAddressId.value = tempSelectedAddressId.value
    setAddressctive(tempSelectedAddressId.value)
  }

  showAddressDialog.value = false
  useLoading(false)
}
const extractGrammage = (idealPortion) => {
  if (!idealPortion) return 0

  const match = idealPortion.match(/(\d+(\.\d+)?)/)
  return match ? parseFloat(match[1]) : 0
}
const transformOrderData = () => {
  if (!props.allInfo || !Array.isArray(props.allInfo)) return []

  return props.allInfo.map((order) => {
    if (
      order.idealPlan &&
      order.grammage &&
      Array.isArray(order.descriptionProducts)
    ) {
      return order
    }

    const selected =
      order.descriptionProducts?.map((item) => ({
        id: item.products.id,
        name: item.products.name,
        price: item.products.price,
      })) || []

    const grammage = extractGrammage(order.idealPortion)

    return {
      ...order,
      grammage,
      idealPlan: {
        selected,
      },
    }
  })
}
const processedOrders = computed(() => transformOrderData())

const handleCardPredetermination = async () => {
  useLoading(true)

  if (tempSelectedCardId.value) {
    selectedCardId.value = tempSelectedCardId.value
    setCardActive(tempSelectedCardId.value)
  }

  showPaymentDialog.value = false
  useLoading(false)
}
const openAddressCreationDialog = async () => {
  useLoading(true)
  showAddressDialog.value = false
  showAddressCreateDialog.value = true
  await accountStore.getCitiesAccount({
    filter: '',
  })
  useLoading(false)
}
const { handleSubmit, errors, meta, setErrors, resetForm } = useForm({
  validationSchema: toTypedSchema(
    z.object({
      deliveryDate: z
        .string({ message: t('rule.validation.require') })
        .min(1, { message: t('rule.validation.require') }),
      couponCode: z.string().optional(),
    }),
  ),
})
const { value: deliveryDate } = useField<string | null>('deliveryDate', {
  initialValue: plans?.value.nextDelivery,
})
const { value: couponCode } = useField<string | null>('couponCode')

const filteredProcessedOrders = computed(() => {
  const petIdFromQuery = route.query.id ? Number(route.query.id) : null

  if (!petIdFromQuery && !props.lastOrder?.pets?.id) {
    return processedOrders.value
  }

  const petIdToFilter = petIdFromQuery || props.lastOrder?.pets?.id

  return processedOrders.value.filter(
    (order) => order.pets.id !== petIdToFilter,
  )
})
const openPaymentCreationDialog = async () => {
  useLoading(true)
  showPaymentDialog.value = false
  showPaymentCreationDialog.value = true
  useLoading(false)
}

const openAddressDialog = () => {
  showAddressDialog.value = true
  tempSelectedAddressId.value = selectedAddressId.value

  setAddressctive(selectedAddressId.value)
}
const openCardDialog = () => {
  showPaymentDialog.value = true
  tempSelectedCardId.value = selectedCardId.value

  setCardActive(selectedCardId.value)
}
const handleAddressDialogClose = () => {
  setAddressctive(selectedAddressId.value)
  tempSelectedAddressId.value = selectedAddressId.value
  showAddressDialog.value = false
}

const handlePaymentDialogClose = () => {
  setCardActive(selectedCardId.value)
  tempSelectedCardId.value = selectedCardId.value
  showPaymentDialog.value = false
}
const selectAddress = (id) => {
  tempSelectedAddressId.value = id
  setAddressctive(id)
}

const selectCard = (id) => {
  tempSelectedCardId.value = id
  setCardActive(id)
}
const selectedAddressId = ref(null)
const selectedCardId = ref(null)

const selectedAddress = computed(() => {
  if (!selectedAddressId.value || !address.value || !address.value.length)
    return null
  return (
    address.value.find((addr) => addr.id === selectedAddressId.value) ||
    address.value[0]
  )
})

const selectedCard = computed(() => {
  if (!selectedCardId.value || !cards.value || !cards.value.length) return null
  return (
    cards.value.find((card) => card.id === selectedCardId.value) ||
    cards.value[0]
  )
})

const onSubmit = async () => {
  const checkoutData = {
    addressId: selectedAddressId.value,
    cardId: selectedCardId.value,
    name: useSearchItemJson('firstName', profile.value),
    surname: useSearchItemJson('lastName', profile.value),
    email: useSearchItemJson('email', profile.value),
    phone: useSearchItemJson('phone', profile.value),
    document: useSearchItemJson('document', profile.value),
    countryCode: useSearchItemJson('countryCode', profile.value),
    documentType: useSearchItemJson('documentType.id', profile.value),
    deliveryDate: deliveryDate.value,
    code: couponCode.value || '',
  }

  emit('finish-form', checkoutData, filteredProcessedOrders.value)

  return checkoutData
}
const couponDiscountAmount = ref(0)
const cuponDiscount = ref()

const applyCoupon = async () => {
  useLoading(true)
  const response = await accountStore.redeemCouponCode({
    code: couponCode.value,
  })
  if (response.status && response.code === 100) {
    useShowAlert({
      type: 'success',
      message: response.message,
    })
    cuponDiscount.value = response.data
    const subtotal = props.deliveryResume?.value?.subtotal || 0
    if (cuponDiscount.value.type === 'Porcentual') {
      couponDiscountAmount.value =
        subtotal * (cuponDiscount.value.valueType / 100)
    } else {
      couponDiscountAmount.value = cuponDiscount.value.valueType
    }
    cuponApplied.value = true
    emit('cupon-applied', couponCode.value)
  } else {
    useShowAlert({
      type: 'error',
      message: response.message,
    })
  }

  useLoading(false)
}
const deleteCoupon = () => {
  cuponApplied.value = false
  couponCode.value = ''
}

defineExpose({
  onSubmit,
})
onMounted(() => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
  nextTick(async () => {
    await getItems()
    await accountStore.getDeliveryDates()

    if (address.value && address.value.length > 0) {
      selectedAddressId.value = address.value[0].id
    }
    if (cards.value && cards.value.length > 0) {
      selectedCardId.value = cards.value[0].id
    }
    resetForm({
      values: {
        deliveryDate: plans?.value?.nextDelivery.toString(),
      },
    })
  })
})
</script>

<template>
  <div class="edit-page-account lg:tw-min-h-[680px] max-lg:tw-min-h-[100%]">
    <div>
      <div class="max-lg:tw-w-full">
        <span class="card-title-plan lg:!tw-mt-0">
          {{ $t('profile.myPlan.edit.cards.1') }}
          <img
            src="/icons/profile/ic_edit.svg"
            alt="ic_edit"
            width="15px"
            height="15px"
            class="tw-cursor-pointer"
            @click="showUserUpdateDialog = true"
          />
        </span>

        <div class="card-info-my-plan">
          <div class="content-card-plan">
            <p class="name">{{ $t('profile.myPlan.edit.cards.name') }}</p>
            <p>
              {{
                useTruncateText(useSearchItemJson('firstName', profile), 15) +
                ' ' +
                useTruncateText(useSearchItemJson('lastName', profile), 15)
              }}
            </p>
          </div>
          <div class="content-card-plan">
            <p class="name">{{ $t('profile.myPlan.edit.cards.email') }}</p>
            <p>
              {{ useTruncateText(useSearchItemJson('email', profile), 30) }}
            </p>
          </div>
          <div class="content-card-plan">
            <p class="name">{{ $t('profile.myPlan.edit.cards.phone') }}</p>
            <p>
              {{
                useSearchItemJson('countryCode', profile) +
                ' ' +
                useSearchItemJson('phone', profile)
              }}
            </p>
          </div>
          <div class="content-card-plan">
            <p class="name">{{ $t('table.enums.person.type') }}</p>
            <p>
              {{
                $t(
                  `table.enums.person.${useSearchItemJson('typePerson', profile)}`,
                )
              }}
            </p>
          </div>
          <div class="content-card-plan">
            <p class="name">Documento de identidad</p>
            <p>
              {{
                useSearchItemJson('documentType.alias', profile) +
                ' ' +
                useSearchItemJson('document', profile)
              }}
            </p>
          </div>
        </div>
      </div>
      <div class="max-lg:tw-w-full">
        <span class="card-title-plan">
          {{ $t('profile.myPlan.edit.cards.2') }}
          <img
            src="/icons/profile/ic_edit.svg"
            alt="ic_edit"
            width="15px"
            height="15px"
            class="tw-cursor-pointer"
            @click="openAddressDialog"
          />
        </span>

        <div class="card-info-my-plan">
          <div class="content-card-plan">
            <p class="name tw-flex tw-gap-2 !tw-text-[14px]">
              <img
                src="/icons/profile/ic_location_line.svg"
                alt="location_ic"
                height="17px"
                width="14px"
              />{{ selectedAddress ? selectedAddress.address : '' }}
            </p>
            <p class="tw-ml-5">
              {{
                selectedAddress
                  ? selectedAddress.complement
                    ? useTruncateText(selectedAddress.complement, 30) +
                      ', ' +
                      selectedAddress.cities.name
                    : selectedAddress.cities.name
                  : ''
              }}
            </p>
          </div>
        </div>
      </div>
      <div class="max-lg:tw-w-full">
        <span class="card-title-plan">
          {{ $t('profile.myPlan.edit.cards.3') }}
          <img
            src="/icons/profile/ic_edit.svg"
            alt="ic_edit"
            width="15px"
            height="15px"
            class="tw-cursor-pointer"
            @click="openCardDialog"
          />
        </span>

        <div class="card-info-my-plan">
          <div class="content-card-plan tw-flex tw-gap-3">
            <img
              src="/icons/profile/ic_credit_card.svg"
              alt="credit_ic"
              height="14px"
              width="18px"
            />
            <p class="name">
              **** {{ selectedCard ? selectedCard.lastFour : '' }}
            </p>
          </div>
        </div>
      </div>
      <small
        class="tw-text-[10px] tw-text-[#8BA0C9] lg:tw-max-w-[610px] lg:tw-w-[58%] max-lg:tw-w-full tw-flex tw-mt-5"
        >{{ $t('create.main.content.4.message') }}</small
      >
    </div>
    <GeneralDialog
      :show="showAddressDialog"
      @close="handleAddressDialogClose"
      width="400px"
    >
      <div class="tw-p-5 tw-relative">
        <span class="tw-text-[#003B71] tw-text-[20px] tw-font-treble-bold">{{
          $t('profile.myPlan.edit.cards.addressDialog.title')
        }}</span>
        <div class="tw-mt-2">
          <div>
            <div
              v-for="(add, index) in address"
              :key="index"
              class="checkout-plan-card"
              @click="selectAddress(add.id)"
            >
              <div>
                <p class="name tw-flex tw-gap-2 !tw-text-[14px]">
                  <img
                    src="/icons/profile/ic_location_line.svg"
                    alt="location_ic"
                    height="17px"
                    width="14px"
                  />{{ useTruncateText(useSearchItemJson('address', add), 30) }}
                </p>
                <p class="tw-ml-5">
                  {{
                    useSearchItemJson('complement', add)
                      ? useTruncateText(
                          useSearchItemJson('complement', add),
                          30,
                        ) +
                        ' - ' +
                        useSearchItemJson('cities.name', add)
                      : useSearchItemJson('cities.name', add)
                  }}
                </p>
              </div>
              <span class="app-general-button radio-btn tw-ml-3">
                <RadioButton
                  class="!tw-top-auto"
                  :name="`add-${add.id}`"
                  :value="add.id"
                  v-model="addressActive"
                />
              </span>
            </div>
            <div
              class="tw-flex tw-w-full tw-items-center tw-justify-end tw-mt-5 tw-cursor-pointer"
              @click="openAddressCreationDialog"
            >
              <i
                class="pi pi-plus"
                style="color: #003b71; font-size: 15px; margin-right: 10px"
              ></i>
              <p class="tw-text-primary tw-font-treble-bold">
                {{ $t('profile.myPlan.edit.cards.addressDialog.new') }}
              </p>
            </div>
          </div>

          <div class="tw-flex tw-mt-11 tw-w-full tw-justify-end tw-gap-3">
            <Button
              class="app-general-button app-btn-transparent"
              :label="$t('button.cancel')"
              @click="handleAddressDialogClose"
            />
            <Button
              class="app-general-button btn-solo-create !tw-w-[175px]"
              :label="$t('profile.myPlan.edit.cards.addressDialog.confirm')"
              @click="handleAddressPredetermination"
            />
          </div>
        </div>
      </div>
    </GeneralDialog>

    <GeneralDialog
      :show="showPaymentDialog"
      @close="handlePaymentDialogClose"
      width="400px"
    >
      <div class="tw-p-5 tw-relative">
        <span class="tw-text-[#003B71] tw-text-[20px] tw-font-treble-bold">{{
          $t('profile.myPlan.edit.cards.paymentDialog.title')
        }}</span>
        <div class="tw-mt-2">
          <div>
            <div
              v-for="(add, index) in cards"
              :key="index"
              class="checkout-plan-card"
              @click="selectCard(add.id)"
            >
              <div>
                <p class="name tw-flex tw-gap-2 !tw-text-[14px]">
                  <img
                    src="/icons/profile/ic_credit_card.svg"
                    alt="location_ic"
                    height="17px"
                    width="14px"
                  />**** {{ useSearchItemJson('lastFour', add) }}
                </p>
              </div>
              <span class="app-general-button radio-btn tw-ml-3">
                <RadioButton
                  class="!tw-top-auto"
                  :name="`add-${add.id}`"
                  :value="add.id"
                  v-model="cardActive"
                />
              </span>
            </div>
            <div
              class="tw-flex tw-w-full tw-items-center tw-justify-end tw-mt-5 tw-cursor-pointer"
              @click="openPaymentCreationDialog"
            >
              <i
                class="pi pi-plus"
                style="color: #003b71; font-size: 15px; margin-right: 10px"
              ></i>
              <p class="tw-text-primary tw-font-treble-bold">
                {{ $t('profile.myPlan.edit.cards.paymentDialog.new') }}
              </p>
            </div>
          </div>

          <div class="tw-flex tw-mt-11 tw-w-full tw-justify-end">
            <Button
              class="app-general-button app-btn-transparent"
              :label="$t('button.cancel')"
              @click="handlePaymentDialogClose"
            />
            <Button
              class="app-general-button btn-solo-create !tw-w-[175px]"
              :label="$t('profile.myPlan.edit.cards.addressDialog.confirm')"
              @click="handleCardPredetermination"
            />
          </div>
        </div>
      </div>
    </GeneralDialog>

    <GeneralDialogCreateAddress
      v-model:show="showAddressCreateDialog"
      @address-created="(showAddressCreateDialog = false), getItems()"
      @back-to-list="
        (showAddressCreateDialog = false), (showAddressDialog = true)
      "
    />
    <GeneralDialogCreatePaymentMethod
      v-model:show="showPaymentCreationDialog"
      @address-created="(showPaymentCreationDialog = false), getItems()"
      @back-to-list="
        (showPaymentCreationDialog = false), (showPaymentDialog = true)
      "
    />
    <GeneralDialogUpdateUser
      v-model:show="showUserUpdateDialog"
      @address-created="(showUserUpdateDialog = false), getItems()"
      @back-to-list="showUserUpdateDialog = false"
    />
  </div>

  <div v-if="props.deliveryResume" class="summary-section-my-pets">
    <div class="lg:tw-mt-[100px] max-lg:tw-mt-5">
      <div class="lg:tw-px-7 max-lg:tw-px-4 tw-flex tw-gap-3">
        <h5 class="checkouts-title">
          {{ $t('create.main.content.4.orderSummary.title') }}
        </h5>
      </div>
      <div class="dogs-products-recieved">
        <div class="head lg:tw-px-7 max-lg:tw-px-4">
          <span class="dogs-name">
            {{ useTruncateText(props.lastOrder?.pets?.name, 12) }}</span
          >
        </div>
        <div class="summary lg:tw-px-7 max-lg:tw-px-4">
          <span> Cada {{ props?.deliveryResume.frequency }}</span>
          <span class="price">
            {{ useFormatPrice(props.deliveryResume.pets[0].price) }}</span
          >
        </div>
        <div class="number-list">
          <ul>
            <li
              v-for="(product, subIndex) in props.deliveryResume.pets[0]
                .products"
              :key="subIndex"
            >
              x{{ product.amount }} {{ product.name }}
            </li>
          </ul>
        </div>
      </div>
      <div class="payment">
        <div class="lg:tw-px-7 max-lg:tw-px-4 tw-flex tw-justify-between">
          <p>
            {{ $t('create.main.content.4.orderSummary.subtotal') }}
          </p>
          <p>{{ useFormatPrice(props.deliveryResume.subtotal) }}</p>
        </div>

        <div
          v-if="props.deliveryResume.discount"
          class="lg:tw-px-7 max-lg:tw-px-4 tw-flex tw-justify-between"
        >
          <p>
            {{ $t('create.main.content.4.orderSummary.discount') }}
          </p>
          <p class="tw-text-[#3DB5E6]">
            {{ useFormatPrice(props.deliveryResume.discount) }}
          </p>
        </div>
        <div class="lg:tw-px-7 max-lg:tw-px-4 tw-flex tw-justify-between">
          <p>
            {{ $t('create.main.content.4.orderSummary.iva') }} ({{
              parametrization.iva
            }}%)
          </p>
          <p>
            {{ useFormatPrice(props.deliveryResume.iva) }}
          </p>
        </div>

        <div class="lg:tw-px-7 max-lg:tw-px-4 tw-flex tw-justify-between">
          <p>
            {{ $t('create.main.content.4.orderSummary.delivery') }}
          </p>
          <p v-if="!freeShipping">
            {{
              selectedAddress?.cities?.shippingCost[0]?.shippingCost
                ? calculateTotalWithDelivery(
                    selectedAddress?.cities?.shippingCost[0],
                    props.deliveryResume,
                    'delivery',
                  )
                : '0'
            }}
          </p>
          <p v-else class="tw-text-[#3DB5E6]">Gratis</p>
        </div>

        <div class="lg:tw-px-7 max-lg:tw-px-4 tw-flex tw-justify-between">
          <p class="total tw-pt-5">
            {{ $t('create.main.content.4.orderSummary.total') }}
          </p>
          <p class="total tw-ml-auto tw-text-end tw-pt-5">
            {{
              useFormatPrice(
                calculateTotalWithDelivery(
                  selectedAddress?.cities?.shippingCost[0],
                  props.deliveryResume,
                  'price',
                ),
              )
            }}
          </p>
        </div>
        <div class="lg:tw-px-7 max-lg:tw-px-8 tw-flex tw-justify-between">
          <p>
            {{ $t('forms.create.checkout.frequency') }}
          </p>
          <div class="tw-flex tw-flex-col">
            <p class="tw-text-right">
              {{
                deliveryResume?.frequency === '4 semanas'
                  ? 'Mensual'
                  : 'Quincenal'
              }}
            </p>
            <p>
              {{ `(Cada ${deliveryResume?.frequency})` }}
            </p>
          </div>
        </div>
        <div class="lg:tw-px-7 max-lg:tw-px-8 tw-flex tw-justify-between">
          <p>
            {{ $t('forms.create.deliveryDate') }}
          </p>
          <p v-if="plans.nextDelivery" class="tw-text-right">
            {{
              plans.nextDelivery
                ? useFormatDate(plans.nextDelivery, 'date-table')
                : ''
            }}
          </p>
          <!-- <span class="general-dropdown solo-create checkout !tw-min-h-0">
            <Select
              v-model="deliveryDate"
              :options="dateOptions"
              placeholder="Selecciona"
              option-value="date"
              option-label="date"
              :pt="{
                overlay: 'tw-w-[40px]',
              }"
            >
              <template #option="slotProps">
                <div class="general">
                  {{ useFormatDate(slotProps?.option?.date, 'date-table') }}
                </div>
              </template>
              <template #value="slotProps">
                <div class="general">
                  {{
                    slotProps.value
                      ? useFormatDate(slotProps.value, 'date-table')
                      : slotProps.placeholder
                  }}
                </div>
              </template>
            </Select>

            <GeneralInputError :error="errors['deliveryDate']" />
          </span> -->
        </div>
      </div>
      <!-- <div v-if="cuponApplied" class="summary-discount">
        <span class="discount-text">
          <img src="/icons/checkout/ic_cupon.svg" alt="cupon" class="tw-mr-3" />
          {{ couponCode }}
        </span>
        <div class="tw-flex tw-items-center tw-gap-3">
          <p>
            {{
              cuponDiscount.type === 'Valor'
                ? '-' + useFormatPrice(cuponDiscount.valueType)
                : cuponDiscount.valueType + '%'
            }}
          </p>
          <i
            class="pi pi-times"
            style="cursor: pointer; color: #003b71"
            @click="deleteCoupon"
          ></i>
        </div>
      </div>
      <div v-if="!cuponApplied" class="summary-discount !tw-h-[80px]">
        <span class="general-input solo-email checkout !tw-h-auto tw-w-full">
          <IconField iconPosition="right">
            <InputText
              v-model="couponCode"
              placeholder="Código de descuento"
              maxlength="50"
            />
            <InputIcon>
              <Button
                @click="applyCoupon"
                class="app-general-button btn-solo-create !tw-w-[86px] !tw-h-[30px]"
              >
                Aplicar
              </Button>
            </InputIcon>
          </IconField>
        </span>
      </div> -->

      <div class="lg:tw-px-7 max-lg:tw-px-4 tw-pt-5">
        <small class="tw-text-[10px] tw-text-[#8BA0C9]">
          {{ $t('create.main.content.4.orderSummary.message') }}
        </small>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.checkout-plan-card {
  @apply tw-flex tw-flex-row tw-items-center tw-py-5 tw-cursor-pointer;
  border-bottom: 1px solid #8ba0c9;

  .name {
    @apply tw-text-[12px] tw-font-treble-bold tw-text-[#1A1A29];
  }
}

.card-title-plan {
  @apply tw-flex tw-gap-2 tw-text-[18px] tw-font-treble-bold tw-text-[#575E6B] tw-mt-10;

  p {
    @apply tw-text-[14px];
  }
}

.card-info-my-plan {
  @apply tw-bg-white tw-p-5 tw-rounded-xl tw-flex lg:tw-gap-10 max-lg:tw-gap-3 tw-flex-wrap lg:tw-w-[60%];
  @apply max-lg:tw-w-full;

  .content-card-plan {
    .name {
      @apply tw-text-[12px] tw-font-treble-bold tw-text-[#1A1A29];
    }
  }
}

.summary-section-my-pets {
  @apply lg:tw-fixed lg:tw-pt-0 lg:tw-right-0 lg:tw-min-w-[400px] tw-h-full lg:tw-w-[25%] lg:tw-top-0 lg:tw-overflow-y-auto lg:tw-pb-28;
  @apply max-lg:tw-relative max-lg:tw-w-full max-lg:tw-mb-10;
  background-color: #ffffff;

  .checkouts-title {
    @apply tw-text-[18px] tw-my-1 max-lg:tw-mt-10;
    font-family: 'heading-pro-treble-bold';
    color: #575e6b;
  }

  .dogs-products-recieved {
    @apply lg:tw-min-h-[80px] max-lg:tw-min-h-[110px];
    border-bottom: 3px solid #f5f6fa;

    .head {
      @apply tw-flex tw-justify-between tw-mt-3;
      border-bottom: 1px dashed #d1d9e9;
      .dogs-name {
        @apply tw-text-primary tw-text-[16px];
        font-family: 'heading-pro-treble-bold';
      }
    }

    .summary {
      @apply tw-flex tw-justify-between tw-mt-3 lg:tw-mb-3;

      .price {
        @apply tw-text-[13px] tw-text-[#25282B];
        font-family: 'heading-pro-treble-bold';
      }

      .quantity {
        @apply lg:tw-w-[210px] tw-text-primary tw-text-[12px] tw-flex tw-cursor-pointer max-lg:tw-w-[170px];
      }
    }
    .number-list {
      @apply tw-text-[13px] tw-text-[#575E6B] tw-mb-5 tw-pl-6;
      ul {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    }
  }

  .payment {
    @apply tw-py-5 tw-flex tw-flex-col tw-gap-3;
    border-bottom: 3px solid #f5f6fa;

    .total {
      @apply tw-text-[16px] tw-text-[#1A1A29];
      font-family: 'heading-pro-treble-bold';
      border-top: 3px solid #f5f6fa;
      width: 100%;
    }
  }

  .summary-discount {
    @apply tw-flex tw-justify-between lg:tw-px-10 max-lg:tw-px-4 tw-h-[50px] tw-items-center;
    border-bottom: 3px solid #f5f6fa;

    .discount-text {
      @apply tw-text-[#2B7EE2] tw-flex;
    }
  }
}
</style>
