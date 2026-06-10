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
const accountStore = useAccountStore()
const { getListCities: cities } = storeToRefs(accountStore)
/** variables */
const open = ref(true)
const loading = ref(true)
const route = useRoute()
/** methods */
const form = ref({
  filter: '',
})
const getCities = async () => {
  await accountStore.getCitiesRegister()
}

onMounted(() => {
  nextTick(async () => {
    open.value = props.modelValue
    useLoading(true)
    loading.value = true
    await getCities()
    loading.value = false
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
    await getCities()
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
        <span>{{ $t('forms.create.checkout.city') }}</span>
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
    <div v-if="!loading" class="content-list">
      <ul class="list-general">
        <li
          v-for="(city, icou) in cities"
          :key="icou"
          @click="emit('selected', city.id)"
        >
          <span>{{ city.name }}</span>
        </li>
      </ul>
    </div>
  </Drawer>
</template>
