<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useField, useForm } from 'vee-validate'
const props = defineProps({
  rows: {
    type: Number,
    required: true,
  },
  totalRecords: {
    type: Number,
    required: true,
  },
  first: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['page'])

const rowsPerPageOptions = ref([
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
])
const currentPage = ref(Math.floor(props.first / props.rows) + 1)
const pageInputValue = ref(currentPage.value.toString())
const totalPages = computed(() => {
  return Math.ceil(props.totalRecords / rowsPerPage.value) || 1
})
const rowsPerPage = ref(props.rows)

watch(
  () => props.rows,
  (newValue) => {
    rowsPerPage.value = newValue
  },
)

watch(
  () => props.first,
  (newValue) => {
    currentPage.value = Math.floor(newValue / props.rows) + 1
    pageInputValue.value = currentPage.value.toString()
  },
)

// Métodos
const onRowsChange = () => {
  currentPage.value = 1
  pageInputValue.value = '1'
  emit('page', {
    page: 0,
    first: 0,
    rows: rowsPerPage.value,
    pageCount: totalPages.value,
    changeType: 'rows',
  })
}

const onPageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return

  currentPage.value = page
  pageInputValue.value = page.toString()

  const first = (page - 1) * rowsPerPage.value
  emit('page', {
    page: page - 1,
    first,
    rows: rowsPerPage.value,
    pageCount: totalPages.value,
    changeType: 'page',
  })
}

const onPageInputChange = () => {
  let page = parseInt(pageInputValue.value)

  if (isNaN(page)) {
    page = currentPage.value
  } else if (page < 1) {
    page = 1
  } else if (page > totalPages.value) {
    page = totalPages.value
  }

  pageInputValue.value = page.toString()
  if (page !== currentPage.value) {
    onPageChange(page)
  }
}
</script>
<template>
  <div
    class="tw-flex tw-justify-between tw-items-center tw-mt-4 tw-p-2 tw-rounded"
  >
    <div class="tw-flex tw-items-center tw-gap-2">
      <span class="general-dropwdown rows">
        <Select
          v-model="rowsPerPage"
          :options="rowsPerPageOptions"
          option-label="label"
          option-value="value"
          @change="onRowsChange"
        />
      </span>
      <span class="tw-text-gray-500">Registros</span>
    </div>

    <div class="tw-flex tw-items-center tw-gap-2">
      <span class="tw-text-gray-500">Página</span>
      <input
        v-model="pageInputValue"
        class="tw-border tw-border-gray-300 tw-rounded tw-p-1.5 tw-w-12 tw-text-center"
        type="text"
        @keyup.enter="onPageInputChange"
        @blur="onPageInputChange"
      />
      <span class="tw-text-gray-500">de {{ totalPages }}</span>
    </div>

    <div class="tw-flex tw-items-center">
      <button
        class="tw-p-2 tw-flex tw-items-center"
        :class="currentPage <= 1 ? 'tw-text-[#1A1A29]/50' : 'tw-text-[#1A1A29]'"
        :disabled="currentPage <= 1"
        @click="onPageChange(currentPage - 1)"
      >
        <i class="pi pi-chevron-left"></i>
        <span class="tw-ml-1">Anterior</span>
      </button>
      <button
        class="tw-p-2 tw-flex tw-items-center"
        :class="
          currentPage >= totalPages
            ? 'tw-text-[#1A1A29]/50'
            : 'tw-text-[#1A1A29]'
        "
        :disabled="currentPage >= totalPages"
        @click="onPageChange(currentPage + 1)"
      >
        <span>Siguiente</span>
        <i class="pi pi-chevron-right"></i>
      </button>
    </div>
  </div>
</template>
