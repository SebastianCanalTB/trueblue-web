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

/*stores*/
const createStore = useCreateStore()
const { getPortionsOptions: optionsFood } = storeToRefs(createStore)

/*variables*/
const { t } = useI18n()

const { handleSubmit, errors, meta, resetForm } = useForm({
  validationSchema: toTypedSchema(
    z.object({
      portions: z.boolean({ message: t('rule.validation.require') }),
    }),
  ),
})

const { value: portions, setValue: setPortionsValue } = useField<
  boolean | null
>('portions')

const selectPortion = (value: boolean) => {
  setPortionsValue(value)
}

const onSubmit = handleSubmit((values) => {
  emit('update-data', values)
  return values
})

const loadEditData = () => {
  if (props.editData) {
    if (
      props.editData.portions !== undefined &&
      props.editData.portions !== null
    ) {
      const portionValue = Boolean(props.editData.portions)

      nextTick(() => {
        setPortionsValue(portionValue)
      })
    }
  }
}

defineExpose({
  onSubmit,
})

watch(
  () => props.resetForm,
  (newValue) => {
    if (newValue === true) {
      resetForm()
    }
  },
)

watch(
  () => meta.value.valid,
  (newVal: boolean) => {
    emit('update:modelValue', newVal)
  },
)

watch(
  () => portions.value,
  (newVal) => {
    emit('update:modelValue', newVal)
  },
)

watch(
  () => props.editData,
  (newValue) => {
    if (newValue) {
      loadEditData()
    }
  },
  { deep: true, immediate: true },
)

onMounted(() => {
  nextTick(() => {
    loadEditData()
  })
})
</script>

<template>
  <div class="create-container">
    <div class="card-container-portions">
      <div
        v-for="(opt, i) in optionsFood"
        :key="i"
        class="card"
        :class="{ selected: portions === opt.id }"
        @click="selectPortion(opt.id)"
      >
        <img
          :src="opt.image"
          alt="dogs-portion"
          class="imgs-dogs-portion"
          width="153px"
          height="153px"
        />
        <div class="content">
          <h3>{{ opt.title }}</h3>
          <p>{{ opt.description }}</p>
        </div>
        <span class="app-general-button radio-btn portions">
          <RadioButton
            :name="`activity-${opt.id}`"
            :value="opt.id"
            v-model="portions"
            class="lg:!tw-top[30px]"
          />
        </span>
      </div>
    </div>
    <GeneralInputError
      :error="
        errors['portions'] === 'Required'
          ? $t('rule.validation.require')
          : errors['portions']
      "
    />
  </div>
</template>
