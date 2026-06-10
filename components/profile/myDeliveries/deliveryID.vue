<script setup lang="ts">
import { storeToRefs } from 'pinia'

const props = defineProps({
  deliveryId: {
    type: String,
    required: true,
  },
})

const loading = ref(true)
const route = useRoute()
const router = useRouter()
const ordersStore = useOrderStore()
const accountStore = useAccountStore()
const { getOrderDetail: order } = storeToRefs(ordersStore)
const localePath = useLocalePath()
const addressStore = useAddressStore()
const { getAllMyAddresses: address } = storeToRefs(addressStore)
const showAddressDialog = ref(false)
const addressActive = ref(0)
const isEditable = computed(() =>
  ['created', 'pending_payment', 'in_preparation'].includes(
    order.value.statusOrder,
  ),
)
const clientInformationDialog = ref(false)
const openEditShipping = ref(false)
const currentDate = computed(() => useSearchItemJson('delivery', order.value))
const { t } = useI18n()
const datePickerOpen = ref(false)
const isDeliveryDateValid = computed(() => {
  if (!currentDate.value) return false

  const deliveryDate = useFormatDate(currentDate.value, 'date-send')
  const today = new Date()
  return deliveryDate === useFormatDate(today.toISOString(), 'date-send')
})
const canEditCities = computed(() => {
  return ['rejected', 'pending_payment'].includes(order.value.statusPayment)
})
const statusMap = {
  created: 'table.enums.status.created',
  payment_confirmed: 'profile.myDeliveries.detail.payment',
  in_preparation: 'table.enums.status.in_preparation',
  pending_payment: 'table.enums.status.pending_payment',
  on_the_way: 'table.enums.status.on_the_way',
  delivered: 'table.enums.status.delivered',
  delivered_to_the_carrier: 'table.enums.status.delivered_to_the_carrier',
  returned: 'table.enums.status.returned',
  cancelled: 'table.enums.status.cancelled',
}

const deliveryStepsBase = ref([
  {
    id: 0,
    name: 'table.enums.status.created',
    icon: '/icons/profile/ic_delivery_step_1.svg',
    iconInactive: '/icons/profile/ic_delivery_step_1_inactive.svg',
  },
  {
    id: 1,
    name: 'table.enums.status.in_preparation',
    icon: '/icons/profile/ic_delivery_step_2.svg',
    iconInactive: '/icons/profile/ic_delivery_step_2_inactive.svg',
  },
  {
    id: 2,
    name: 'table.enums.status.on_the_way',
    icon: '/icons/profile/ic_delivery_step_3.svg',
    iconInactive: '/icons/profile/ic_delivery_step_3_inactive.svg',
  },
  {
    id: 3,
    name: 'table.enums.status.delivered',
    icon: '/icons/profile/ic_delivery_step_delivered.svg',
    iconInactive: '/icons/profile/ic_delivery_step_delivered_inactive.svg',
  },
  {
    id: 4,
    name: 'table.enums.status.delivered_to_the_carrier',
    icon: '/icons/profile/ic_delivery_step_delivered.svg',
    iconInactive: '/icons/profile/ic_delivery_step_delivered.svg',
  },
  {
    id: 5,
    name: 'table.enums.status.returned',
    icon: '/icons/profile/ic_delivery_step_back.svg',
    iconInactive: '/icons/profile/ic_delivery_step_back.svg',
  },
  {
    id: 6,
    name: 'table.enums.status.cancelled',
    icon: '/icons/profile/ic_delivery_step_6.svg',
    iconInactive: '/icons/profile/ic_delivery_step_6.svg',
  },
  {
    id: 7,
    name: 'table.enums.status.pending_payment',
    icon: '/icons/profile/ic_delivery_step_6.svg',
    iconInactive: '/icons/profile/ic_delivery_step_6.svg',
  },
])

const deliverySteps = computed(() => {
  if (!order.value?.tracking?.length) return []

  return order.value.tracking
    .map((track) => {
      const mappedName = statusMap[track.statusOrder]
      if (!mappedName) return null

      const baseStep = deliveryStepsBase.value.find(
        (step) => step.name === mappedName,
      )
      if (!baseStep) return null

      return {
        ...baseStep,
        date: useFormatDate(track.createdAt, 'date-table'),
      }
    })
    .filter(Boolean)
})

const getPaymentStatusClass = (status) => {
  const statusClasses = {
    pending: 'tw-text-[#FC7007]',
    paid: 'tw-text-[#36A815]',
    refunded: 'tw-text-[#15A864]',
    rejected: 'tw-text-[#FF5D5D]',
  }
  return statusClasses[status] || ''
}

const getStepStyle = (stepId) =>
  stepId === 0 ? 'step-active' : 'step-inactive'

const getStepIcon = (stepId) => {
  const steps = deliverySteps.value
  const index = steps.length - 1 - stepId
  return stepId === 0 ? steps[index].icon : steps[index].iconInactive
}
const changeDeliveryDate = async (_Date: '') => {
  useLoading(true)
  const response = await ordersStore.changeOrderDate(props.deliveryId, {
    nextDelivery: _Date,
  })
  if (response.status && response.code === 100) {
    useShowAlert({
      type: 'success',
      message: response.message,
    })
    datePickerOpen.value = false
    await ordersStore.getOneOrder(Number(props.deliveryId))
  } else {
    useShowAlert({
      type: 'error',
      message: response.message,
    })
  }
  useLoading(false)
}
const updateCustomer = async (data) => {
  useLoading(true)

  const formData = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    identification: data.document,
    documentTypeId: data.documentType,
    typePerson: data.personType,
    localeCode: data.localeCode,
  }
  const response = await ordersStore.updateUserDetails(
    formData,
    props.deliveryId,
  )
  if (response.status && response.code === 100) {
    useShowAlert({
      type: 'success',
      message: response.message,
    })
    clientInformationDialog.value = false
    await ordersStore.getOneOrder(Number(props.deliveryId))
  } else {
    useShowAlert({
      type: 'error',
      message: response.message,
    })
  }
  useLoading(false)
}
const updateAddress = async (data) => {
  useLoading(true)
  const formData = {
    orderId: Number(props.deliveryId),
    address: data.shippingAddress
      ? data.shippingAddress
      : data.address?.includes('Cra,')
        ? data.address
        : data.address?.split(',')[0].trim(),
    complement: data.complement,
    cityId: data.city,
  }
  const response = await ordersStore.updateAddress(formData)
  if (response.status && response.code === 100) {
    useShowAlert({
      type: 'success',
      message: response.message,
    })
    openEditShipping.value = false
    await ordersStore.getOneOrder(Number(props.deliveryId))
  } else {
    useShowAlert({
      type: 'error',
      message: response.message,
    })
  }
  useLoading(false)
}

const handleOpenAddressDialog = async () => {
  useLoading(true)
  if (useSearchItemJson('statusPayment', order.value) === 'paid') {
    openEditShipping.value = true
    useLoading(false)

    return
  }
  await addressStore.getListAddress()
  showAddressDialog.value = true
  useLoading(false)
}

const handleAddressDialogClose = () => {
  showAddressDialog.value = false
  addressActive.value = 0
}

const selectAddress = (id) => {
  addressActive.value = id
}

const openAddressCreationDialog = () => {
  showAddressDialog.value = false
  openEditShipping.value = true
}

const handleAddressPredetermination = async () => {
  if (addressActive.value === 0) return
  const selectedAddress = address.value.find(
    (add) => add.id === addressActive.value,
  )
  if (selectedAddress) {
    const formattedData = {
      city: selectedAddress.cities.id,
      shippingAddress: selectedAddress.address,
      complement: selectedAddress.complement,
    }
    await updateAddress(formattedData)
    showAddressDialog.value = false
  }
}

onMounted(() => {
  nextTick(async () => {
    loading.value = true
    if (props.deliveryId) {
      await ordersStore.getOneOrder(Number(props.deliveryId))
    }
    loading.value = false
  })
})
</script>

<template>
  <div v-if="!loading" class="lg:tw-pl-[7%]">
    <h1 class="title primary1 !tw-text-[32px] tw-my-10">
      {{ $t('profile.myDeliveries.detail.id', { data: props.deliveryId }) }}
    </h1>
    <div class="tw-flex lg:tw-gap-20 max-lg:tw-gap-10 max-lg:tw-flex-col">
      <div class="delivery-steps">
        <div
          v-for="(step, index) in [...deliverySteps].reverse()"
          :key="step.id"
          class="step"
        >
          <div :class="['step-img', getStepStyle(index)]">
            <img
              :src="getStepIcon(index)"
              :alt="`delivery_state_${index + 1}`"
              width="33"
              height="33"
            />
          </div>
          <div class="step-text">
            <span>{{ $t(step.name) }}</span>
            <p>{{ step.date }}</p>
          </div>
        </div>
      </div>

      <div class="my-delivery-card">
        <span class="general-date form tw-mb-4">
          <label for="date">{{ $t('profile.myDeliveries.delivery') }}</label>
          <span class="general-input form-group disabled" style="width: 350px">
            <InputGroup iconPosition="right">
              <IconField class="w-full">
                <InputText
                  disabled
                  :placeholder="useFormatDate(currentDate, 'date-table')"
                />
                <InputIcon v-if="isEditable && !isDeliveryDateValid">
                  <Button
                    class="app-general-button app-btn-transparent label-primary p-0"
                    :label="$t('button.change')"
                    @click="datePickerOpen = true"
                /></InputIcon>
              </IconField>
            </InputGroup>
          </span>
        </span>
        <h3
          class="tw-font-treble-bold tw-text-[14px] tw-mb-5 tw-text-[#25282B]"
        >
          {{ $t('profile.myDeliveries.detail.deliveryInfo') }}
        </h3>

        <div class="header-plan-card">
          <h3>
            {{ useFormatPrice(order.total) }} /
            <span class="tw-text-[14px] tw-font-normal">{{
              order.frequency
            }}</span>
          </h3>
        </div>

        <div class="content-plan-card">
          <div class="customer-info-section">
            <div class="tw-flex tw-mb-2 tw-justify-between">
              <div class="tw-flex tw-gap-2">
                <img
                  :src="
                    useSearchItemJson('user.photoUrl', order)
                      ? useSearchItemJson('user.photoUrl', order)
                      : '/icons/profile/ic_user_fill.svg'
                  "
                  alt="user-icon"
                  class="tw-mt-1"
                  :class="
                    useSearchItemJson('user.photoUrl', order)
                      ? 'tw-w-[38px] tw-h-[38px]'
                      : 'tw-w-[20px] tw-h-[20px]'
                  "
                />
                <div class="tw-flex tw-flex-col">
                  <p class="customer-principal-info">
                    {{ useSearchItemJson('name', order) }}
                  </p>
                  <p class="tw-text-[14px] tw-text-[#575E6B]">
                    {{ useSearchItemJson('email', order) }}
                  </p>
                  <p class="tw-text-[13px] tw-text-[#575E6B]">
                    {{ useSearchItemJson('phone', order) }}
                  </p>
                  <p
                    v-if="useSearchItemJson('user.typePerson', order)"
                    class="tw-text-[13px] tw-text-[#575E6B]"
                  >
                    {{
                      $t(
                        `table.enums.person.${useSearchItemJson('user.typePerson', order)}`,
                      )
                    }}
                    -
                    {{ useSearchItemJson('user.documentType.alias', order) }}
                    {{ useSearchItemJson('identification', order) }}
                  </p>
                </div>
              </div>
              <div class="tw-flex tw-justify-end">
                <Button
                  v-if="isEditable"
                  class="app-general-button app-btn-transparent tw-h-[25px] !tw-p-0 !tw-mr-0"
                  @click="clientInformationDialog = true"
                >
                  <img
                    class="pt-1"
                    src="/icons/ic_edit_fill.svg"
                    alt="ic_edit"
                  />
                </Button>
              </div>
            </div>

            <div class="tw-flex tw-justify-between tw-mb-2">
              <div class="tw-flex tw-gap-2">
                <div
                  class="tw-items-center tw-flex"
                  :class="{
                    'tw-w-[38px] tw-h-[38px] tw-flex tw-justify-center':
                      useSearchItemJson('photoUrl', order),
                  }"
                >
                  <img
                    src="/icons/profile/ic_location_line.svg"
                    alt="location-icon"
                    class="tw-mt-1 tw-w-[20px] tw-h-[20px]"
                  />
                </div>
                <div>
                  <p class="customer-principal-info">
                    {{
                      useSearchItemJson('address', order) +
                      ', ' +
                      useSearchItemJson('cities.name', order) +
                      ', ' +
                      useSearchItemJson('cities.cityGroup.name', order)
                    }}
                  </p>
                  <p
                    v-if="useSearchItemJson('complement', order)"
                    class="tw-text-[13px] tw-text-[#575E6B]"
                  >
                    {{ useSearchItemJson('complement', order) }}
                  </p>
                </div>
              </div>
              <div class="tw-flex tw-justify-end">
                <Button
                  v-if="isEditable"
                  class="app-general-button app-btn-transparent tw-h-[25px] !tw-p-0 !tw-mr-0"
                  @click="handleOpenAddressDialog"
                >
                  <img
                    class="pt-1"
                    src="/icons/ic_edit_fill.svg"
                    alt="ic_edit"
                  />
                </Button>
              </div>
            </div>

            <div class="tw-flex tw-justify-between tw-items-center">
              <div class="tw-flex tw-gap-2 tw-items-center">
                <div
                  class="tw-items-center tw-flex"
                  :class="{
                    'tw-w-[38px] tw-h-[38px] tw-flex tw-justify-center':
                      useSearchItemJson('photoUrl', order),
                  }"
                >
                  <img
                    src="/icons/profile/ic_credit_card.svg"
                    alt="credit_card"
                    class="tw-mt-1 tw-w-[20px] tw-h-[20px]"
                  />
                </div>
                <p class="customer-principal-info">
                  **** {{ useSearchItemJson('lastFour', order) }}
                </p>
              </div>
              <span
                :class="
                  getPaymentStatusClass(
                    useSearchItemJson('statusPayment', order),
                  )
                "
              >
                {{
                  $t(
                    `table.enums.paymentStatus.${useSearchItemJson('statusPayment', order)}`,
                  )
                }}
              </span>
            </div>
            <Button
              v-if="useSearchItemJson('statusPayment', order) === 'rejected'"
              class="app-general-button btn-solo-create !tw-w-[175px]"
              :label="$t('button.retry')"
              @click="
                router.push(
                  localePath({
                    name: 'payment-pay-id',
                    params: { id: props.deliveryId?.toString() },
                  }),
                )
              "
            />
          </div>
        </div>
      </div>

      <div class="summary-section-plan-detail">
        <h3
          class="tw-font-treble-bold tw-text-[14px] tw-mb-5 tw-text-[#25282B]"
        >
          {{ $t('profile.myDeliveries.detail.summary') }}
        </h3>

        <div class="summary-content">
          <div class="tw-flex tw-justify-end tw-mb-3">
            <Button
              v-if="isEditable"
              class="app-general-button app-btn-transparent tw-h-[25px] !tw-p-0 !tw-mr-0"
              @click="
                router.push(
                  localePath({
                    name: 'profile-my-deliveries-id-edit',
                    params: { id: props.deliveryId?.toString() },
                  }),
                )
              "
            >
              <img class="pt-1" src="/icons/ic_edit_fill.svg" alt="ic_edit" />
            </Button>
          </div>
          <div
            v-for="(pet, index) in order.orderDetail"
            :key="index"
            class="pet-order"
          >
            <div class="pet-info">
              <p class="pet-name">{{ useSearchItemJson('pet', pet) }}</p>
              <p class="pet-price">
                {{ useFormatPrice(useSearchItemJson('price', pet)) }}
              </p>
            </div>
            <p class="pet-amount">
              {{ useSearchItemJson('idealPortion', pet) }}
            </p>

            <div class="flavors-section">
              <div class="flavors-header">
                <span class="general-accordion products-accordion">
                  <Accordion
                    expandIcon="pi pi-angle-down"
                    collapse-icon="pi pi-angle-up"
                  >
                    <AccordionTab>
                      <template #header>
                        <span class="tw-text-primary tw-text-[12px]">
                          {{
                            $t(
                              `create.main.content.4.orderSummary.${pet.detailProducts.length > 1 ? 'quantities' : 'quantity'}`,
                              {
                                data: pet.detailProducts.length,
                              },
                            )
                          }}
                        </span>
                      </template>

                      <div class="tw-text-[#575E6B] tw-text-[12px]">
                        <ul>
                          <li
                            v-for="(product, subIndex) in pet.detailProducts"
                            :key="subIndex"
                          >
                            x{{ product.numberOfPackages }} {{ product.name }}
                          </li>
                        </ul>
                      </div>
                    </AccordionTab>
                  </Accordion>
                </span>
              </div>
            </div>
          </div>

          <div class="order-totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>{{ useFormatPrice(order.subtotal) }}</span>
            </div>
            <div v-if="order.discount > 0" class="total-row">
              <span>Descuento</span>
              <span v-if="order.discount" class="tw-text-[#3DB5E6]">
                - {{ useFormatPrice(order.discount) }}
              </span>
            </div>
            <div class="total-row">
              <span>Envío</span>
              <span>{{ useFormatPrice(order.shipping) }}</span>
            </div>
            <div class="total-row">
              <span>IVA</span>
              <span>{{ useFormatPrice(order.iva) }}</span>
            </div>
            <div class="total-row tw-font-treble-bold tw-text-[#1A1A29]">
              <span>Total</span>
              <span>{{ useFormatPrice(order.total) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <GeneralInlineDatePicker
      v-if="datePickerOpen"
      :currentDate="currentDate"
      @closeModal="datePickerOpen = false"
      @delivery-changed="changeDeliveryDate"
    />
    <GeneralDialogEditUserOder
      v-if="clientInformationDialog"
      :client="order"
      :disabled="true"
      @closeModal="clientInformationDialog = false"
      @sendData="updateCustomer"
    />
    <GeneralDialogCreateAddress
      v-model:show="openEditShipping"
      :isForOrder="true"
      :blockCitiesSelection="!canEditCities"
      :cityId="useSearchItemJson('cities.cityGroup.id', order)"
      :municipalityId="useSearchItemJson('cities.id', order)"
      :address="useSearchItemJson('address', order)"
      :complement="useSearchItemJson('complement', order)"
      @address-created="updateAddress"
      @back-to-list="openEditShipping = false"
    />
    <GeneralDialog
      :show="showAddressDialog"
      width="450px"
      @close="handleAddressDialogClose"
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

          <div class="tw-flex tw-mt-11 tw-w-full tw-justify-end tw-gap-2">
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
  </div>
</template>
<style scoped lang="scss">
.delivery-steps {
  @apply tw-flex lg:tw-flex-col tw-gap-5 max-lg:tw-overflow-y-auto;
  position: relative;

  .step {
    @apply tw-flex tw-gap-5 tw-relative tw-mb-5;
    z-index: 1;

    .step-img {
      @apply lg:tw-mr-5 tw-w-[55px] tw-h-[55px] tw-rounded-full tw-flex tw-items-center tw-justify-center;
      border: 1px solid transparent;
      position: relative;

      &.step-active {
        background-color: #cddef5;
        border-color: #cddef5;
      }

      &.step-inactive {
        background-color: rgb(224, 229, 240);
        border-color: #e0e5f0;
      }
    }

    &:not(:last-child) .step-img::after {
      @apply lg:tw-left-[50%];
      content: '';
      background-image: url('/icons/profile/arrowhead-left.svg');
      position: absolute;
      transform: translateX(-50%);
      width: 15px;
      height: 15px;
    }

    &:not(:last-child) .step-img::before {
      @apply lg:tw-top-[100%];
      margin-top: 6px;
    }

    &:not(:last-child) .step-img::after {
      top: calc(100% + 6px);
      margin-top: 6px;
      @apply max-lg:tw-top-[10px] max-lg:tw-left-[200px] max-lg:-tw-rotate-90;
    }

    .step-text {
      @apply tw-flex tw-flex-col tw-gap-1;
      @apply tw-w-[130px];
      span {
        @apply tw-text-[#25282B] tw-font-treble-bold tw-text-[14px];
      }

      p {
        @apply tw-text-[14px];
      }
    }
  }
}

.my-delivery-card {
  @apply tw-min-w-[350px];

  .header-plan-card {
    @apply tw-p-5;
    border-radius: 14px 14px 0 0;
    background-color: #e5ebf1;

    h3 {
      @apply tw-text-primary tw-text-[20px] tw-font-treble-bold;
    }

    p {
      @apply tw-text-primary tw-text-[14px] tw-font-treble-book;
    }
  }

  .content-plan-card {
    @apply tw-pb-0 tw-bg-white tw-rounded-b-xl;

    .customer-info-section {
      @apply tw-p-5 tw-space-y-4;

      .customer-principal-info {
        @apply tw-text-[14px] tw-font-treble-bold tw-text-[#25282B];
      }
    }
  }

  .payment-badge {
    @apply tw-px-3 tw-py-1 tw-font-treble-book tw-text-[#36A815] tw-text-[14px];
  }
}

.summary-section-plan-detail {
  @apply tw-w-full lg:tw-max-w-[400px] tw-mb-10;

  .summary-header {
    @apply tw-p-4 tw-bg-gray-100;

    h3 {
      @apply tw-text-primary tw-font-treble-bold tw-text-[18px];
    }
  }

  .summary-content {
    @apply tw-p-4 tw-bg-white tw-rounded-lg;

    .pet-order {
      @apply tw-mb-6 tw-pb-4 tw-border-b tw-border-gray-200;

      .pet-info {
        @apply tw-flex tw-justify-between tw-mb-1;

        .pet-name {
          @apply tw-font-treble-bold tw-text-[16px] tw-text-[#25282B];
        }

        .pet-price {
          @apply tw-font-treble-bold tw-text-[14px];
        }
      }

      .pet-amount {
        @apply tw-text-[12px] tw-text-primary tw-mb-2 tw-font-treble-book;
      }

      .flavors-section {
        @apply tw-mt-2;

        .flavors-header {
          @apply tw-flex tw-cursor-pointer tw-text-[12px] tw-text-primary tw-gap-1 tw-items-center;
        }

        .flavors-list {
          @apply tw-mt-2;

          ul {
            @apply tw-text-[12px] tw-text-[#575E6B];

            li {
              @apply tw-mb-1;
            }
          }
        }
      }
    }

    .order-totals {
      @apply tw-mt-4;

      .total-row {
        @apply tw-flex tw-justify-between tw-py-2 tw-text-[#575E6B] tw-text-[14px];

        &:last-child {
          @apply tw-pt-4 tw-mt-2 tw-border-t tw-border-gray-200 tw-text-[#1A1A29];
        }
      }
    }
  }
}

.checkout-plan-card {
  @apply tw-flex tw-flex-row tw-items-center tw-py-5 tw-cursor-pointer;
  border-bottom: 1px solid #8ba0c9;

  .name {
    @apply tw-text-[12px] tw-font-treble-bold tw-text-[#1A1A29];
  }
}
</style>
