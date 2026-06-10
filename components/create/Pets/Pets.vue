<script setup lang="ts">
const emit = defineEmits([
  'finish',
  'update:modelValue',
  'update:calculationValue',
  'update:activeValue',
  'update:bodyValue',
  'update:portions',
])
/** Stores */
const accountStore = useAccountStore()
const { getLisParametrization: parametrization } = storeToRefs(accountStore)
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const subStepQueries = computed(() => {
  const baseSteps = ['meet', 'calculation', 'active']

  if (parametrization.value?.isMixedFood) {
    return [...baseSteps, 'portion']
  }

  return [...baseSteps]
})

const getSubStepFromQuery = (query: string): string => {
  return subStepQueries.value.includes(query) ? query : 'meet'
}

const getQueryFromSubStep = (subStep: string): string => {
  return subStepQueries.value.includes(subStep) ? subStep : 'meet'
}

const step = ref(getSubStepFromQuery(route.query.substep as string))

watch(
  step,
  (newStep) => {
    const newQuery = getQueryFromSubStep(newStep)
    if (route.query.substep !== newQuery) {
      router.push({
        query: { ...route.query, substep: newQuery },
      })
    }
  },
  { immediate: false },
)

watch(
  () => route.query.substep,
  (newQuery) => {
    if (newQuery && typeof newQuery === 'string') {
      const newSubStep = getSubStepFromQuery(newQuery)
      if (step.value !== newSubStep) {
        step.value = newSubStep
      }
    }
  },
)

const formValidate = ref<any[]>([])
const validationState = ref({
  meet: false,
  calculation: false,
  active: false,
  portion: false,
})
const formSendData = ref({})
const formData = ref({
  form1: {},
  form2: {},
  form3: {},
  form4: {},
  form5: {},
})
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

const updateFormData = (key: string, value: any) => {
  formData.value[key] = value
}
const getStepTitle = computed(() => {
  let items: Record<string, { title: string; description: string }> = {
    meet: {
      title: t('create.main.content.1.title'),
      description: t('create.main.content.1.subtitle'),
    },
    calculation: {
      title: t('create.main.content.1.calculationTitle'),
      description: t('create.main.content.1.subtitle'),
    },

    active: {
      title: t('create.main.content.1.activeTitle'),
      description: t('create.main.content.1.subtitle'),
    },
    portion: {
      title: t('create.main.content.1.portionTitle'),
      description: t('create.main.content.1.subtitle'),
    },
  }

  return (
    items[step.value] || {
      title: '',
      description: '',
    }
  )
})
const getStepDescription = computed(() => {
  let items: Record<string, { description: string }> = {
    meet: {
      description: t('create.main.content.1.description'),
    },
    calculation: {
      description: t('create.main.content.2.description'),
    },
  }

  return (
    items[step.value] || {
      description: '',
    }
  )
})

const onSubmit = async () => {
  const refStep = formValidate.value.find((rs: any) => rs.type === step.value)
  if (refStep) {
    const result = await refStep.ref.onSubmit()
    if (result) {
      formSendData.value = { ...formSendData.value, result }
      if (step.value === 'meet') {
        step.value = 'calculation'
      } else if (step.value === 'calculation') {
        step.value = 'active'
      } else if (step.value === 'active') {
        if (parametrization.value?.isMixedFood) {
          step.value = 'portion'
        } else {
          return finishForm()
        }
      } else if (step.value === 'portion') {
        return finishForm()
      }
    }
  }
}
const finishForm = () => {
  if (formData.value.form1 && formData.value.form2 && formData.value.form3) {
    emit('finish', formData.value)
    return true
  } else {
    useShowAlert({
      type: 'error',
      message: 'Faltan datos en pasos anteriores',
    })
    return false
  }
}
const goBack = async () => {
  if (step.value === 'meet') {
    validationState.value.meet
    return
  } else if (step.value === 'calculation') {
    validationState.value.calculation
    step.value = 'meet'
  } else if (step.value === 'active') {
    validationState.value.active
    step.value = 'calculation'
  } else if (step.value === 'portion') {
    validationState.value.portion
    step.value = 'active'
  }
}
const formValidateRef = (type: string, el: any) => {
  if (!formValidate.value.find((t) => t.type === type)) {
    formValidate.value.push({ type, ref: el })
  }
}

defineExpose({
  onSubmit,
  updateFormData,
  goBack,
  step,
})
const resetChilds = ref(false)
watch(
  () => props.resetForm,
  (newState) => {
    if (newState) {
      resetChilds.value = true
      setTimeout(() => {
        resetChilds.value = false
      }, 100)
    }
  },
  { deep: true },
)
watch(
  () => props.editData,
  (newValue) => {
    if (newValue) {
      formData.value = { ...newValue }
    }
  },
  { immediate: true, deep: true },
)

watch(
  () => formData.value.form1,
  (something) => {
    if (!something) {
      step.value = 'meet'
    }
  },
  { deep: true },
)
watch(
  () => validationState.value.meet,
  (newState) => {
    emit('update:modelValue', newState)
  },
  { deep: true },
)
watch(
  () => validationState.value.calculation,
  (newState) => {
    emit('update:calculationValue', newState)
  },
  { deep: true },
)
watch(
  () => validationState.value.active,
  (newState) => {
    emit('update:activeValue', newState)
  },
  { deep: true },
)
watch(
  () => validationState.value.portion,
  (newState) => {
    emit('update:portions', newState)
  },
  { deep: true },
)
onMounted(() => {
  step.value = 'meet'
  router.replace({
    query: {
      step: 'pet',
      substep: 'meet',
    },
  })
})
</script>
<template>
  <div>
    <h1
      class="title-create"
      :class="{
        'tw-mb-5': step !== 'meet',
        'lg:!tw-px-16': step === 'portion',
      }"
    >
      {{ getStepTitle.title }}
    </h1>
    <p v-if="step === 'meet'" class="subtitle">
      {{ getStepTitle.description }}
    </p>
    <CreatePetsMeet
      v-model="validationState.meet"
      v-show="step === 'meet'"
      :ref="(el) => formValidateRef('meet', el)"
      :resetForm="resetChilds"
      :editData="formData.form1"
      @update-data="(value) => updateFormData('form1', value)"
    />
    <CreatePetsCalculation
      v-show="step === 'calculation'"
      :ref="(el) => formValidateRef('calculation', el)"
      :resetForm="resetChilds"
      v-model="validationState.calculation"
      :editData="formData.form2"
      @update-data="(value) => updateFormData('form2', value)"
    />
    <CreatePetsPortions
      v-show="step === 'portion'"
      :ref="(el) => formValidateRef('portion', el)"
      v-model="validationState.portion"
      :resetForm="resetChilds"
      :editData="formData.form5"
      @update-data="(value) => updateFormData('form5', value)"
    />
    <CreatePetsActive
      v-show="step === 'active'"
      :ref="(el) => formValidateRef('active', el)"
      :resetForm="resetChilds"
      v-model="validationState.active"
      :editData="formData.form3"
      @update-data="(value) => updateFormData('form3', value)"
    />
    <div
      v-if="step !== 'active' && step !== 'portion'"
      class="pets-message-container"
    >
      <div class="pets-message">
        <img src="/icons/registry/ic_dog_pad_pet.svg" alt="ic_dog_pad" />
        <span>
          {{ getStepDescription.description }}
        </span>
      </div>
    </div>
  </div>
</template>
<style lang="scss">
.title-create {
  @apply tw-text-primary tw-font-treble-bold tw-text-center tw-text-[20px] max-lg:tw-pt-12;
  @apply max-lg:tw-text-[18px] max-lg:tw-text-center;
}

.subtitle {
  @apply tw-text-[13px] tw-text-center tw-pt-3 tw-font-treble-book lg:tw-pl-2 lg:tw-pb-8 max-lg:tw-px-2;
  @apply max-lg:tw-text-center;
  color: #8ba0c9;
}
.pets-message-container {
  @apply tw-flex tw-justify-center tw-mt-10 max-lg:tw-px-4;
  .pets-message {
    @apply tw-text-center tw-flex;
    border-radius: 12px;
    background: rgb(185, 141, 24, 0.1);
    max-width: 642px;
    padding: 15px;
    span {
      @apply tw-text-[#B98D18];
    }
    img {
      width: 15px;
      height: 15px;
    }
  }
}
</style>
