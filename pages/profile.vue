<script setup lang="ts">
const localePath = useLocalePath()
const onboardingStore = useOnboardingStore()
const { getLoginUser: user } = storeToRefs(onboardingStore)

const secondSection = useState<boolean>('profile-second-section', () => false)
const route = useRoute()

/**
 * Mi cuenta v3: clientes (type 'user' o 'both') ven el menú nuevo arriba
 * (computador) / abajo (celular). Las veterinarias (type 'vet') siguen con el
 * menú lateral de siempre.
 */
const userType = computed(() => useSearchItemJson('type', user.value))
const isV3 = computed(() => userType.value !== 'vet')
const logoutDialog = ref(false)
const doLogout = async () => {
  useLoading(true)
  const result = await onboardingStore.logout()
  if (result.status && result.code === 100) {
    window.location.href = localePath({ name: 'index' })
  }
  useLoading(false)
}

const checkDetailView = () => {
  if (route.query.page === 'my-plan') {
    navigateTo(localePath('/profile/my-plan'))
    return
  }

  if (
    route.query.id !== undefined ||
    route.query.detail !== undefined ||
    route.params.id !== undefined ||
    route.path.includes('/edit')
  ) {
    secondSection.value = true
  } else {
    secondSection.value = false
  }
}

watch(
  () => [route.query, route.path],
  () => {
    checkDetailView()
  },
  { immediate: true, deep: true },
)
</script>

<template>
  <div v-if="isV3" class="ma-shell">
    <ProfileV3CommonNav
      :show-recommendeds="userType === 'both'"
      @logout="logoutDialog = true"
    />
    <div class="ma-shell-mobile-top">
      <button class="ma-link is-muted" @click="logoutDialog = true">
        Cerrar sesión
      </button>
    </div>
    <NuxtPage />
    <ProfileV3CommonBlueLauncher />
    <LayoutsLoginLogout
      :dialog="logoutDialog"
      @logout="doLogout"
      @closeModal="logoutDialog = false"
    />
  </div>

  <div
    v-else
    class="profile-page tw-w-full"
    :class="{
      'lg:!tw-h-[45vh] lg:!tw-min-h-[300px]':
        !secondSection &&
        $route.path.includes('my-profile') &&
        useSearchItemJson('type', user) === 'vet',
      'lg:!tw-min-h-[65vh] ':
        !secondSection &&
        $route.path.includes('my-profile') &&
        useSearchItemJson('type', user) === 'both',
    }"
  >
    <div v-if="!secondSection" class="profile-redirections lg:col-3">
      <nuxt-link
        class="profile-redirections-texts"
        active-class="active"
        :to="localePath('/profile/my-profile')"
        :class="{ active: $route.path === localePath('/profile/my-profile') }"
      >
        {{ $t('profile.account.title') }}
        <i
          v-if="$route.path === localePath('/profile/my-profile')"
          class="pi pi-arrow-right"
          style="color: #2b7ee2; font-size: 18px"
        ></i>
      </nuxt-link>

      <nuxt-link
        v-if="
          useSearchItemJson('type', user) === 'vet' ||
          useSearchItemJson('type', user) === 'both'
        "
        class="profile-redirections-texts"
        active-class="active"
        :to="localePath('/profile/my-recommendeds')"
      >
        {{ $t('profile.myRecommendeds.title') }}
        <i
          v-if="$route.path.includes('my-recommendeds')"
          class="pi pi-arrow-right"
          style="color: #2b7ee2; font-size: 18px"
        ></i>
      </nuxt-link>

      <template
        v-if="
          useSearchItemJson('type', user) === 'user' ||
          useSearchItemJson('type', user) === 'both'
        "
      >
        <nuxt-link
          class="profile-redirections-texts"
          active-class="active"
          :to="localePath('/profile/my-deliveries')"
        >
          {{ $t('profile.myDeliveries.title') }}
          <i
            v-if="$route.path.includes('my-deliveries')"
            class="pi pi-arrow-right"
            style="color: #2b7ee2; font-size: 18px"
          ></i>
        </nuxt-link>
        <nuxt-link
          class="profile-redirections-texts"
          active-class="active"
          :to="localePath('/profile/my-payment-methods')"
        >
          {{ $t('profile.myPaymentMethods.title') }}
          <i
            v-if="$route.path.includes('my-payment-methods')"
            class="pi pi-arrow-right"
            style="color: #2b7ee2; font-size: 18px"
          ></i>
        </nuxt-link>
        <nuxt-link
          class="profile-redirections-texts"
          active-class="active"
          :to="localePath('/profile/my-referals')"
        >
          {{ $t('profile.myReferals.title') }}
          <i
            v-if="$route.path.includes('my-referals')"
            class="pi pi-arrow-right"
            style="color: #2b7ee2; font-size: 18px"
          ></i>
        </nuxt-link>
      </template>
    </div>

    <div
      class="lg:tw-w-[75%] tw-pt-3 max-lg:tw-w-full"
      :class="{ 'lg:!tw-w-full': secondSection }"
    >
      <!-- Renders the child page -->
      <NuxtPage />
    </div>
  </div>

  <div
    v-if="
      $route.path.includes('my-profile') &&
      !secondSection &&
      (useSearchItemJson('type', user) === 'vet' ||
        useSearchItemJson('type', user) === 'both')
    "
  >
    <ProfileVetsSecondSection />
  </div>
</template>

<style scoped lang="scss">
.ma-shell {
  width: 100%;
  min-height: 100vh;
  background: #f5f6fa;
  // El header del sitio es fijo (58 px; 88 px si se ve la barra de cupón).
  padding-top: 40px;
}
.ma-shell-mobile-top {
  display: none;
  @media (max-width: 1024px) {
    display: flex;
    justify-content: flex-end;
    padding: 12px 16px 0;
  }
}
.profile-page {
  @apply tw-h-[100%] tw-min-h-[100vh] tw-w-screen tw-flex max-lg:tw-px-4 tw-bg-[#F5F6FA];

  .profile-redirections {
    @apply tw-flex tw-flex-col max-lg:tw-hidden tw-mt-[2rem] lg:tw-min-w-[365px];

    .profile-redirections-texts {
      @apply tw-text-[#575E6B] tw-text-[18px] lg:tw-pl-20 tw-my-5 tw-flex tw-items-center tw-gap-4;
      font-family: 'heading-pro-treble-bold';

      &.router-link-exact-active,
      &.active {
        @apply tw-text-[#2B7EE2];
      }
    }
  }
}
</style>
