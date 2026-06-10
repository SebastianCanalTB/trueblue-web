<script setup lang="ts">
import { watch } from 'vue'
import type { TableHeaders } from '~/interfaces/Table.interface'
import { debounce } from 'perfect-debounce'
const emit = defineEmits(['update:model-value'])
const ordersStore = useOrderStore()

const { getAllMyOrders: deliveries, getOrdersStatus: statusOptions } =
  storeToRefs(ordersStore)

const selectedStatus = ref(null)
const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const loading = ref(false)
const { t } = useI18n()
const currentPage = ref(1)
const totalPages = ref(0)

const headers = ref<TableHeaders[]>([
  {
    header: t('profile.myDeliveries.id'),
    field: 'id',
    headerClass: 'w-1 !tw-text-center',
    type: 'custom-id',
    action: 'none',
  },

  {
    header: t('profile.myDeliveries.paymentDate'),
    field: 'createdAt',
    headerClass: 'w-2',
    type: 'date',
  },
  {
    header: t('profile.myDeliveries.delivery'),
    field: 'delivery',
    headerClass: 'w-2',
    type: 'date',
  },
  {
    header: t('profile.myDeliveries.deliveryDate'),
    field: 'nextDelivery',
    headerClass: 'w-2',
    type: 'date',
  },
  {
    header: t('profile.myDeliveries.total'),
    type: 'price',
    field: 'total',
    headerClass: 'w-1',
  },
  {
    header: t('profile.myDeliveries.paymentStatus'),
    field: 'statusPayment',
    headerClass: 'w-2',
    type: 'paymentStatus',
  },
  {
    header: t('profile.myDeliveries.status'),
    field: 'statusOrder',
    type: 'status',
    headerClass: 'w-2',
  },
])

const getStatusClass = (status) => {
  switch (status) {
    case 'created':
      return 'tw-bg-[#FC7007]/10 tw-text-[#FC7007]'
    case 'on_the_way':
      return 'tw-bg-[#3DB5E6]/10 tw-text-[#3DB5E6]'
    case 'in_preparation':
      return 'tw-bg-[#15A864]/10  tw-text-[#15A864]'
    case 'delivered':
      return 'tw-bg-[#36A815]/10 tw-text-[#36A815]'
    case 'returned':
      return 'tw-bg-[#FF5D5D]/10 tw-text-[#FF5D5D]'
    case 'cancelled':
      return 'tw-bg-[#575E6B]/10 tw-text-[#575E6B]'
    default:
      return ''
  }
}

const getPaymentStatusClass = (status) => {
  switch (status) {
    case 'pending':
      return 'tw-text-[#FC7007]'
    case 'paid':
      return 'tw-text-[#36A815]'
    case 'refunded':
      return ' tw-text-[#15A864]'
    case 'rejected':
      return 'tw-text-[#FF5D5D]'
    default:
      return ''
  }
}

const viewdeliveryDetails = (id) => {
  router.push(localePath({ name: 'profile-my-deliveries-id', params: { id } }))
}
const form = ref({
  filter: '',
  statusOrder: '',
  limit: 5,
  offset: 0,
  someStates: false,
})
const loadData = async () => {
  useLoading(true)
  loading.value = true
  const result = await ordersStore.getOrders(form.value)
  if (result.status && result.code === 100) {
    await ordersStore.getStatus()
    totalPages.value = result.data.rows
  }
  loading.value = false

  useLoading(false)
}

const onChangePage = (page) => {
  currentPage.value = page
  form.value.offset = page - 1
}

const handleMobilePagination = (event) => {
  const page = Math.floor(event.first / event.rows) + 1
  onChangePage(page)
}

const onChangeRows = (rowsPerPage) => {
  currentPage.value = 1
  form.value.limit = rowsPerPage
  form.value.offset = 0
}

const disabledEditMode = () => {
  loadData()
  const query = { ...route.query }
  delete query.detail
  router.push({
    path: route.path,
    query,
  })
}

const listRoutes = computed(() => [
  {
    text: t('profile.myDeliveries.title'),
    action: disabledEditMode,
  },
  {
    text: t('profile.myDeliveries.detail.id', {
      data: selecteddeliveryId.value || '',
    }),
    url: route.fullPath,
  },
])
const debouncedLoadData = debounce(loadData, 500)

// Removed watch for route.query.detail

watch(
  () => selectedStatus.value,
  (newStatus) => {
    form.value.statusOrder = newStatus || ''
    form.value.offset = 0
    currentPage.value = 1
  },
)

onMounted(() => {
  nextTick(async () => {
    await loadData()
  })
})
watch(
  () => form.value,
  async () => {
    debouncedLoadData()
  },
  { deep: true },
)
</script>
<template>
  <div class="lg:tw-mr-10">
    <div>
      <h1 class="title primary1 !tw-text-[32px] tw-my-5 tw-mt-[5rem]">
        {{ $t('profile.myDeliveries.title') }}
      </h1>

      <div class="tw-flex tw-flex-col lg:tw-flex-row tw-gap-2 tw-mb-4">
        <div class="tw-flex tw-gap-2 tw-flex-grow">
          <span
            class="general-input solo-form lg:tw-w-[300px] max-lg:tw-w-1/2 !tw-h-auto"
          >
            <IconField iconPosition="right">
              <InputText v-model="form.filter" placeholder="Buscar" />
              <InputIcon><i class="pi pi-search"></i></InputIcon>
            </IconField>
          </span>
          <span
            class="general-dropdown solo-create lg:tw-w-[200px] max-lg:tw-w-1/2 !tw-h-auto"
          >
            <Select
              v-model="selectedStatus"
              :options="[{ name: 'all', value: '' }, ...statusOptions]"
              optionLabel="name"
              optionValue="id"
              :placeholder="$t('profile.myDeliveries.status')"
              :pt="{
                label: '!tw-text-[#8BA0C9]',
              }"
            >
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center">
                  <div class="tw-text-black">
                    {{ $t(`table.enums.status.${slotProps.value}`) }}
                  </div>
                </div>
                <span v-else>
                  {{ slotProps.placeholder }}
                </span>
              </template>
              <template #option="slotProps">
                <div class="flex items-center">
                  <div>
                    {{ $t(`table.enums.status.${slotProps.option.name}`) }}
                  </div>
                </div>
              </template>
            </Select>
          </span>
        </div>
      </div>
      <div
        v-if="deliveries.length > 0"
        class="max-lg:tw-hidden tw-max-w-[1000px]"
      >
        <GeneralTable
          :headers="headers"
          :fields="deliveries"
          :empty="$t('table.empty.message')"
          :limit="form.limit"
          :pages="totalPages"
          :current-page="currentPage"
          @view-details="viewdeliveryDetails"
          @change-page="onChangePage"
          @change-rows="onChangeRows"
          @reload="loadData"
        />
      </div>

      <div v-if="deliveries.length > 0" class="tw-block lg:tw-hidden">
        <div
          v-for="delivery in deliveries"
          :key="delivery.id"
          class="tw-bg-white tw-rounded-lg tw-shadow-sm tw-mb-4 tw-p-4"
          @click="viewdeliveryDetails(delivery.id)"
        >
          <div class="tw-flex tw-justify-between tw-items-center tw-mb-2">
            <div>
              <span
                class="tw-text-primary tw-font-treble-regular tw-text-[13px]"
              >
                {{ $t('profile.myDeliveries.id') + ' ' }} {{ delivery.id }}
              </span>
            </div>
            <div
              :class="getStatusClass(delivery.statusOrder)"
              class="tw-px-3 tw-py-1 tw-rounded-md tw-text-sm"
            >
              <span class="tw-text-[13px]">
                {{ $t(`table.enums.status.${delivery.statusOrder}`) }}
              </span>
            </div>
          </div>

          <div>
            <p class="tw-text-[12px] tw-mb-1">
              {{ $t('profile.myDeliveries.paymentDate') + ': ' }}
              {{ useFormatDate(delivery.createdAt, 'date-table') }}
            </p>
          </div>
          <div>
            <p class="tw-text-[#575E6B] tw-text-[12px] tw-mb-1">
              {{ $t('profile.myDeliveries.deliveryDate') + ': ' }}
              {{ useFormatDate(delivery.nextDelivery, 'date-table') }}
            </p>
          </div>
          <div>
            <p class="tw-text-[#575E6B] tw-text-[12px] tw-mb-3">
              {{ $t('profile.myDeliveries.paymentStatus') }}
              <strong :class="getPaymentStatusClass(delivery.statusPayment)">
                {{ $t(`table.enums.paymentStatus.${delivery.statusPayment}`) }}
              </strong>
            </p>
          </div>

          <div class="tw-text-right tw-font-treble-bold tw-text-[14px]">
            {{ useFormatPrice(delivery.total) }} / {{ delivery.frequency }}
          </div>
        </div>

        <div class="tw-mt-4">
          <Paginator
            :rows="form.limit"
            :totalRecords="totalPages"
            :first="(currentPage - 1) * form.limit"
            @page="handleMobilePagination($event)"
            class="tw-p-0"
          />
        </div>
      </div>
      <div
        v-else
        class="tw-flex tw-items-center tw-flex-col tw-justify-center tw-mt-20"
      >
        <img
          src="/icons/profile/ic_my_plan.svg"
          alt="dog-icon"
          width="128px"
          height="127px"
        />
        <p
          class="tw-text-[12px] tw-text-[#8BA0C9] tw-w-[336px] tw-text-center tw-mt-5"
        >
          {{ $t('profile.myPets.empty') }}
        </p>
      </div>
    </div>
  </div>
</template>
