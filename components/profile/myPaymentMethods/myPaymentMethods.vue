<script setup lang="ts">
import type { ItemRoute } from '~/interfaces/item-route.interface'

const emit = defineEmits(['update:model-value'])

const cardStore = useCardStore()

const { getAllMyCards: cards } = storeToRefs(cardStore)

const { t } = useI18n()
const route = useRoute()
const openPanels = ref([])
const newAddress = ref(false)
const showUpdateDialog = ref(false)
const showDeleteDialog = ref(false)
const showCreateDialog = ref(false)
const cardId = ref(0)
const isPrerdetermined = ref(false)
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
  const response = await cardStore.deleteCard(cardId.value)
  if (response.status && response.code === 100) {
    useShowAlert({
      type: 'success',
      message: response.message,
    })
    getListCards()
    showUpdateDialog.value = false
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

const handleDelete = (
  valueId: number,
  predetermined: boolean,
  index: number,
) => {
  closeMenu(index)
  if (cards.value.length === 1) {
    showCreateDialog.value = true
  } else {
    if (predetermined === true) {
      showDeleteDialog.value = true
    } else {
      cardId.value = valueId
      isPrerdetermined.value = predetermined
      showUpdateDialog.value = true
    }
  }
}
const enableEditMode = () => {
  newAddress.value = true
  showCreateDialog.value = false

  emit('update:model-value', true)
}
const disabledEditMode = () => {
  useLoading(true)
  cardId.value = 0
  newAddress.value = false
  getListCards()
  emit('update:model-value', false)
  useLoading(false)
}
const updateCardStatus = async (valueId: number, index: number) => {
  useLoading(true)
  closeMenu(index)
  const response = await cardStore.markCard(valueId)
  if (response.status && response.code === 100) {
    useShowAlert({
      type: 'success',
      message: response.message,
    })
    getListCards()
  } else {
    useShowAlert({
      type: 'error',
      message: response.message,
    })
  }
  useLoading(false)
}
const getListCards = async () => {
  useLoading(true)
  const response = await cardStore.getCards()

  useLoading(false)
}
const listRoutes: ItemRoute[] = [
  {
    text: t('profile.myPaymentMethods.title'),
    action: disabledEditMode,
  },
  {
    text: t('profile.myPaymentMethods.button'),
    url: route.fullPath,
  },
]
const cancelDeactivation = () => {
  showCreateDialog.value = false
  showDeleteDialog.value = false
  showUpdateDialog.value = false
  isPrerdetermined.value = false
  cardId.value = 0
}

onMounted(() => {
  nextTick(async () => {
    getListCards()
  })
})
</script>

<template>
  <div class="my-plan-page">
    <div
      v-if="!newAddress && cards.length === 0"
      class="empty-plan-page tw-mt-[2rem]"
    >
      <img
        src="/icons/profile/ic_my_plan.svg"
        alt="dog-icon"
        width="128px"
        height="127px"
      />
      <p class="tw-text-[12px] tw-text-[#8BA0C9] tw-w-[336px] tw-text-center">
        {{ $t('profile.myPaymentMethods.empty') }}
      </p>
      <Button
        @click="enableEditMode"
        class="app-general-button btn-solo-login !tw-w-[260px]"
      >
        <i class="pi pi-plus"></i>
        {{ $t('profile.myPaymentMethods.button') }}
      </Button>
    </div>
    <div
      v-if="!newAddress && cards.length > 0"
      class="tw-w-[100%] tw-max-w-[800px] tw-mt-20"
    >
      <h3 class="title primary1 !tw-text-[32px] tw-mb-10">
        {{ $t('profile.myPaymentMethods.title') }}
      </h3>
      <span
        @click="enableEditMode"
        class="tw-text-primary tw-text-[14px] tw-font-treble-regular lg:tw-float-end max-lg:tw-float-start tw-mb-5 tw-cursor-pointer"
      >
        <i class="pi pi-plus"></i>
        {{ $t('profile.myPaymentMethods.button') }}
      </span>
      <div class="address-card">
        <div
          v-for="(card, index) in cards"
          :key="index"
          class="address-card-content"
        >
          <div>
            <span
              class="tw-flex tw-text-[#25282B] tw-text-[14px] tw-font-treble-bold"
            >
              <img
                src="/icons/profile/ic_credit_card.svg"
                alt="card_ic"
                width="14px"
                height="17px"
                class="tw-mr-2"
              />
              {{ card.cardName }}
            </span>
            <p class="tw-mt-2">**** {{ card.lastFour }}</p>
          </div>
          <div class="tw-flex tw-items-center">
            <span
              v-if="card.predetermined"
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
                <span @click="handleDelete(card.id, card.predetermined, index)">
                  {{ $t('profile.myAddresses.panel.delete') }}
                </span>

                <span
                  v-if="!card.predetermined"
                  @click="updateCardStatus(card.id, index)"
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
    <div v-if="newAddress" class="lg:tw-px-20 tw-mt-[2rem]">
      <GeneralBreadCrumb :routes="listRoutes" />
      <ProfileMyPaymentMethodsNew @close-edit="disabledEditMode" />
    </div>
    <GeneralDialog :show="showUpdateDialog" @close="cancelDeactivation">
      <div class="tw-p-5 !tw-h-[210px]">
        <span class="tw-text-[#003B71] tw-text-[20px] tw-font-treble-bold">{{
          $t('profile.myPaymentMethods.dialog.title')
        }}</span>
        <div class="tw-mt-2">
          <p class="tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book">
            {{ $t('profile.myPaymentMethods.dialog.message') }}
          </p>

          <div class="tw-flex tw-mt-11 tw-justify-end">
            <Button
              class="app-general-button app-btn-transparent"
              :label="$t('button.cancel')"
              @click="cancelDeactivation"
            />
            <Button
              class="app-general-button btn-solo-create"
              :label="$t('profile.myPaymentMethods.dialog.button')"
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
          $t('profile.myPaymentMethods.cannotDeleteDialog.title')
        }}</span>
        <div class="tw-mt-2">
          <p class="tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book">
            {{ $t('profile.myPaymentMethods.cannotDeleteDialog.message') }}
          </p>

          <div class="tw-flex tw-mt-11 tw-w-full tw-flex-row-reverse">
            <Button
              class="app-general-button btn-solo-create"
              :label="$t('profile.myPaymentMethods.cannotDeleteDialog.button')"
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
          $t('profile.myPaymentMethods.createDialog.title')
        }}</span>
        <div class="tw-mt-2">
          <p class="tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book">
            {{ $t('profile.myPaymentMethods.createDialog.message') }}
          </p>

          <div class="tw-flex tw-mt-11 tw-w-full tw-justify-end">
            <Button
              class="app-general-button app-btn-transparent"
              :label="$t('button.cancel')"
              @click="cancelDeactivation"
            />
            <Button
              class="app-general-button btn-solo-create !tw-w-[250px]"
              :label="$t('profile.myPaymentMethods.createDialog.button')"
              autofocus
              @click="enableEditMode"
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
