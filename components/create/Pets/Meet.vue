<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const emit = defineEmits(['update:modelValue', 'update-data'])
const props = defineProps({
  resetForm: {
    type: Boolean,
    required: true,
  },
  editData: {
    type: Object,
    default: () => null,
  },
})
const sidebars = ref(false)
const createStore = useCreateStore()
const systemStore = useSystemStore()
const { isMovil } = storeToRefs(systemStore)
const { getListPets: dogRace } = storeToRefs(createStore)

const { t } = useI18n()
const dogsRef = ref()
const loading = ref(true)
const options = [
  { value: 'Macho', label: t('forms.create.option1') },
  { value: 'Hembra', label: t('forms.create.option2') },
]

const { handleSubmit, errors, meta, resetForm } = useForm({
  validationSchema: toTypedSchema(
    z
      .object({
        name: z
          .string({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
        raze: z
          .number({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
        genre: z
          .string({ message: t('rule.validation.require') })
          .min(1, { message: t('rule.validation.require') }),
        years: z
          .number({ message: t('rule.validation.require') })
          .min(0, { message: t('rule.validation.multipleRequires') })
          .nullable()
          .refine(
            (value) => {
              const number = value
              if (number > 31) {
                return false
              } else {
                return true
              }
            },
            { message: t('rule.validation.maxYears') },
          ),
        months: z
          .number({ message: t('rule.validation.require') })
          .min(0, { message: t('rule.validation.multipleRequires') })
          .nullable()
          .refine(
            (value) => {
              const number = value
              if (number > 11) {
                return false
              } else {
                return true
              }
            },
            { message: t('rule.validation.months') },
          ),
      })
      .refine(
        (data) => {
          const yearsNumber = parseInt(data.years, 10)
          const monthsNumber = parseInt(data.months, 10)
          return yearsNumber > 0 || monthsNumber > 0
        },
        {
          message: t('rule.validation.multipleRequires'),
          path: ['years', 'months'],
        },
      ),
  ),
})

// define variable
const { value: name } = useField<string | null>('name')
const { value: raze, setValue: setRace } = useField<number | null>('raze')
const { value: genre, setValue: setValueGenre } = useField<string | null>(
  'genre',
)
const { value: years } = useField<number | null>('years', undefined, {
  initialValue: 0,
})
const { value: months } = useField<number | null>('months', undefined, {
  initialValue: 0,
})

const getDogs = async () => {
  loading.value = true

  const form = ref({
    filter: '',
  })
  const result = await createStore.getPets(form.value)
  loading.value = false
}
const selectedDog = (_id: any) => {
  sidebars.value = false
  setRace(_id)
}
const loadEditData = () => {
  if (props.editData) {
    if (props.editData.name) {
      name.value = props.editData.name
    }

    if (props.editData.raze) {
      raze.value = props.editData.raze
    }

    if (props.editData.genre) {
      setValueGenre(props.editData.genre)
    }

    if (props.editData.years) {
      years.value = props.editData.years
    }

    if (props.editData.months) {
      months.value = props.editData.months
    }
  }
}
const onSubmit = handleSubmit((values) => {
  emit('update-data', values)
  return values
})

watch(
  () => props.resetForm,
  (newValue) => {
    if (newValue === true) {
      resetForm()
    }
  },
)

const openSidebarInsteadOfDropdown = () => {
  if (!isMovil.value) {
    return
  }
  sidebars.value = true
  dogsRef.value.hide()
}
onMounted(() => {
  nextTick(async () => {
    useLoading(true)
    await getDogs()
    loadEditData()
    useLoading(false)
  })
})

defineExpose({
  onSubmit,
})
watch(
  () => meta.value.valid,
  (newVal: boolean) => {
    emit('update:modelValue', newVal)
  },
)
watch(
  () => props.editData,
  (newValue) => {
    if (newValue) {
      resetForm()
      loadEditData()
    }
  },
  { deep: true },
)
watch(name, (newValue) => {
  if (props.resetForm === false) {
    name.value = newValue.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ´\s]/g, '')
  } else return
})
</script>

<template>
  <div
    v-if="!loading"
    class="create-container max-lg:tw-overflow-y-hidden tw-gap-10"
  >
    <span class="general-input solo-form tw-w-full tw-max-w-350">
      <label for="username">{{ $t('forms.create.inputLabel') }}</label>
      <InputText
        v-model="name"
        :placeholder="$t('forms.create.inputPlaceholder')"
        maxlength="50"
        @keydown="usePreventInvalidInput"
        @input="usePreventInvalidInput"
        @paste="useHandlePaste"
      />
      <GeneralInputError :error="errors['name']" />
    </span>

    <span class="general-dropdown solo-create tw-w-full tw-max-w-350">
      <label for="username">{{ $t('forms.create.dropdownLabel') }}</label>
      <Select
        v-model="raze"
        ref="dogsRef"
        :options="dogRace"
        :placeholder="$t('forms.create.dropdownPlaceholder')"
        filter
        :filterPlaceholder="$t('forms.create.searchDropdownPlaceHolder')"
        :autoFilterFocus="isMovil ? false : true"
        option-value="id"
        option-label="name"
        @click.native="openSidebarInsteadOfDropdown"
        @before-show="openSidebarInsteadOfDropdown"
      />
      <GeneralInputError :error="errors['raze']" />
    </span>
    <span
      class="general-selectButton form tw-max-w-350 max-lg:tw-w-full tw-mt-1"
    >
      <label for="sex">{{ $t('forms.create.genre') }}</label>
      <SelectButton
        v-model="genre"
        option-value="value"
        option-label="label"
        :options="[...options]"
        :allowEmpty="false"
        size="large"
      />
      <GeneralInputError :error="errors['genre']" />
    </span>
    <span class="general-input form-group tw-max-w-350 tw-w-full">
      <label for="age">{{ t('forms.create.age.title') }}</label>
      <div class="flex gap-3">
        <InputGroup>
          <InputNumber
            v-model="years"
            :placeholder="'1'"
            :max="30"
            :useGrouping="false"
            fluid
          />
          <InputGroupAddon>{{ t('forms.create.age.year') }}</InputGroupAddon>
        </InputGroup>
        <p class="tw-mt-3 tw-text-[16px]">con</p>
        <InputGroup>
          <InputNumber
            v-model="months"
            inputId="minmax"
            :min="0"
            :max="11"
            mask="9?9"
            :placeholder="'11'"
            :useGrouping="false"
            fluid
          />
          <InputGroupAddon>{{ t('forms.create.age.months') }}</InputGroupAddon>
        </InputGroup>
      </div>
      <GeneralInputError
        v-if="errors.years || errors.months"
        :error="errors[errors.years ? 'years' : 'months']"
      />
    </span>
    <SidebarDogsDrawer
      v-if="sidebars"
      v-model="sidebars"
      @selected="selectedDog"
    />
  </div>
</template>
