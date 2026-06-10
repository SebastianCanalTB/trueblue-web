<script setup lang="ts">
const onboardingStore = useOnboardingStore()
const { getLoginUser: user } = storeToRefs(onboardingStore)
const accountStore = useAccountStore()
const { getProfileInformation: profile } = storeToRefs(accountStore)
const logoutDialog = ref(false)
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()

const planStore = usePlanStore()
const orderStore = useOrderStore()
const { getAllMyPlan: plans, getAllHolyDays: holyDates } =
  storeToRefs(planStore)
const { getAllMyOrders: orders } = storeToRefs(orderStore)
const showNewOrderDialog = ref(false)
const datePickerOpen = ref(false)
const isEditingPlanDate = ref(false)
const selectedOrderForDate = ref<any>(null)
const selectedOrderForAddress = ref<any>(null)
const openEditShipping = ref(false)
const addressStore = useAddressStore()

const holyDatesSet = computed(
  () => new Set(holyDates.value.map((h) => h.dates)),
)
const canEditCities = computed(() => {
  const order = selectedOrderForAddress.value || selectedOrderForDate.value
  if (!order) return false
  return ['rejected', 'pending', 'pending_payment'].includes(
    order.statusPayment,
  )
})
const isBusinessDay = (date: Date) => {
  const day = date.getDay()

  // fin de semana (solo domingo es no hábil para entrega según requerimiento)
  if (day === 0) return false

  const formatted = date.toISOString().split('T')[0]

  // festivo
  if (holyDatesSet.value.has(formatted)) return false

  return true
}
const getNextBusinessDay = () => {
  let date = new Date()
  date.setDate(date.getDate() + 1) // empezamos desde mañana

  while (!isBusinessDay(date)) {
    date.setDate(date.getDate() + 1)
  }

  return date
}

const nextBusinessDay = getNextBusinessDay()
const showUpdateDialog = ref(false)
const tempCheck = ref(false)
const check = ref(plans?.value?.status === 'active')

const handleToggle = async () => {
  if (check.value) {
    check.value = true
    changeStatus()
    showUpdateDialog.value = false
  } else {
    showUpdateDialog.value = true
  }
}

const cancelDeactivation = () => {
  check.value = true
  showUpdateDialog.value = false
}

const changeStatus = async ($event?: any) => {
  useLoading(true)
  const response = await planStore.changeStatus({
    reasonToInactiveId: $event?.reasonId ?? 0,
    description: $event?.cancelReason ?? '',
  })
  if (response.status && response.code === 100) {
    useShowAlert({
      type: 'success',
      message: response.message,
    })
    await planStore.getListPlan()
  } else {
    useShowAlert({
      type: 'error',
      message: response.message,
    })
  }
  useLoading(false)
}

const confirmDeactivation = async ($event) => {
  check.value = tempCheck.value
  changeStatus($event)
  showUpdateDialog.value = false
}

const confirmNewOrder = async () => {
  useLoading(true)
  const response = await orderStore.createOrder({ planId: plans.value.id })
  if (response.status && response.code === 100) {
    useShowAlert({
      type: 'success',
      message: response.message,
    })
    router.push(
      localePath({
        name: 'profile-my-deliveries',
      }),
    )
  } else {
    useShowAlert({
      type: 'error',
      message: response.message,
    })
  }
  useLoading(false)
  showNewOrderDialog.value = false
}

watch(
  () => plans.value?.status,
  (newStatus) => {
    check.value = newStatus === 'active'
  },
)

const getProfileInformation = async () => {
  useLoading(true)
  const result = await accountStore.getProfile()
  if (useSearchItemJson('type', user.value) !== 'vet') {
    await planStore.getListPlan()
    await planStore.getNonShippingDate()
    await orderStore.getOrders({
      filter: '',
      statusOrder: '',
      limit: 5,
      offset: 0,
      someStates: true,
    })
  }
  useLoading(false)
}
const enableEditMode = () => {
  router.push(localePath({ name: 'profile-my-profile-edit' }))
}
const logout = async () => {
  useLoading(true)
  const result = await onboardingStore.logout()
  if (result.status && result.code === 100) {
    window.location.href = localePath({ name: 'index' })
  }
  useLoading(false)
}

const handleEditOrderDate = (order) => {
  selectedOrderForDate.value = order
  isEditingPlanDate.value = false
  datePickerOpen.value = true
}

const handleEditPlanDate = () => {
  isEditingPlanDate.value = true
  datePickerOpen.value = true
}

const handleEditOrderAddress = (order) => {
  selectedOrderForAddress.value = order
  openEditShipping.value = true
}

const handleEditOrderDiet = (order) => {
  router.push(
    localePath({
      name: 'profile-my-deliveries-id-edit',
      params: { id: order.id },
    }),
  )
}

const changeDeliveryDate = async (_Date: string) => {
  useLoading(true)
  if (isEditingPlanDate.value) {
    const response = await planStore.updateMyNextDelivery(plans.value.id, {
      nextDelivery: _Date,
    })
    if (response.status && response.code === 100) {
      useShowAlert({ type: 'success', message: response.message })
      datePickerOpen.value = false
      await planStore.getListPlan()
    } else {
      useShowAlert({ type: 'error', message: response.message })
    }
  } else {
    const response = await orderStore.changeOrderDate(
      selectedOrderForDate.value.id,
      { nextDelivery: _Date },
    )
    if (response.status && response.code === 100) {
      useShowAlert({ type: 'success', message: response.message })
      datePickerOpen.value = false
      await getProfileInformation()
    } else {
      useShowAlert({ type: 'error', message: response.message })
    }
  }
  useLoading(false)
}

const updateAddress = async (data) => {
  useLoading(true)
  const formData = {
    orderId: Number(selectedOrderForAddress.value.id),
    address: data.shippingAddress
      ? data.shippingAddress
      : data.address?.includes('Cra,')
        ? data.address
        : data.address?.split(',')[0].trim(),
    complement: data.complement,
    cityId: data.city,
  }
  const response = await orderStore.updateAddress(formData)
  if (response.status && response.code === 100) {
    useShowAlert({ type: 'success', message: response.message })
    openEditShipping.value = false
    await getProfileInformation()
  } else {
    useShowAlert({ type: 'error', message: response.message })
  }
  useLoading(false)
}

const handleCancelOrder = async (order) => {
  useLoading(true)
  const response = await orderStore.cancelOrder(order.id)
  if (response.status && response.code === 100) {
    useShowAlert({
      type: 'success',
      message: response.message,
    })
    await getProfileInformation()
  } else {
    useShowAlert({
      type: 'error',
      message: response.message,
    })
  }
  useLoading(false)
}

const handleRetryPayment = (order) => {
  router.push(
    localePath({
      name: 'payment-pay-id',
      params: { id: order.id },
    }),
  )
}
const goToOrderDetail = (order) => {
  router.push(
    localePath({
      name: 'profile-my-deliveries-id',
      params: { id: order.id },
    }),
  )
}
onMounted(() => {
  nextTick(async () => {
    await getProfileInformation()
  })
})
</script>

<template>
  <div class="my-account-page lg:tw-pr-20">
    <div
      class="tw-flex tw-justify-between tw-items-center tw-mb-5 lg:tw-mt-[5rem]"
    >
      <h2 class="title primary1 !tw-text-[32px]">
        {{
          $t('profile.welcome', {
            userName: useSearchItemJson('firstName', profile),
          })
        }}
      </h2>
      <Button
        class="app-general-button logout tw-w-[175px]"
        @click="logoutDialog = true"
        :label="$t('profile.account.logout')"
      />
    </div>

    <ProfileMyAccountSectionsVetInfo
      v-if="useSearchItemJson('type', user) === 'vet'"
      :profile="profile"
      @edit="enableEditMode"
    />
    <ProfileMyAccountSectionsOrderList
      v-else
      :orders="orders"
      :plan-status="plans.status"
      @edit-date="handleEditOrderDate"
      @edit-diet="handleEditOrderDiet"
      @edit-address="handleEditOrderAddress"
      @cancel-order="handleCancelOrder"
      @retry-payment="handleRetryPayment"
      @create-order="showNewOrderDialog = true"
      @go-to-detail="goToOrderDetail"
    />
    <ProfileMyAccountSectionsPlanInfo
      v-if="useSearchItemJson('type', user) !== 'vet'"
      v-model="check"
      :plans="plans"
      @handle-toggle="handleToggle"
      @edit-date="handleEditPlanDate"
      @add-pet="
        router.push(
          localePath({
            name: 'profile-my-plan-id',
            params: { id: useSearchItemJson('id', plans) },
            query: { addPet: 'true' },
          }),
        )
      "
      @edit-data="enableEditMode"
      @edit-plan="
        router.push(
          localePath({
            name: 'profile-my-plan-id',
            params: { id: useSearchItemJson('id', plans) },
          }),
        )
      "
      @create-order="showNewOrderDialog = true"
    />

    <LayoutsLoginLogout
      :dialog="logoutDialog"
      @logout="logout"
      @closeModal="logoutDialog = false"
    />

    <ProfileMyAccountSectionsNewOrderDialog
      :show="showNewOrderDialog"
      :plans="plans"
      :next-business-day="nextBusinessDay"
      @close="showNewOrderDialog = false"
      @confirm="confirmNewOrder"
      @change-payment-method="
        router.push(localePath({ name: 'profile-my-payment-methods' }))
      "
    />

    <ProfileMyAccountSectionsDeactivateDialog
      v-if="showUpdateDialog"
      :show="showUpdateDialog"
      @close="cancelDeactivation"
      @confirm="confirmDeactivation"
    />

    <GeneralInlineDatePicker
      v-if="datePickerOpen"
      :currentDate="
        isEditingPlanDate ? plans?.nextDelivery : selectedOrderForDate?.delivery
      "
      :isPlan="isEditingPlanDate"
      :maxDays="isEditingPlanDate ? 90 : 31"
      @closeModal="datePickerOpen = false"
      @delivery-changed="changeDeliveryDate"
    />

    <GeneralDialogCreateAddress
      v-model:show="openEditShipping"
      :isForOrder="true"
      :blockCitiesSelection="!canEditCities"
      :cityId="
        useSearchItemJson('cities.cityGroup.id', selectedOrderForAddress)
      "
      :municipalityId="useSearchItemJson('cities.id', selectedOrderForAddress)"
      :address="selectedOrderForAddress?.address"
      :complement="selectedOrderForAddress?.complement"
      @address-created="updateAddress"
      @back-to-list="openEditShipping = false"
    />
  </div>
</template>
<style scoped lang="scss">
.my-account-page {
  @apply tw-flex tw-flex-col tw-pb-10;
}
</style>
