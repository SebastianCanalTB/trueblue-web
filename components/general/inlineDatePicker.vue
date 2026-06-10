<script lang="ts" setup>
const { t } = useI18n()

/* Emits */
const emit = defineEmits(['closeModal', 'delivery-changed'])

const props = defineProps({
  currentDate: {
    type: String,
    required: true,
    default: '',
  },
  isPlan: {
    type: Boolean,
    default: false,
  },
  maxDays: {
    type: Number,
    default: 31,
    require: false,
  },
})
const orderStore = useOrderStore()
const planStore = usePlanStore()
const { getAllHolyDays: holyDates } = storeToRefs(planStore)

const disabledDatesList = computed(() => {
  const dates = [
    new Date(),
    ...holyDates.value.map((t) => {
      const [year, month, day] = t.dates.split('-')
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    }),
  ]

  if (props.isPlan) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const afterTomorrow = new Date()
    afterTomorrow.setDate(afterTomorrow.getDate() + 2)
    dates.push(tomorrow, afterTomorrow)
  }

  return dates
})
/* Variables */
const dialog = ref(true)
const date = ref()
const route = useRoute()
/* Methods */
const onSubmit = async () => {
  emit('delivery-changed', useFormatDate(date.value.toISOString(), 'date-send'))
}

const convertStringToDate = (dateString: string) => {
  if (!dateString || dateString.trim() === '') {
    return null
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) {
    console.warn('Formato de fecha inválido:', dateString)
    return null
  }

  const dateObj = new Date(dateString)

  if (isNaN(dateObj.getTime())) {
    console.warn('Fecha inválida:', dateString)
    return null
  }

  const nextDay = new Date(dateObj)
  nextDay.setDate(dateObj.getDate() + 1)

  return nextDay
}

const setInitialDate = async () => {
  await planStore.getNonShippingDate()
  if (props.isPlan) {
    // skip planStore.getNonDeliveryDates() as per requirement
  }
  const convertedDate = convertStringToDate(props.currentDate)

  if (convertedDate) {
    date.value = convertedDate
  } else {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    date.value = tomorrow
  }
}

/* Watchers */
watch(
  () => dialog.value,
  (newVal: boolean) => {
    if (!newVal) {
      emit('closeModal')
    }
  },
)

watch(
  () => props.currentDate,
  (newDate: string) => {
    if (newDate) {
      const convertedDate = convertStringToDate(newDate)
      if (convertedDate) {
        date.value = convertedDate
      }
    }
  },
  { immediate: true },
)
onMounted(() => {
  nextTick(async () => {
    setInitialDate()
  })
})
</script>

<template>
  <Dialog
    :visible="dialog"
    modal
    style="width: 390px"
    class="general-dialog"
    :draggable="false"
    :closable="false"
  >
    <template #header>
      <p class="title">{{ t('profile.myDeliveries.delivery') }}</p>
    </template>
    <template #default>
      <span class="general-date">
        <DatePicker
          v-model="date"
          dateFormat="dd/mm/yy"
          inline
          class="w-full"
          :maxDate="
            new Date(new Date().setDate(new Date().getDate() + maxDays))
          "
          :minDate="new Date()"
          :showButtonBar="false"
          :disabledDays="[0]"
          :disabledDates="disabledDatesList"
          :showIcon="false"
        />
      </span>
    </template>
    <template #footer>
      <span class="flex gap-4 tw-mb-4 tw-mr-7">
        <Button
          class="app-general-button app-btn-transparent"
          :label="t('button.cancel')"
          @click="emit('closeModal')"
        />
        <Button
          type="submit"
          class="app-general-button app-btn-primary px-5"
          :label="t('button.update')"
          @click="onSubmit"
        />
      </span>
    </template>
  </Dialog>
</template>
<style lang="scss" scoped></style>
