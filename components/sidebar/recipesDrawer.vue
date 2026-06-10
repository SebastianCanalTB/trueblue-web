<script setup lang="ts">
const emit = defineEmits(['update:modelValue'])

/** props */
const props = defineProps({
  modelValue: {
    type: Boolean,
  },
  data: {
    type: Object,
    required: true,
  },
})
const open = ref(true)
onMounted(() => {
  nextTick(async () => {
    open.value = props.modelValue
  })
})
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
</script>

<template>
  <Drawer
    v-model:visible="open"
    :dismissable="true"
    class="general-drawer recipes"
    position="full"
  >
    <template #header> </template>
    <template #closeicon>
      <img
        src="/img/recipes/ic_close.svg"
        alt="blue_elipsis"
        style="cursor: pointer"
        width="12px"
        height="12px"
    /></template>
    <img
      :src="props.data.drawerImage"
      :alt="props.data.title"
      class="recipe-drawer-image"
      width="304px"
      height="287px"
    />
    <div class="header-menu">
      <span>{{ props.data.title }}</span>
    </div>
    <div class="content-list">
      <div
        v-for="(item, index) in props.data.quantity"
        :key="index"
        class="list-general"
      >
        <img
          src="/img/recipes/ic_blue_elipsis.svg"
          alt="blue_elipsis"
          class="recipes-images tw-top-1 tw-relative"
        />
        <p class="recipe-dialog-description">
          {{ $t(`recipes.dialogTexts.${props.data.typeDialog}.${item}`) }}
        </p>
      </div>
    </div>
  </Drawer>
</template>
