<script setup lang="ts">
const router = useRouter()
const localePath = useLocalePath()
/** emits */
const emit = defineEmits(['closeModal', 'logout'])
const onboardingStore = useOnboardingStore()

/** props */
defineProps({
  dialog: {
    type: Boolean,
    required: true,
  },
})

/** methods */
const closeModal = () => {
  emit('closeModal')
}
const logoutUser = async () => {
  useLoading(true)
  await logout(true)
  useLoading(false)
}
</script>

<template>
  <Dialog
    id="logout-modal"
    :visible="dialog"
    :style="{ width: '435px', height: ' 162px' }"
    :modal="true"
    :closable="false"
  >
    <div class="confirmation-content">
      <div>
        <h2>{{ $t('profile.account.logout') }}</h2>
        <p>{{ $t('title.logout') }}</p>
      </div>
    </div>
    <template #footer>
      <Button
        class="app-general-button app-btn-transparent"
        :label="$t('button.cancel')"
        @click="closeModal"
      />
      <Button
        class="app-general-button btn-solo-create"
        :label="$t('button.logout')"
        autofocus
        @click="logoutUser"
      />
    </template>
  </Dialog>
</template>

<style lang="scss">
#logout-modal {
  border-radius: 16px !important;
  .confirmation-content {
    display: flex;
  }
  h2 {
    color: $primary-1;
    font-size: 20px !important;

    font-family: 'heading-pro-treble-bold';
  }
  img {
    margin: 0 40px 20px 0px;
  }
  p {
    margin: 0;
    color: #575e6b;
    font-size: 14px !important;
    font-family: 'heading-pro-treble-book';
  }
  .p-dialog-header {
    border-top-right-radius: 11px !important;
    border-top-left-radius: 11px !important;
    padding: 10px;
  }
  .p-dialog-footer {
    border-bottom-right-radius: 11px !important;
    border-bottom-left-radius: 11px !important;
    display: flex;
    padding: 0;
    margin-top: auto;
    margin-bottom: 20px;
    margin-right: 20px;
    button {
      margin: 0 !important;
    }
  }

  .p-dialog-content {
    padding: 0 1.5rem 0rem 1.5rem;
  }

  .button-modal {
    color: white;
    padding: 12px 43px;
    border-radius: 5px;
    width: 100%;
    span {
      font-family: 'OpenSans-Bold' !important;
    }
  }
}
.p-dialog-mask.p-component-overlay {
  background-color: rgba(15, 27, 46, 1);
}
</style>
