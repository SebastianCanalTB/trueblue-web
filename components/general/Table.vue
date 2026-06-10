<script setup lang="ts">
import type { TableHeaders } from '~/interfaces/Table.interface'
/** emits */
const emit = defineEmits([
  'change-page',
  'edit-item',
  'reload',
  'change-rows',
  'view-details',
  'toggle-status',
  'show-menu',
])
/** props */
const props = defineProps({
  headers: {
    type: Array as PropType<TableHeaders[]>,
    required: true,
  },
  fields: {
    type: Array as PropType<unknown[]>,
    required: true,
  },
  empty: {
    type: String,
    required: false,
    default: '',
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
  limit: {
    type: Number,
    required: true,
  },
  pages: {
    type: Number,
    required: true,
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  rowsPerPageOptions: {
    type: Array,
    default: () => [5, 10, 20, 50, 100],
  },
})

/** variables */
const route = useRoute()
const { t } = useI18n()
const first = computed(() => (props.currentPage - 1) * props.limit)

// methods
const searchField = (path, data) => {
  return useSearchItemJson(path, data)
}

const getEnum = (_value: any, _action: string) => {
  let text = ''

  switch (_action) {
    case 'role':
      text = t(`table.enums.role.${_value}`)
      break
    default:
      break
  }

  return text
}

const onPage = (event) => {
  if (event.changeType === 'rows') {
    emit('change-rows', event.rows)
  } else {
    emit('change-page', event.page + 1)
  }
}

const getGoTo = (_prop, _item) => {
  let url = ''

  switch (_item.action) {
    case 'detail':
      url = route.path + '/' + _prop.data.id
      break

    default:
      break
  }

  return url
}

const viewDetails = (id) => {
  emit('view-details', id)
}

const toggleStatus = (item) => {
  emit('toggle-status', item)
}

const showMenu = (event, item) => {
  emit('show-menu', event, item)
}
</script>

<template>
  <div class="app-container-table">
    <div class="table-project">
      <DataTable :value="fields" responsive-layout="scroll" :loading="loading">
        <Column
          v-for="(item, index) of headers"
          :key="index"
          :header="item.header"
          :header-style="item.headerStyle"
          :header-class="item.headerClass"
        >
          <template #body="slotProps">
            <div
              v-if="item.type === 'custom-menu'"
              @click.stop="showMenu($event, slotProps.data)"
              class="tw-cursor-pointer tw-text-gray-500 tw-text-center"
            >
              <i class="pi pi-ellipsis-h"></i>
            </div>

            <nuxt-link
              v-else-if="item.type === 'principal'"
              :class="'principal-title ' + item.fieldClass"
              :to="getGoTo(slotProps, item)"
              >{{ searchField(item.field, slotProps.data) }}</nuxt-link
            >

            <div
              v-else-if="
                item.type === 'custom-link' || item.type === 'custom-id'
              "
              :class="'principal-title ' + item.fieldClass"
              @click="viewDetails(slotProps.data.id)"
            >
              {{ searchField(item.field, slotProps.data) }}
            </div>

            <div
              v-else-if="item.type === 'toggle'"
              class="tw-flex tw-justify-center"
            >
              <span class="general-switch solo-tables">
                <ToggleSwitch
                  :model-value="searchField(item.field, slotProps.data)"
                  @update:modelValue="() => toggleStatus(slotProps.data)"
                />
              </span>
            </div>
            <p
              v-else-if="item.type === 'status'"
              class="status"
              :class="searchField(item.field, slotProps.data)"
            >
              {{
                $t(
                  `table.enums.status.${searchField(item.field, slotProps.data)}`,
                )
              }}
            </p>
            <p
              v-else-if="item.type === 'paymentStatus'"
              class="paymentStatus"
              :class="searchField(item.field, slotProps.data)"
            >
              {{
                $t(
                  `table.enums.paymentStatus.${searchField(item.field, slotProps.data)}`,
                )
              }}
            </p>
            <p
              v-else-if="item.type === 'date'"
              class="paymentStatus"
              :class="searchField(item.field, slotProps.data)"
            >
              {{
                useFormatDate(
                  searchField(item.field, slotProps.data),
                  'date-table',
                )
              }}
            </p>
            <p v-else-if="item.type === 'age'">
              {{
                useFormatAge(
                  searchField(item.yearField || item.field, slotProps.data),
                  searchField(item.monthField, slotProps.data),
                )
              }}
            </p>
            <p v-else-if="item.type === 'discount'">
              {{ searchField(item.field, slotProps.data) }}%
            </p>
            <p v-else-if="item.type === 'fullname'">
              {{ searchField(item.field, slotProps.data) }}
              {{ searchField(item?.lastName, slotProps.data) }}
            </p>
            <p v-else-if="item.type === 'price'">
              {{ useFormatPrice(searchField(item.field, slotProps.data)) }}
            </p>
            <p v-else-if="item.type === 'currency'">
              {{ useFormatPrice(searchField(item.field, slotProps.data)) }}
            </p>
            <p v-else-if="item.type === 'weight'" class="tw-text-center">
              {{ searchField(item.field, slotProps.data) + ' Kg' }}
            </p>
            <GeneralPetsTags
              v-else-if="item.type === 'custom' && item.field === 'mascotas'"
              :mascotas="searchField(item.field, slotProps.data)"
            />

            <Button
              v-else-if="item.type === 'edit-button'"
              class="py-0 app-general-button app-btn-transparent"
              @click="emit('edit-item', slotProps.data)"
            >
              <template #icon>
                <img src="/icons/profile/ic_edit.svg" alt="edit item" />
              </template>
            </Button>

            <GeneralTableStatus
              v-else-if="item.type === 'state'"
              :id="slotProps.data.id"
              :status="searchField(item.field, slotProps.data)"
              :service="item.service"
              :request="item.request"
              @reload="$emit('reload')"
            />

            <p v-else-if="item.type === 'enum'">
              {{ getEnum(searchField(item.field, slotProps.data), item.enum) }}
            </p>

            <p v-else class="m-0" :class="item.fieldClass">
              {{ searchField(item.field, slotProps.data) }}
            </p>

            <p v-if="item.subField" class="m-0" :class="item.subFieldClass">
              {{ searchField(item.subField, slotProps.data) }}
            </p>
          </template>
        </Column>
        <template #loading>
          <p id="loading-text">{{ $t('table.loading') }}</p>
        </template>
        <template #empty>
          <GeneralEmptyTable :message="empty" />
        </template>
      </DataTable>
    </div>

    <GeneralCustomPaginator
      v-if="route.query.page !== 'my-pets'"
      :rows="limit"
      :total-records="pages"
      :first="first"
      :rows-per-page-options="rowsPerPageOptions"
      @page="onPage"
    />
  </div>
</template>
