<script setup lang="ts">
const emit = defineEmits(['closeModal', 'update:visible'])

const props = defineProps({
  showUpdateDialog: {
    type: Boolean,
    required: true,
  },
  details: {
    type: Object,
    required: true,
  },
  attributes: {
    type: Array,
    required: false,
    default: () => [],
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
})

const closeDrawer = () => {
  drawerVisible.value = false
}
const drawerVisible = computed({
  get: () => props.showUpdateDialog,
  set: (value) => {
    emit('update:visible', value)
    if (!value) {
      emit('closeModal')
    }
  },
})
</script>

<template>
  <Drawer
    v-model:visible="drawerVisible"
    :dismissable="true"
    class="general-drawer food-detail-drawer lg:!tw-w-[750px] max-lg:!tw-w-[95%]"
    position="right"
  >
    <template #header>
      <div class="header-food-detail gap-2">
        <span class="drawer-title">{{ props.name }}</span>
        <img
          :src="props.details.imageNutritional"
          alt="image_nutrition"
          height="129px"
          width="371px"
        />
      </div>
    </template>
    <template #closeicon>
      <i class="pi pi-times" @click="closeDrawer"></i>
    </template>
    <div class="content-drawer-food-detail">
      <span class="label-texts">Ingredientes</span>
      <p class="tw-mb-5">
        {{ props.details.ingredients }}
      </p>
      <span class="label-texts">Información nutricional</span>
      <div
        v-for="protein in props.attributes.length > 0
          ? props.attributes
          : props.details.attributes"
        class="protein"
      >
        <p>{{ protein.key }}</p>
        <p>{{ protein.value }}</p>
      </div>

      <div v-if="props.details.additionalDescription" class="tw-mt-11">
        <p>
          {{ props.details.additionalDescription }}
        </p>
      </div>
    </div>
  </Drawer>
</template>
