<script setup lang="ts">
import debounce from 'lodash/debounce'
/** emits */
const emit = defineEmits(['update:modelValue', 'selected'])
/** props */
const props = defineProps({
  modelValue: {
    type: Boolean,
  },
})
/** stores */
const createStore = useCreateStore()
const { getListPets: dogRace } = storeToRefs(createStore)
/** variables */
const open = ref(true)

/** methods */
const form = ref({
  filter: '',
})
const getDogs = async () => {
  const result = await createStore.getPets(form.value)
}

onMounted(() => {
  nextTick(async () => {
    open.value = props.modelValue
    useLoading(true)
    await getDogs()
    useLoading(false)
  })
})

/** whatchers */
watch(
  () => open.value,
  (newVal: any) => {
    emit('update:modelValue', newVal)
  },
)

watch(
  () => props.modelValue,
  (newVal: any) => {
    open.value = newVal
  },
)

watch(
  () => form.value,
  debounce(async () => {
    await getDogs()
  }, 500),
  { deep: true },
)
</script>

<template>
  <Drawer
    v-model:visible="open"
    :dismissable="true"
    class="general-drawer list-items max-lg:!tw-h-[80%]"
    position="bottom"
  >
    <template #header>
      <div class="header-menu">
        <span>Raza</span>
      </div>
    </template>
    <template #closeicon> </template>
    <span class="general-input solo-checkout tw-mb-3">
      <IconField icon-position="right">
        <InputText
          v-model="form.filter"
          :placeholder="$t('forms.create.searchDropdownPlaceHolder')"
        />
        <InputIcon>
          <i class="pi pi-search"></i>
        </InputIcon>
      </IconField>
    </span>
    <div class="content-list">
      <ul class="list-general">
        <li
          v-for="(city, icou) in dogRace"
          :key="icou"
          @click="emit('selected', city.id)"
        >
          <span>{{ city.name }}</span>
        </li>
      </ul>
    </div>
  </Drawer>
</template>
