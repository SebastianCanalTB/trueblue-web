<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  orders: any[]
  planStatus: string
}>()

const emit = defineEmits([
  'edit-date',
  'edit-diet',
  'edit-address',
  'cancel-order',
  'retry-payment',
  'create-order',
  'go-to-detail',
])

const menu = ref()
const { t } = useI18n()
const selectedOrder = ref()
const toggleEdit = (event, order) => {
  selectedOrder.value = order
  menu.value.toggle(event)
  nextTick(() => {
    if (menu.value.alignOverlay) {
      menu.value.alignOverlay()
    }
  })
}
const getStatusLabel = (order) => {
  if (order.statusPayment === 'rejected')
    return t('profile.myDeliveries.paymentRejected')
  return `${t(`table.enums.paymentStatus.${order.statusPayment}`)} · ${t(`table.enums.status.${order.statusOrder}`)}`
}

const getStatusClass = (order) => {
  if (
    order.statusPayment === 'paid' &&
    order.statusOrder === 'in_preparation'
  ) {
    return 'tw-bg-[rgba(54,168,21,0.1)] tw-text-[#36A815]'
  }
  if (order.statusPayment === 'pending') {
    return 'tw-bg-[#FFF4E5] tw-text-[#FC7007]'
  }
  if (order.statusPayment === 'rejected') {
    return 'tw-bg-[rgba(235,87,87,0.1)] tw-text-[#EB5757]'
  }
  if (order.statusPayment === 'paid' && order.statusOrder === 'on_the_way') {
    return 'tw-bg-[#E8F2FF] tw-text-[#003B71]'
  }
  return 'tw-bg-gray-100 tw-text-gray-600'
}

const getOrderMessage = (order) => {
  if (
    order.statusPayment === 'paid' &&
    order.statusOrder === 'in_preparation'
  ) {
    return t('profile.myDeliveries.paymentConfirmed')
  }
  if (order.statusPayment === 'pending') {
    return t('profile.myDeliveries.paymentPending')
  }

  return ''
}

const isEditable = (order) =>
  ['created', 'pending_payment', 'in_preparation'].includes(order.statusOrder)

const isDeliveryDateValid = (order) => {
  if (!order.delivery) return false
  const deliveryDate = useFormatDate(order.delivery, 'date-send')
  const today = new Date()
  return deliveryDate === useFormatDate(today.toISOString(), 'date-send')
}
</script>

<template>
  <div class="tw-mt-8">
    <template v-if="orders.length > 0">
      <div class="tw-flex tw-justify-between tw-items-center tw-mb-4">
        <h3 class="subtitle">{{ $t('profile.myDeliveries.nextScheduled') }}</h3>
        <Button
          v-if="orders.length > 0 && planStatus === 'active'"
          @click="emit('create-order')"
          class="app-general-button app-btn-primary"
          :label="$t('button.scheduleNewOrder')"
          icon="pi pi-plus"
        />
      </div>

      <div v-for="order in orders" :key="order.id" class="order-card tw-mb-4">
        <div class="tw-flex tw-justify-between tw-items-start">
          <div>
            <span class="order-id" @click="emit('go-to-detail', order)"
              >ID {{ order.id }}</span
            >
            <h4 class="delivery-date">
              Entrega: {{ useFormatDate(order.delivery, 'date-table') }}
            </h4>
            <p class="order-message">{{ getOrderMessage(order) }}</p>
          </div>
          <div :class="['status-badge', getStatusClass(order)]">
            {{ getStatusLabel(order) }}
          </div>
        </div>

        <div class="tw-flex tw-justify-end tw-mt-4 tw-gap-4 tw-items-center">
          <template
            v-if="
              order.statusPayment === 'pending' ||
              order.statusPayment === 'rejected'
            "
          >
            <Button
              @click="emit('cancel-order', order)"
              class="app-general-button app-btn-transparent !tw-text-[#003B71] !tw-font-treble-bold !tw-p-0"
              :label="$t('button.cancelOrder')"
            />
            <Button
              @click="emit('retry-payment', order)"
              class="app-general-button btn-solo-create !tw-w-auto !tw-px-8"
              :label="$t('button.retry')"
            />
          </template>
          <template v-if="isEditable(order)">
            <Button
              type="button"
              @click="toggleEdit($event, order)"
              class="app-general-button app-btn-secundary"
            >
              <img
                src="/icons/profile/ic_edit.svg"
                alt="edit"
                class="tw-mr-2"
                style="
                  filter: invert(36%) sepia(85%) saturate(3019%)
                    hue-rotate(204deg) brightness(96%) contrast(89%);
                "
              />
              <span class="tw-font-treble-book">{{ $t('button.edit') }}</span>
              <i class="pi pi-chevron-down tw-ml-2"></i>
            </Button>
          </template>
        </div>
      </div>
    </template>
    <template v-else>
      <div
        class="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-8 tw-px-4 tw-bg-white tw-rounded-2xl tw-shadow-sm"
      >
        <p class="tw-text-[#575E6B] tw-font-treble-book tw-mb-4 tw-text-center">
          {{ $t('profile.myDeliveries.empty') }}
        </p>
        <Button
          @click="emit('create-order')"
          class="app-general-button app-btn-primary"
          :label="$t('button.scheduleNewOrder')"
          icon="pi pi-plus"
        />
      </div>
    </template>

    <Popover ref="menu" appendTo="body" class="general-popover">
      <div class="tw-flex tw-flex-col">
        <button
          v-if="selectedOrder && !isDeliveryDateValid(selectedOrder)"
          @click="emit('edit-date', selectedOrder), menu.hide()"
          class="popover-item"
        >
          {{ $t('button.editDate') || 'Editar fecha' }}
        </button>
        <button
          @click="emit('edit-diet', selectedOrder), menu.hide()"
          class="popover-item"
        >
          {{ $t('button.editDiet') || 'Editar dietas' }}
        </button>
        <button
          @click="emit('edit-address', selectedOrder), menu.hide()"
          class="popover-item"
        >
          {{ $t('button.editAddress') || 'Editar dirección' }}
        </button>
      </div>
    </Popover>
  </div>
</template>

<style scoped lang="scss">
.subtitle {
  @apply tw-text-[#575E6B] tw-text-[18px] !tw-p-0;
  font-family: 'heading-pro-treble-bold';
}

.order-card {
  @apply tw-bg-white tw-rounded-2xl tw-px-4 tw-py-3;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.05);

  .order-id {
    @apply tw-text-[#8BA0C9] tw-text-[12px] tw-font-treble-book tw-block tw-cursor-pointer;
  }

  .delivery-date {
    @apply tw-text-[#25282B] tw-text-[14px] tw-font-treble-bold;
  }

  .order-message {
    @apply tw-text-[#575E6B] tw-text-[14px] tw-font-treble-book;
  }

  .status-badge {
    @apply tw-px-3 tw-py-1 tw-rounded-md tw-text-[13px] tw-font-treble-book;
  }
}

.popover-item {
  @apply tw-px-4 tw-py-3 tw-text-left tw-text-[#25282B] tw-text-[14px] tw-font-treble-book tw-transition-colors;
  &:hover {
    @apply tw-bg-[#F8F9FA];
  }
}

:deep(.p-popover)::before,
:deep(.p-popover)::after {
  display: none !important;
}
</style>
