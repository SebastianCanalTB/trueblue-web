<script setup>
import { ref, toRef } from 'vue'
const emit = defineEmits(['reload'])
const props = defineProps({
  id: String | Number,
  status: String,
  service: String,
  request: String,
})

const save = async (state) => {
  useLoading(true)

  const result = await useApiServices({
    url: props.service + props.id,
    method: 'POST',
    typeHeader: 'auth',
  })

  if (result.status && result.code === 100) {
    useShowAlert({
      type: 'success',
      message: result.message,
    })
  } else {
    useShowAlert({
      type: 'error',
      message: result.message,
    })
  }

  emit('reload')
  useLoading(false)
}
</script>
<template>
  <span class="general-switch solo-tables">
    <ToggleSwitch
      :modelValue="status === 'active' || status === true ? true : false"
      @click="save"
    />
  </span>
</template>

<style lang="scss"></style>
