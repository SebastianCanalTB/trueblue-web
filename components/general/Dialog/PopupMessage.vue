<script setup lang="ts">
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

interface Popup {
  id: number
  frontPage: boolean
  image: string
  title: string
  message: string
  frequency: string
  module: string
  hasAnAccount: boolean
  label: string
  link: string
  status: string
  createdAt: Date
  updatedAt: Date
}

interface Props {
  popup: Popup | null
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['update:visible', 'action'])

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
})

const handleAction = () => {
  if (props.popup?.link) {
    window.open(props.popup.link, '_blank')
  }
  emit('action', props.popup)
  isVisible.value = false
}
</script>
<template>
  <Dialog
    v-model:visible="isVisible"
    :modal="true"
    :closable="true"
    :draggable="false"
    :style="{ width: '370px' }"
    class="general-dialog popup-message-dialog"
    :pt="{
      content: { class: 'popup-content' },
      closeButton: { class: 'popup-close-btn' },
    }"
  >
    <template #header>
      <div v-if="popup?.frontPage" class="popup-header-content">
        <img
          v-if="popup?.image"
          :src="popup.image"
          :alt="popup.title"
          class="popup-image"
        />
      </div>
    </template>
    <div class="popup-body">
      <h2 class="popup-title">{{ popup?.title }}</h2>
      <p class="popup-message">{{ popup?.message }}</p>

      <Button
        v-if="popup?.hasAnAccount"
        :label="popup.label"
        class="popup-action-button"
        @click="handleAction"
      />
    </div>
  </Dialog>
</template>
