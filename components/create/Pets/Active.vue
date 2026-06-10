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

/*variables*/
const { getListActivities: activites } = storeToRefs(createStore)
const { t } = useI18n()

const { handleSubmit, errors, meta, resetForm } = useForm({
  validationSchema: toTypedSchema(
    z.object({
      option: z.number().min(1, { message: t('rule.validation.require') }),
    }),
  ),
})
const { value: option, setValue: optionValue } = useField<number | null>(
  'option',
)

const getAllActivities = async () => {
  const response = createStore.getActivities()
}

const selectOption = (value: number) => {
  optionValue(value)
}

const onSubmit = handleSubmit((values) => {
  emit('update-data', values)
  return values
})
const loadEditData = () => {
  if (props.editData) {
    if (props.editData.option) {
      optionValue(props.editData.option)
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
  () => option.value,
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
  { deep: true },
)
onMounted(() => {
  nextTick(async () => {
    await getAllActivities()
    loadEditData()
  })
})
</script>

<template>
  <div class="create-container">
    <div class="card-container-activity">
      <div
        v-for="opt in activites"
        :key="opt.id"
        class="card"
        :class="{ selected: option === opt.id }"
        @click="selectOption(opt.id)"
      >
        <img :src="opt.image" alt="dogs-activity" class="imgs-dogs-activity" />
        <div class="content">
          <h3>{{ opt.title }}</h3>
          <p>{{ opt.description }}</p>
        </div>
        <span class="app-general-button radio-btn tw-ml-3">
          <RadioButton
            :name="`activity-${opt.id}`"
            :value="opt.id"
            v-model="option"
          />
        </span>
      </div>
    </div>
    <GeneralInputError
      :error="
        errors['option'] === 'Required'
          ? $t('rule.validation.require')
          : errors['option']
      "
    />
  </div>
</template>

<style lang="scss">
.card-container-activity {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .card {
    display: flex;
    align-items: center;
    background-color: #ffffff;
    border-radius: 10px;
    cursor: pointer;
    transition:
      background-color 0.3s,
      border-color 0.3s;
    position: relative;

    &:hover {
      border-color: #007bff;
    }

    &.selected {
      background-color: #3db5e627;
      border: 1px solid #007bff;
    }

    .content {
      @apply lg:tw-ml-[37px];
      @apply max-lg:tw-ml-5;
      flex: 1;
      h3 {
        @apply lg:tw-text-[18px] tw-m-0 tw-font-treble-regular;
        @apply max-lg:tw-text-[16px];
      }
      p {
        @apply lg:tw-text-[16px] max-lg:tw-text-[12px] tw-font-treble-book;
        margin: 0.2rem 0 0;
        color: #6c757d;
      }
    }
  }
}
</style>
