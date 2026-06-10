<script setup lang="ts">
const emit = defineEmits(['update:model-value'])

const addressStore = useAddressStore()
const { getAllMyAddresses: addresses } = storeToRefs(addressStore)

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const openPanels = ref([])
const showUpdateDialog = ref(false)
const showDeleteDialog = ref(false)
const showCreateDialog = ref(false)
const isPrerdetermined = ref(false)
const deleteAddressId = ref(0)
const localePath = useLocalePath()
// Computed para determinar el estado basado en query params
const addressId = computed(() => {
  const id = route.query.id
  return id ? parseInt(id as string) : null
})

const isEditMode = computed(() => addressId.value !== null)
const isCreating = computed(() => addressId.value === 0)
const isEditing = computed(() => addressId.value && addressId.value > 0)

const setPanelRef = (el, index) => {
  if (el) {
    openPanels.value[index] = el
  }
}

const openMenu = (event, index) => {
  if (openPanels.value[index]) {
    openPanels.value[index].toggle(event)
  }
}

const confirmDeactivation = async () => {
  useLoading(true)
  const response = await addressStore.deleteAddressById(deleteAddressId.value)
  if (response.status && response.code === 100) {
    useShowAlert({
      type: 'success',
      message: response.message,
    })
    await getListAddress()
    showUpdateDialog.value = false
    deleteAddressId.value = 0
  } else {
    useShowAlert({
      type: 'error',
      message: response.message,
    })
  }
  useLoading(false)
}

const closeMenu = (index) => {
  if (openPanels.value[index]) {
    openPanels.value[index].hide()
  }
}

const handleEdit = async (id: number) => {
  await router.push({
    query: {
      ...route.query,
      id: id.toString(),
    },
  })
  emit('update:model-value', true)
}

const handleCreate = async () => {
  await router.push({
    query: {
      ...route.query,
      id: '0',
    },
  })
  emit('update:model-value', true)
  cancelDeactivation()
}

const handleDelete = (
  valueId: number,
  predetermined: boolean,
  index: number,
) => {
  closeMenu(index)
  if (addresses.value.length === 1) {
    showCreateDialog.value = true
  } else {
    if (predetermined === true) {
      showDeleteDialog.value = true
    } else {
      isPrerdetermined.value = predetermined
      showUpdateDialog.value = true
      deleteAddressId.value = valueId
    }
  }
}

// Volver a la lista (limpiar query params)
const backToList = async () => {
  await router.push(localePath({ name: 'profile-my-adresses' }))
  emit('update:model-value', false)
  await getListAddress()
}

const updateAddressStatus = async (valueId: number, index: number) => {
  useLoading(true)
  closeMenu(index)
  const response = await addressStore.updateAddressStatus(valueId)
  if (response.status && response.code === 100) {
    useShowAlert({
      type: 'success',
      message: response.message,
    })
    await getListAddress()
  } else {
    useShowAlert({
      type: 'error',
      message: response.message,
    })
  }
  useLoading(false)
}

const getListAddress = async () => {
  useLoading(true)
  await addressStore.getListAddress()
  useLoading(false)
}

const listRoutes = computed(() => [
  {
    text: t('profile.myAddresses.mine'),
    action: backToList,
  },
  {
    text: isEditing.value
      ? t('profile.myAddresses.edit')
      : t('profile.myAddresses.new'),
    url: route.fullPath,
  },
])

const cancelDeactivation = () => {
  showCreateDialog.value = false
  showDeleteDialog.value = false
  showUpdateDialog.value = false
  isPrerdetermined.value = false
}

const handleCloseEdit = async () => {
  await backToList()
}

onMounted(() => {
  nextTick(async () => {
    await getListAddress()
  })
})
</script>

<template>
  <div class="my-plan-page">
    <div
      v-if="addresses?.length === 0 && !isEditMode"
      class="empty-plan-page tw-mt-[5rem]"
    >
      <img
        src="/icons/profile/ic_location_line_big.svg"
        alt="location_ic"
        width="65px"
        height="80px"
      />
      <p class="tw-text-[12px] tw-text-[#8BA0C9] tw-w-[336px] tw-text-center">
        {{ $t('profile.myAddresses.empty') }}
      </p>
      <Button
        @click="handleCreate"
        class="app-general-button btn-solo-login !tw-w-[210px]"
      >
        <i class="pi pi-plus"></i>
        {{ $t('profile.myAddresses.button') }}
      </Button>
    </div>

    <div
      v-if="addresses?.length > 0 && !isEditMode"
      class="tw-w-[100%] tw-max-w-[800px] tw-mt-20"
    >
      <h3 class="title primary1 !tw-text-[32px] tw-mb-10">
        {{ $t('profile.myAddresses.title') }}
      </h3>
      <span
        @click="handleCreate"
        class="tw-text-primary tw-text-[14px] tw-font-treble-regular lg:tw-float-end max-lg:tw-float-start tw-mb-5 tw-cursor-pointer"
      >
        <i class="pi pi-plus"></i>
        {{ $t('profile.myAddresses.button') }}
      </span>
      <div class="address-card">
        <div
          v-for="(address, index) in addresses"
          class="address-card-content"
          :key="index"
        >
          <div>
            <span
              class="tw-flex tw-text-[#25282B] tw-text-[14px] tw-font-treble-bold"
            >
              <img
                src="/icons/profile/ic_location_line.svg"
                alt="location_ic"
                width="14px"
                height="17px"
                class="tw-mr-2"
              />
              {{ address.address }}
            </span>
            <p class="tw-mt-2">
              {{
                address.complement
                  ? useTruncateText(address.complement, 30) +
                    ' - ' +
                    address?.cities?.name
                  : address?.cities?.name
              }}
            </p>
          </div>
          <div class="tw-flex tw-items-center">
            <span
              v-if="address.predetermined"
              class="tw-text-[#2B7EE2] tw-text-[12px] tw-mr-4 tw-font-treble-bold"
            >
              {{ $t('profile.myAddresses.default') }}
            </span>
            <div class="max-lg:tw-hidden">
              <i
                @click="openMenu($event, index)"
                class="pi pi-ellipsis-h"
                style="color: #003b71; cursor: pointer"
              ></i>
            </div>
            <OverlayPanel
              class="menu-responsive-header"
              :ref="(el) => setPanelRef(el, index)"
              appendTo="body"
            >
              <div class="menu">
                <span
                  @click="
                    handleDelete(address.id, address.predetermined, index)
                  "
                >
                  {{ $t('button.delete') }}
                </span>
                <span @click="handleEdit(address.id)">
                  {{ $t('button.edit') }}
                </span>
                <span
                  v-if="!address.predetermined"
                  @click="updateAddressStatus(address.id, index)"
                >
                  {{ $t('profile.myAddresses.panel.default') }}
                </span>
              </div>
            </OverlayPanel>
          </div>
          <div class="lg:tw-hidden tw-absolute tw-right-[15px] tw-top-1/2">
            <i
              @click="openMenu($event, index)"
              class="pi pi-ellipsis-h"
              style="color: #003b71; cursor: pointer"
            ></i>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isEditMode" class="lg:tw-px-20 tw-mt-[2rem]">
      <GeneralBreadCrumb :routes="listRoutes" />
      <ProfileMyAdressesNew @close-edit="handleCloseEdit" />
    </div>

    <GeneralDialog :show="showUpdateDialog" @close="cancelDeactivation">
      <div class="tw-p-5 max-lg:!tw-h-[210px]">
        <span
          class="tw-text-[rgb(0,59,113)] tw-text-[20px] tw-font-treble-bold"
          >{{ $t('profile.myAddresses.dialog.title') }}</span
        >
        <div class="tw-mt-2">
          <p class="tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book">
            {{ $t('profile.myAddresses.dialog.message') }}
          </p>

          <div class="tw-flex tw-mt-11 tw-w-full tw-justify-end max-lg:tw-pb-3">
            <Button
              class="app-general-button app-btn-transparent"
              :label="$t('button.cancel')"
              @click="cancelDeactivation"
            />
            <Button
              class="app-general-button btn-solo-create"
              :label="$t('profile.myAddresses.dialog.button')"
              autofocus
              @click="confirmDeactivation"
            />
          </div>
        </div>
      </div>
    </GeneralDialog>

    <GeneralDialog :show="showDeleteDialog" @close="cancelDeactivation">
      <div class="tw-p-5">
        <span class="tw-text-[#003B71] tw-text-[20px] tw-font-treble-bold">{{
          $t('profile.myAddresses.cannotDeleteDialog.title')
        }}</span>
        <div class="tw-mt-2">
          <p class="tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book">
            {{ $t('profile.myAddresses.cannotDeleteDialog.message') }}
          </p>

          <div class="tw-flex tw-mt-11 tw-w-full tw-flex-row-reverse">
            <Button
              class="app-general-button btn-solo-create"
              :label="$t('profile.myAddresses.cannotDeleteDialog.button')"
              autofocus
              @click="cancelDeactivation"
            />
          </div>
        </div>
      </div>
    </GeneralDialog>

    <GeneralDialog :show="showCreateDialog" @close="cancelDeactivation">
      <div class="tw-p-5">
        <span class="tw-text-[#003B71] tw-text-[20px] tw-font-treble-bold">{{
          $t('profile.myAddresses.createDialog.title')
        }}</span>
        <div class="tw-mt-2">
          <p class="tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book">
            {{ $t('profile.myAddresses.createDialog.message') }}
          </p>

          <div class="tw-flex tw-mt-11 tw-w-full tw-justify-end">
            <Button
              class="app-general-button app-btn-transparent"
              :label="$t('button.cancel')"
              @click="cancelDeactivation"
            />
            <Button
              class="app-general-button btn-solo-create !tw-w-[250px]"
              :label="$t('profile.myAddresses.createDialog.button')"
              autofocus
              @click="handleCreate"
            />
          </div>
        </div>
      </div>
    </GeneralDialog>
  </div>
</template>

<style lang="scss">
.address-card {
  @apply tw-w-[100%] tw-max-w-[800px] tw-rounded-2xl tw-flex tw-flex-col;
  background-color: #fff;
  .address-card-content {
    @apply tw-p-6 tw-flex tw-justify-between tw-w-[100%] tw-mx-auto tw-relative;
    @apply max-lg:tw-flex-col-reverse max-lg:tw-pr-10;
    &::after {
      content: '';
      width: 100%;
      left: 0;
      bottom: 0;
      position: absolute;
      display: flex;
      padding-left: 0;
      padding-right: 0;
      border-bottom: 1px solid #8ba0c9;
      opacity: 0.5;
    }
    &:last-child {
      &::after {
        @apply tw-hidden;
        content: '';
      }
    }
  }
}
</style>
